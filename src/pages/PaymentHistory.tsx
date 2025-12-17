import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, Receipt, Calendar, Users, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { BookingDownloadButton } from "@/components/booking/BookingDownloadButton";

interface Booking {
  id: string;
  booking_type: string;
  total_amount: number;
  booking_details: any;
  payment_status: string;
  status: string;
  created_at: string;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  slots_booked: number | null;
  visit_date: string | null;
  item_id: string;
}

interface ItemDetails {
  name: string;
  type: string;
}

export default function PaymentHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [itemDetails, setItemDetails] = useState<Record<string, ItemDetails>>({});

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchBookings();
  }, [user, navigate]);

  const fetchBookings = async () => {
    try {
      // Fetch only paid/completed bookings
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", user?.id)
        .in("payment_status", ["paid", "completed"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Filter out expired trips/events (unless they're flexible)
      const now = new Date();
      const validBookings = (data || []).filter(booking => {
        if (booking.booking_type === 'trip' || booking.booking_type === 'event') {
          // Check if visit date has passed
          if (booking.visit_date) {
            const visitDate = new Date(booking.visit_date);
            if (visitDate < now) {
              // Check booking details for flexible trip
              const details = booking.booking_details as Record<string, any> | null;
              const isFlexible = details?.is_flexible_date || details?.is_custom_date;
              return isFlexible;
            }
          }
        }
        return true;
      });

      setBookings(validBookings);
      
      // Fetch item details
      const itemIds = [...new Set(validBookings.map(b => ({ id: b.item_id, type: b.booking_type })))];
      await fetchItemDetails(itemIds);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchItemDetails = async (items: { id: string; type: string }[]) => {
    const details: Record<string, ItemDetails> = {};

    for (const item of items) {
      try {
        let data: any = null;
        if (item.type === "trip" || item.type === "event") {
          const { data: tripData } = await supabase
            .from("trips")
            .select("name")
            .eq("id", item.id)
            .maybeSingle();
          data = tripData;
        } else if (item.type === "hotel") {
          const { data: hotelData } = await supabase
            .from("hotels")
            .select("name")
            .eq("id", item.id)
            .maybeSingle();
          data = hotelData;
        } else if (item.type === "adventure" || item.type === "adventure_place") {
          const { data: adventureData } = await supabase
            .from("adventure_places")
            .select("name")
            .eq("id", item.id)
            .maybeSingle();
          data = adventureData;
        }

        if (data) {
          details[item.id] = { name: data.name, type: item.type };
        }
      } catch (error) {
        console.error("Error fetching item details:", error);
      }
    }

    setItemDetails(details);
  };

  const getBookingTypeBadge = (type: string) => {
    const typeLabels: Record<string, string> = {
      trip: "Trip",
      event: "Event",
      hotel: "Hotel",
      adventure: "Adventure",
      adventure_place: "Adventure",
    };
    return <Badge variant="outline">{typeLabels[type] || type}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-48 mb-8" />
          <div className="max-w-4xl mx-auto space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </main>
        <MobileBottomBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <h1 className="text-3xl font-bold mb-2 text-foreground">Payment History</h1>
          <p className="text-muted-foreground mb-8">View your completed bookings and payments</p>

          {bookings.length === 0 ? (
            <Card className="p-12 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">No completed payments found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Your paid bookings will appear here
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <Card key={booking.id} className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-center gap-3 flex-wrap">
                        {getBookingTypeBadge(booking.booking_type)}
                        <Badge className="bg-green-500/10 text-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Paid
                        </Badge>
                      </div>

                      {/* Item Name */}
                      <h3 className="text-xl font-semibold">
                        {itemDetails[booking.item_id]?.name || booking.booking_details?.trip_name || booking.booking_details?.hotel_name || booking.booking_details?.place_name || 'Booking'}
                      </h3>

                      {/* Booking ID */}
                      <p className="text-xs text-muted-foreground font-mono">
                        ID: {booking.id}
                      </p>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        {booking.visit_date && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(booking.visit_date), 'PP')}</span>
                          </div>
                        )}
                        {booking.slots_booked && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{booking.slots_booked} people</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Side - Amount & Actions */}
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total Paid</p>
                        <p className="text-2xl font-bold text-primary">
                          KES {booking.total_amount.toLocaleString()}
                        </p>
                      </div>
                      
                      <BookingDownloadButton
                        booking={{
                          bookingId: booking.id,
                          guestName: booking.guest_name || 'Guest',
                          guestEmail: booking.guest_email || '',
                          guestPhone: booking.guest_phone || undefined,
                          itemName: itemDetails[booking.item_id]?.name || booking.booking_details?.trip_name || booking.booking_details?.hotel_name || 'Booking',
                          bookingType: booking.booking_type,
                          visitDate: booking.visit_date || booking.created_at,
                          totalAmount: booking.total_amount,
                          slotsBooked: booking.slots_booked || 1,
                          adults: booking.booking_details?.adults,
                          children: booking.booking_details?.children,
                          paymentStatus: booking.payment_status,
                          facilities: booking.booking_details?.facilities,
                          activities: booking.booking_details?.activities,
                        }}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <MobileBottomBar />
    </div>
  );
}
