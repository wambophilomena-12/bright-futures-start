import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Building, Plane, Tent, Bell, ChevronRight, ArrowLeft, Calendar, QrCode, TrendingUp } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";

const COLORS = {
  TEAL: "#008080",
  CORAL: "#FF7F50",
  CORAL_LIGHT: "#FF9E7A",
  KHAKI: "#F0E68C",
  KHAKI_DARK: "#857F3E",
  RED: "#FF0000",
  SOFT_GRAY: "#F8F9FA"
};

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
  const isMobile = useIsMobile();
  const [hostedItems, setHostedItems] = useState<HostedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchHostedItems = async () => {
      // Fetch all items in parallel
      const [tripsRes, hotelsRes, adventuresRes] = await Promise.all([
        supabase.from("trips").select("id,name,image_url,type").eq("created_by", user.id),
        supabase.from("hotels").select("id,name,image_url").eq("created_by", user.id),
        supabase.from("adventure_places").select("id,name,image_url").eq("created_by", user.id)
      ]);

      const trips = tripsRes.data || [];
      const hotels = hotelsRes.data || [];
      const adventures = adventuresRes.data || [];

      // Get all item IDs for batch booking count
      const allItemIds = [
        ...trips.map(t => t.id),
        ...hotels.map(h => h.id),
        ...adventures.map(a => a.id)
      ];

      // Fetch all booking counts in one query
      let bookingCounts: Record<string, number> = {};
      if (allItemIds.length > 0) {
        const { data: bookingsData } = await supabase
          .from("bookings")
          .select("item_id")
          .in("item_id", allItemIds)
          .in("payment_status", ["paid", "completed"]);
        
        if (bookingsData) {
          bookingsData.forEach(b => {
            bookingCounts[b.item_id] = (bookingCounts[b.item_id] || 0) + 1;
          });
        }
      }

      const allItems: HostedItem[] = [
        ...trips.map(trip => ({
          id: trip.id,
          name: trip.name,
          type: trip.type || "trip",
          image_url: trip.image_url,
          paidBookingsCount: bookingCounts[trip.id] || 0,
        })),
        ...hotels.map(hotel => ({
          id: hotel.id,
          name: hotel.name,
          type: "hotel",
          image_url: hotel.image_url,
          paidBookingsCount: bookingCounts[hotel.id] || 0,
        })),
        ...adventures.map(adventure => ({
          id: adventure.id,
          name: adventure.name,
          type: "adventure",
          image_url: adventure.image_url,
          paidBookingsCount: bookingCounts[adventure.id] || 0,
        }))
      ];

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
        return <Plane className="h-5 w-5" />;
      case "hotel":
        return <Building className="h-5 w-5" />;
      case "adventure":
      case "adventure_place":
        return <Tent className="h-5 w-5" />;
      default:
        return <Calendar className="h-5 w-5" />;
    }
  };

  const totalPaidBookings = hostedItems.reduce((sum, item) => sum + item.paidBookingsCount, 0);

  if (loading) return <div className="min-h-screen bg-[#F8F9FA] animate-pulse" />;

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      <Header className="hidden md:block" />
      
      {/* Hero Header Section */}
      <div className="bg-white border-b border-slate-100 pt-8 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/account")} 
            className="mb-6 hover:bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-widest p-0"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Account
          </Button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <Badge className="bg-[#FF7F50] hover:bg-[#FF7F50] border-none px-3 py-1 mb-3 uppercase font-black tracking-widest text-[10px] rounded-full">
                Host Dashboard
              </Badge>
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none text-slate-900">
                Management
              </h1>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">
                Monitor and verify your active bookings
              </p>
            </div>
            
            <div className="flex gap-4">
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm min-w-[120px]">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Live Items</p>
                <p className="text-2xl font-black text-[#008080]">{hostedItems.length}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm min-w-[120px]">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Paid</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-black text-[#FF7F50]">{totalPaidBookings}</p>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 max-w-4xl -mt-6">
        {/* QR Scanner CTA */}
        {isMobile && (
          <Button 
            onClick={() => navigate("/qr-scanner")} 
            className="w-full mb-8 py-8 rounded-[24px] text-md font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all active:scale-95 border-none"
            style={{ 
                background: `linear-gradient(135deg, ${COLORS.TEAL} 0%, #006666 100%)`,
                boxShadow: `0 12px 24px -8px ${COLORS.TEAL}66`
            }}
          >
            <QrCode className="mr-3 h-6 w-6" />
            Scan Guest QR Code
          </Button>
        )}

        {hostedItems.length === 0 ? (
          <div className="bg-white rounded-[32px] p-12 text-center border border-slate-100 shadow-sm">
            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-10 w-10 text-slate-300" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-slate-800">No active listings</h2>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-2 mb-8">Start hosting to see bookings here</p>
            <Button 
              className="px-8 py-6 rounded-2xl font-black uppercase tracking-widest text-xs"
              style={{ background: COLORS.CORAL }}
              onClick={() => navigate("/become-host")}
            >
              Become a Host
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 mb-4">Your Inventory</h2>
            {hostedItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(`/host-bookings/${item.type}/${item.id}`)}
                className="w-full group bg-white hover:bg-slate-50 transition-all rounded-[28px] p-2 pr-6 border border-slate-100 shadow-sm flex items-center justify-between overflow-hidden"
              >
                <div className="flex items-center gap-4">
                  {/* Item Image/Icon */}
                  <div className="relative h-20 w-20 rounded-[22px] overflow-hidden bg-slate-100">
                    {item.image_url ? (
                        <img src={item.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-300">
                            {getIcon(item.type)}
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/10" />
                  </div>

                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                            {item.type}
                        </span>
                    </div>
                    <p className="font-black text-lg uppercase tracking-tight text-slate-800 leading-tight">
                        {item.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="hidden sm:flex flex-col items-end">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Paid Bookings</p>
                    <p className={`text-xl font-black ${item.paidBookingsCount > 0 ? 'text-[#008080]' : 'text-slate-300'}`}>
                        {item.paidBookingsCount}
                    </p>
                  </div>

                  {item.paidBookingsCount > 0 ? (
                    <div className="h-10 w-10 rounded-full bg-[#008080]/10 flex items-center justify-center">
                        <Bell className="h-4 w-4 text-[#008080] animate-pulse" />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center">
                        <ChevronRight className="h-5 w-5 text-slate-300" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
      
      <MobileBottomBar />
    </div>
  );
};

export default HostBookings;