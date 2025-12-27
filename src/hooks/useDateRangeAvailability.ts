import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, eachDayOfInterval, parseISO } from "date-fns";

interface DateRangeAvailability {
  isAvailable: boolean;
  unavailableDates: string[];
  loading: boolean;
  error: string | null;
  checkAvailability: (startDate: string, endDate: string) => Promise<void>;
}

export const useDateRangeAvailability = (
  itemId: string | undefined,
  totalCapacity: number
): DateRangeAvailability => {
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const checkAvailability = useCallback(async (startDate: string, endDate: string) => {
    if (!itemId || !startDate || !endDate) {
      setIsAvailable(true);
      setUnavailableDates([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get all dates in the range
      const dates = eachDayOfInterval({
        start: parseISO(startDate),
        end: parseISO(endDate),
      });

      const dateStrings = dates.map(d => format(d, 'yyyy-MM-dd'));

      // Fetch availability for all dates in the range
      const { data: availability, error: fetchError } = await supabase
        .from('item_availability_by_date')
        .select('visit_date, booked_slots')
        .eq('item_id', itemId)
        .in('visit_date', dateStrings);

      if (fetchError) {
        throw fetchError;
      }

      // Check each date for availability
      const unavailable: string[] = [];
      const availabilityMap = new Map(
        (availability || []).map(a => [a.visit_date, a.booked_slots])
      );

      for (const dateStr of dateStrings) {
        const bookedSlots = availabilityMap.get(dateStr) || 0;
        const remainingSlots = totalCapacity - bookedSlots;
        
        if (remainingSlots <= 0) {
          unavailable.push(dateStr);
        }
      }

      setUnavailableDates(unavailable);
      setIsAvailable(unavailable.length === 0);
      
      if (unavailable.length > 0) {
        setError(`The following dates are fully booked: ${unavailable.map(d => format(parseISO(d), 'MMM d')).join(', ')}`);
      } else {
        setError(null);
      }
    } catch (err: any) {
      console.error('Error checking date range availability:', err);
      setError('Failed to check availability');
      setIsAvailable(false);
    } finally {
      setLoading(false);
    }
  }, [itemId, totalCapacity]);

  return {
    isAvailable,
    unavailableDates,
    loading,
    error,
    checkAvailability,
  };
};

// Hook for checking single facility availability within a date range
export const useFacilityRangeAvailability = (itemId: string | undefined) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [existingBookings, setExistingBookings] = useState<any[]>([]);

  useEffect(() => {
    const fetchExistingBookings = async () => {
      if (!itemId) return;
      
      const { data } = await supabase
        .from('bookings')
        .select('booking_details, visit_date')
        .eq('item_id', itemId)
        .in('status', ['confirmed', 'pending'])
        .in('payment_status', ['paid', 'completed', 'pending']);
      
      setExistingBookings(data || []);
    };

    fetchExistingBookings();
  }, [itemId]);

  const checkFacilityAvailability = useCallback((
    facilityName: string,
    startDate: string,
    endDate: string
  ): { isAvailable: boolean; conflictMessage: string | null } => {
    if (!startDate || !endDate) {
      return { isAvailable: true, conflictMessage: null };
    }

    const newStart = new Date(startDate).getTime();
    const newEnd = new Date(endDate).getTime();

    for (const booking of existingBookings) {
      const details = booking.booking_details as any;
      const bookedFacilities = details?.selectedFacilities || details?.facilities || [];
      
      for (const bookedFacility of bookedFacilities) {
        if (bookedFacility.name === facilityName) {
          const bookedStart = new Date(bookedFacility.startDate || booking.visit_date).getTime();
          const bookedEnd = new Date(bookedFacility.endDate || booking.visit_date).getTime();
          
          // Check for overlap
          if (newStart <= bookedEnd && newEnd >= bookedStart) {
            return {
              isAvailable: false,
              conflictMessage: `${facilityName} is already booked from ${format(new Date(bookedFacility.startDate || booking.visit_date), 'MMM d')} to ${format(new Date(bookedFacility.endDate || booking.visit_date), 'MMM d, yyyy')}`
            };
          }
        }
      }
    }
    
    return { isAvailable: true, conflictMessage: null };
  }, [existingBookings]);

  const refetchBookings = useCallback(async () => {
    if (!itemId) return;
    setLoading(true);
    
    const { data } = await supabase
      .from('bookings')
      .select('booking_details, visit_date')
      .eq('item_id', itemId)
      .in('status', ['confirmed', 'pending'])
      .in('payment_status', ['paid', 'completed', 'pending']);
    
    setExistingBookings(data || []);
    setLoading(false);
  }, [itemId]);

  return {
    loading,
    checkFacilityAvailability,
    refetchBookings,
    existingBookings,
  };
};
