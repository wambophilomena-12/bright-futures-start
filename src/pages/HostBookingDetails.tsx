import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { Mail, Phone, Calendar, Users, DollarSign, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { BookingDownloadButton } from "@/components/booking/BookingDownloadButton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Booking {
  id: string;
  user_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  total_amount: number;
  created_at: string;
  visit_date: string | null;
  slots_booked: number;
  status: string;
  payment_status: string;
  booking_type: string;
  is_guest_booking: boolean;
  booking_details: any;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
}

const HostBookingDetails = () => {
  const { itemType: type, id: itemId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [itemName, setItemName] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedBookings, setExpandedBookings] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchBookings = async () => {
      // Verify ownership
      let ownershipQuery;
      if (type === "trip" || type === "event") {
        ownershipQuery = supabase.from("trips").select("name, created_by").eq("id", itemId).single();
      } else if (type === "hotel") {
        ownershipQuery = supabase.from("hotels").select("name, created_by").eq("id", itemId).single();
      } else if (type === "adventure" || type === "adventure_place") {
        ownershipQuery = supabase.from("adventure_places").select("name, created_by").eq("id", itemId).single();
      }

      if (!ownershipQuery) {
        navigate("/host-bookings");
        return;
      }

      const { data: item } = await ownershipQuery;
      if (!item || item.created_by !== user.id) {
        navigate("/host-bookings");
        return;
      }

      setItemName(item.name);

      // Fetch paid bookings only
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("*")
        .eq("item_id", itemId)
        .in("payment_status", ["paid", "completed"])
        .order("created_at", { ascending: false });

      if (bookingsData) {
        // Fetch user details for non-guest bookings
        const enrichedBookings = await Promise.all(
          bookingsData.map(async (booking) => {
            if (!booking.is_guest_booking && booking.user_id) {
              const { data: profile } = await supabase
                .from("profiles")
                .select("name, email, phone_number")
                .eq("id", booking.user_id)
                .maybeSingle();

              return {
                ...booking,
                userName: profile?.name || "N/A",
                userEmail: profile?.email || "N/A",
                userPhone: profile?.phone_number || "N/A",
              };
            }
            return booking;
          })
        );

        setBookings(enrichedBookings);
      }

      setLoading(false);
    };

    fetchBookings();
  }, [user, type, itemId, navigate]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Pending", variant: "secondary" },
      confirmed: { label: "Confirmed", variant: "default" },
      cancelled: { label: "Cancelled", variant: "destructive" },
      completed: { label: "Completed", variant: "outline" },
    };
    const config = statusConfig[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const toggleExpanded = (bookingId: string) => {
    setExpandedBookings(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bookingId)) {
        newSet.delete(bookingId);
      } else {
        newSet.add(bookingId);
      }
      return newSet;
    });
  };

  const getGuestInfo = (booking: Booking) => ({
    name: booking.is_guest_booking ? booking.guest_name : booking.userName,
    email: booking.is_guest_booking ? booking.guest_email : booking.userEmail,
    phone: booking.is_guest_booking ? booking.guest_phone : booking.userPhone,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-48"></div>
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted rounded"></div>)}
          </div>
        </main>
        <MobileBottomBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0">
      <Header />
      <main className="flex-1 container px-4 py-8 max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/host-bookings")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Host Bookings
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Bookings for {itemName}</h1>
          <p className="text-muted-foreground">Total Paid Bookings: {bookings.length}</p>
        </div>

        {bookings.length === 0 ? (
          <Card className="p-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No paid bookings yet for this item.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const isExpanded = expandedBookings.has(booking.id);
              const guest = getGuestInfo(booking);
              const details = booking.booking_details as Record<string, any> | null;

              return (
                <Card key={booking.id} className="overflow-hidden">
                  <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(booking.id)}>
                    <div className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3 flex-wrap">
                            {getStatusBadge(booking.status)}
                            <Badge className="bg-green-500/10 text-green-600">Paid</Badge>
                            <Badge variant="outline" className="capitalize">{booking.booking_type}</Badge>
                          </div>

                          <h3 className="text-xl font-semibold">{guest.name || 'Guest'}</h3>
                          
                          <p className="text-xs text-muted-foreground font-mono">Booking ID: {booking.id}</p>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span className="truncate">{guest.email || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{guest.phone || 'N/A'}</span>
                            </div>
                            {booking.visit_date && (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>{format(new Date(booking.visit_date), 'PP')}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>{booking.slots_booked} people</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 items-end">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-primary" />
                            <span className="text-2xl font-bold">KES {booking.total_amount.toLocaleString()}</span>
                          </div>

                          <BookingDownloadButton
                            booking={{
                              bookingId: booking.id,
                              guestName: guest.name || 'Guest',
                              guestEmail: guest.email || '',
                              guestPhone: guest.phone || undefined,
                              itemName: itemName,
                              bookingType: booking.booking_type,
                              visitDate: booking.visit_date || booking.created_at,
                              totalAmount: booking.total_amount,
                              slotsBooked: booking.slots_booked || 1,
                              adults: details?.adults,
                              children: details?.children,
                              paymentStatus: booking.payment_status,
                              facilities: details?.facilities,
                              activities: details?.activities,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full rounded-none border-t h-10">
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-2" />
                            Hide Details
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-2" />
                            View Details
                          </>
                        )}
                      </Button>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="p-6 pt-0 border-t bg-muted/30">
                        <div className="grid md:grid-cols-2 gap-6 mt-4">
                          <div className="space-y-3">
                            <h4 className="font-semibold text-sm text-muted-foreground uppercase">Booking Info</h4>
                            <div className="space-y-2 text-sm">
                              <p><span className="text-muted-foreground">Booked On:</span> {format(new Date(booking.created_at), 'PPP')}</p>
                              {details?.adults !== undefined && (
                                <p><span className="text-muted-foreground">Adults:</span> {details.adults}</p>
                              )}
                              {details?.children !== undefined && details.children > 0 && (
                                <p><span className="text-muted-foreground">Children:</span> {details.children}</p>
                              )}
                            </div>
                          </div>

                          {details?.facilities && details.facilities.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="font-semibold text-sm text-muted-foreground uppercase">Facilities</h4>
                              <div className="space-y-1 text-sm">
                                {details.facilities.map((f: any, idx: number) => (
                                  <p key={idx}>{f.name} - {f.price === 0 ? 'Free' : `KES ${f.price}`}</p>
                                ))}
                              </div>
                            </div>
                          )}

                          {details?.activities && details.activities.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="font-semibold text-sm text-muted-foreground uppercase">Activities</h4>
                              <div className="space-y-1 text-sm">
                                {details.activities.map((a: any, idx: number) => (
                                  <p key={idx}>{a.name} - {a.price === 0 ? 'Free' : `KES ${a.price}`}</p>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <MobileBottomBar />
    </div>
  );
};

export default HostBookingDetails;
