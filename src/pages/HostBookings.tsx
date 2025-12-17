import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Building, Plane, Tent, Bell, ChevronRight, ArrowLeft, Calendar } from "lucide-react";

interface HostedItem {
  id: string;
  name: string;
  type: string;
  image_url: string;
  paidBookingsCount: number;
}

const HostBookings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hostedItems, setHostedItems] = useState<HostedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchHostedItems = async () => {
      // Fetch user's created items
      const { data: trips } = await supabase
        .from("trips")
        .select("id, name, image_url, type")
        .eq("created_by", user.id);

      const { data: hotels } = await supabase
        .from("hotels")
        .select("id, name, image_url")
        .eq("created_by", user.id);

      const { data: adventures } = await supabase
        .from("adventure_places")
        .select("id, name, image_url")
        .eq("created_by", user.id);

      // Get paid booking counts for each item
      const allItems: HostedItem[] = [];

      if (trips) {
        for (const trip of trips) {
          const { count } = await supabase
            .from("bookings")
            .select("*", { count: "exact", head: true })
            .eq("item_id", trip.id)
            .in("booking_type", ["trip", "event"])
            .in("payment_status", ["paid", "completed"]);

          allItems.push({
            id: trip.id,
            name: trip.name,
            type: trip.type || "trip",
            image_url: trip.image_url,
            paidBookingsCount: count || 0,
          });
        }
      }

      if (hotels) {
        for (const hotel of hotels) {
          const { count } = await supabase
            .from("bookings")
            .select("*", { count: "exact", head: true })
            .eq("item_id", hotel.id)
            .eq("booking_type", "hotel")
            .in("payment_status", ["paid", "completed"]);

          allItems.push({
            id: hotel.id,
            name: hotel.name,
            type: "hotel",
            image_url: hotel.image_url,
            paidBookingsCount: count || 0,
          });
        }
      }

      if (adventures) {
        for (const adventure of adventures) {
          const { count } = await supabase
            .from("bookings")
            .select("*", { count: "exact", head: true })
            .eq("item_id", adventure.id)
            .in("booking_type", ["adventure", "adventure_place"])
            .in("payment_status", ["paid", "completed"]);

          allItems.push({
            id: adventure.id,
            name: adventure.name,
            type: "adventure",
            image_url: adventure.image_url,
            paidBookingsCount: count || 0,
          });
        }
      }

      // Sort by booking count (descending)
      allItems.sort((a, b) => b.paidBookingsCount - a.paidBookingsCount);

      setHostedItems(allItems);
      setLoading(false);
    };

    fetchHostedItems();
  }, [user, navigate]);

  const getIcon = (type: string) => {
    switch (type) {
      case "trip":
      case "event":
        return <Plane className="h-6 w-6" />;
      case "hotel":
        return <Building className="h-6 w-6" />;
      case "adventure":
      case "adventure_place":
        return <Tent className="h-6 w-6" />;
      default:
        return <Calendar className="h-6 w-6" />;
    }
  };

  const totalPaidBookings = hostedItems.reduce((sum, item) => sum + item.paidBookingsCount, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-48"></div>
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded"></div>)}
          </div>
        </main>
        <MobileBottomBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate("/account")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Account
        </Button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Host Bookings</h1>
            <p className="text-muted-foreground">View bookings for your hosted items</p>
          </div>
          <div className="text-right">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {hostedItems.length} Items
            </Badge>
            <p className="text-sm text-muted-foreground mt-1">{totalPaidBookings} total paid bookings</p>
          </div>
        </div>

        {hostedItems.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">You are not hosting any items yet.</p>
            <p className="text-sm text-muted-foreground mt-2">Create listings to start receiving bookings</p>
            <Button className="mt-4" onClick={() => navigate("/become-host")}>
              Become a Host
            </Button>
          </Card>
        ) : (
          <Card>
            <div className="divide-y divide-border">
              {hostedItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(`/host-bookings/${item.type}/${item.id}`)}
                  className="w-full flex items-center justify-between p-6 hover:bg-accent transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                      {getIcon(item.type)}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{item.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">{item.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {item.paidBookingsCount > 0 && (
                      <Badge className="bg-green-600 text-white flex items-center gap-1">
                        <Bell className="h-3 w-3" />
                        {item.paidBookingsCount} {item.paidBookingsCount === 1 ? 'Booking' : 'Bookings'}
                      </Badge>
                    )}
                    {item.paidBookingsCount === 0 && (
                      <Badge variant="secondary">No bookings</Badge>
                    )}
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}
      </main>
      <MobileBottomBar />
    </div>
  );
};

export default HostBookings;
