import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BookingStats {
  [itemId: string]: number;
}

export const useRealtimeBookings = (itemIds: string[]) => {
  const [bookingStats, setBookingStats] = useState<BookingStats>({});

  const fetchBookingStats = useCallback(async () => {
    if (itemIds.length === 0) return;

    // Only count bookings that are confirmed/pending AND have paid/completed payment
    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('item_id, slots_booked')
      .in('item_id', itemIds)
      .in('status', ['confirmed', 'pending'])
      .in('payment_status', ['paid', 'completed']);

    if (bookingsData) {
      const stats: BookingStats = {};
      bookingsData.forEach(booking => {
        const current = stats[booking.item_id] || 0;
        stats[booking.item_id] = current + (booking.slots_booked || 0);
      });
      setBookingStats(stats);
    }
  }, [itemIds]);

  useEffect(() => {
    fetchBookingStats();

    // Subscribe to real-time changes on the bookings table
    const channel = supabase
      .channel('bookings-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'bookings'
        },
        (payload) => {
          console.log('Booking change detected:', payload);
          // Refetch stats when any booking changes
          fetchBookingStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBookingStats]);

  return { bookingStats, refetch: fetchBookingStats };
};

// Hook for a single item's real-time availability
export const useRealtimeItemAvailability = (itemId: string | undefined, totalCapacity: number) => {
  const [bookedSlots, setBookedSlots] = useState(0);

  const fetchBookedSlots = useCallback(async () => {
    if (!itemId) return;

    // Only count bookings that are confirmed/pending AND have paid/completed payment
    const { data } = await supabase
      .from('bookings')
      .select('slots_booked')
      .eq('item_id', itemId)
      .in('status', ['confirmed', 'pending'])
      .in('payment_status', ['paid', 'completed']);

    const total = data?.reduce((sum, b) => sum + (b.slots_booked || 0), 0) || 0;
    setBookedSlots(total);
  }, [itemId]);

  useEffect(() => {
    fetchBookedSlots();

    if (!itemId) return;

    // Subscribe to real-time changes for this specific item
    const channel = supabase
      .channel(`booking-${itemId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `item_id=eq.${itemId}`
        },
        (payload) => {
          console.log('Item booking change:', payload);
          fetchBookedSlots();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [itemId, fetchBookedSlots]);

  const remainingSlots = Math.max(0, totalCapacity - bookedSlots);
  const isSoldOut = totalCapacity > 0 && remainingSlots <= 0;

  return { bookedSlots, remainingSlots, isSoldOut, refetch: fetchBookedSlots };
};
