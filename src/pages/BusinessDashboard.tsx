import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";

const BusinessDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isBusiness, setIsBusiness] = useState(false);
  const [businessType, setBusinessType] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [myListings, setMyListings] = useState<any[]>([]);
  const [myBookings, setMyBookings] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      checkBusinessRole();
    }
  }, [user]);

  const checkBusinessRole = async () => {
    try {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user?.id)
        .eq("role", "business")
        .single();

      if (!roleData) {
        navigate("/");
        return;
      }

      const { data: businessData } = await supabase
        .from("business_accounts")
        .select("business_type")
        .eq("id", user?.id)
        .single();

      if (businessData) {
        setBusinessType(businessData.business_type);
        setIsBusiness(true);
        fetchMyListings(businessData.business_type);
        fetchMyBookings();
      }
    } catch (error) {
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchMyListings = async (type: string) => {
    let listings: any[] = [];

    if (type === "trip_event") {
      const [trips, events] = await Promise.all([
        supabase.from("trips").select("*").eq("created_by", user?.id),
        supabase.from("events").select("*").eq("created_by", user?.id),
      ]);
      listings = [
        ...(trips.data || []).map((item) => ({ ...item, type: "trip" })),
        ...(events.data || []).map((item) => ({ ...item, type: "event" })),
      ];
    } else if (type === "place_adventure") {
      const { data } = await supabase
        .from("adventure_places")
        .select("*")
        .eq("created_by", user?.id);
      listings = (data || []).map((item) => ({ ...item, type: "adventure" }));
    } else if (type === "hotel_accommodation") {
      const { data } = await supabase
        .from("hotels")
        .select("*")
        .eq("created_by", user?.id);
      listings = (data || []).map((item) => ({ ...item, type: "hotel" }));
    }

    setMyListings(listings);
  };

  const fetchMyBookings = async () => {
    // Fetch all bookings where the item belongs to this business owner
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      // Filter bookings that belong to this business owner's items
      const myItemIds = myListings.map((item) => item.id);
      const filteredBookings = data.filter((booking) => 
        myItemIds.includes(booking.item_id)
      );
      setMyBookings(filteredBookings);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "default";
      case "pending": return "secondary";
      case "rejected": return "destructive";
      case "banned": return "destructive";
      default: return "secondary";
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Header />
        <main className="container px-4 py-8">
          <p>Loading...</p>
        </main>
        <Footer />
        <MobileBottomBar />
      </div>
    );
  }

  if (!isBusiness) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      <main className="container px-4 py-8 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Business Dashboard</h1>
          <Button onClick={() => navigate("/create-listing")}>
            <Plus className="h-4 w-4 mr-2" />
            Create Listing
          </Button>
        </div>

        <Tabs defaultValue="listings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="listings">My Listings ({myListings.length})</TabsTrigger>
            <TabsTrigger value="bookings">Bookings ({myBookings.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="space-y-4">
            {myListings.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground mb-4">No listings yet</p>
                <Button onClick={() => navigate("/create-listing")}>
                  Create Your First Listing
                </Button>
              </Card>
            ) : (
              myListings.map((item) => (
                <Card key={item.id} className="p-6">
                  <div className="flex gap-4">
                    <img 
                      src={item.image_url} 
                      alt={item.name}
                      className="w-32 h-32 object-cover rounded"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-semibold">{item.name}</h3>
                        <Badge variant={getStatusColor(item.approval_status)}>
                          {item.approval_status}
                        </Badge>
                        <Badge variant="outline">{item.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                      <p className="text-sm">
                        <span className="font-medium">Location:</span> {item.location}, {item.place}
                      </p>
                      {item.admin_notes && (
                        <p className="text-sm text-destructive">
                          <span className="font-medium">Admin Notes:</span> {item.admin_notes}
                        </p>
                      )}
                      <div className="flex gap-2 mt-4">
                        <Button 
                          onClick={() => navigate(`/${item.type}/${item.id}/edit`)}
                          variant="outline"
                          size="sm"
                        >
                          Edit
                        </Button>
                        <Button 
                          onClick={() => navigate(`/${item.type}/${item.id}`)}
                          variant="ghost"
                          size="sm"
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4">
            {myBookings.length === 0 ? (
              <p className="text-muted-foreground">No bookings yet</p>
            ) : (
              myBookings.map((booking) => (
                <Card key={booking.id} className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Booking ID</p>
                      <p className="font-mono text-xs">{booking.id.slice(0, 8)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Customer Name</p>
                      <p>{booking.guest_name || "Registered User"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="text-sm">{booking.guest_email || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p>{booking.guest_phone || booking.payment_phone || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="text-sm">{new Date(booking.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">People</p>
                      <p>
                        {booking.booking_details.adults || 0} Adults
                        {booking.booking_details.children ? ` • ${booking.booking_details.children} Children` : ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="text-lg font-bold">${booking.total_amount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge>{booking.status}</Badge>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
      <MobileBottomBar />
    </div>
  );
};

export default BusinessDashboard;
