import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Calendar, Users, Mail, Phone, Ticket, LayoutDashboard, CheckCircle2, ArrowRight } from "lucide-react";

const COLORS = {
  TEAL: "#008080",
  CORAL: "#FF7F50",
  CORAL_LIGHT: "#FF9E7A",
  KHAKI: "#F0E68C",
  KHAKI_DARK: "#857F3E",
  RED: "#FF0000",
  SOFT_GRAY: "#F8F9FA"
};

const CreatorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchData = async () => {
      const userEmail = user?.email;

      // Fetch all item IDs in parallel
      const [tripsRes, hotelsRes, adventuresRes, hotelsAdminRes, adventuresAdminRes] = await Promise.all([
        supabase.from("trips").select("id").eq("created_by", user.id),
        supabase.from("hotels").select("id").eq("created_by", user.id),
        supabase.from("adventure_places").select("id").eq("created_by", user.id),
        userEmail ? supabase.from("hotels").select("id").contains("allowed_admin_emails", [userEmail]) : Promise.resolve({ data: [] }),
        userEmail ? supabase.from("adventure_places").select("id").contains("allowed_admin_emails", [userEmail]) : Promise.resolve({ data: [] })
      ]);

      const allIds = [
        ...(tripsRes.data?.map(t => t.id) || []),
        ...(hotelsRes.data?.map(h => h.id) || []),
        ...(adventuresRes.data?.map(a => a.id) || []),
        ...(hotelsAdminRes.data?.map(h => h.id) || []),
        ...(adventuresAdminRes.data?.map(a => a.id) || [])
      ];

      if (allIds.length > 0) {
        const { data } = await supabase
          .from("creator_booking_summary")
          .select("id,item_id,booking_type,status,payment_status,total_amount,created_at,guest_name_masked,guest_email_limited,guest_phone_limited,booking_details")
          .in("item_id", allIds)
          .eq("payment_status", "paid")
          .order("created_at", { ascending: false });
        setBookings(data || []);
      }
      
      setLoading(false);
    };

    fetchData();
  }, [user, navigate]);

  const getBookingsByType = (type: string) => bookings.filter(b => b.booking_type === type);

  const renderBookings = (type: string, title: string) => {
    const items = getBookingsByType(type);
    
    if (items.length === 0) {
      return (
        <div className="text-center py-20 bg-white rounded-[28px] border-2 border-dashed border-slate-100">
          <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Ticket className="text-slate-300 h-8 w-8" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">No Confirmed {title}</p>
        </div>
      );
    }

    return (
      <div className="grid gap-6">
        {items.map((booking) => {
          const details = booking.booking_details as any;
          const guestInitial = booking.guest_name_masked?.charAt(0) || "G";
          
          return (
            <Card key={booking.id} className="overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-[28px] bg-white group">
              <div className="p-1">
                 {/* Top Status Bar */}
                <div className="flex justify-between items-center px-6 py-3 bg-slate-50/50 rounded-t-[24px]">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Confirmed Booking</span>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">ID: {booking.id.slice(0, 8)}</span>
                </div>

                <div className="p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    {/* Guest Profile Info */}
                    <div className="flex items-start gap-4">
                      <div 
                        className="h-14 w-14 rounded-2xl flex items-center justify-center shadow-inner shrink-0"
                        style={{ backgroundColor: `${COLORS.TEAL}15` }}
                      >
                        <span className="text-xl font-black" style={{ color: COLORS.TEAL }}>{guestInitial}</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-black uppercase tracking-tight leading-none mb-1" style={{ color: COLORS.TEAL }}>
                            {details?.hotel_name || details?.place_name || details?.trip_name || "Untitled Product"}
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-600">{booking.guest_name_masked || "Guest"}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[10px] font-black uppercase tracking-tighter" style={{ color: COLORS.CORAL }}>KSh {booking.total_amount}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 md:w-1/3">
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <Calendar className="h-3 w-3 mb-1" style={{ color: COLORS.CORAL }} />
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Visit Date</p>
                            <p className="text-[11px] font-bold text-slate-700">
                                {details?.date ? new Date(details.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'N/A'}
                            </p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <Users className="h-3 w-3 mb-1" style={{ color: COLORS.CORAL }} />
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Guests</p>
                            <p className="text-[11px] font-bold text-slate-700">
                                {details?.adults || 0}A, {details?.children || 0}C
                            </p>
                        </div>
                    </div>
                  </div>

                  <div className="mt-6 grid md:grid-cols-2 gap-4">
                    {/* Contact Pills */}
                    <div className="space-y-2">
                        {booking.guest_email_limited && (
                            <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl">
                                <Mail className="h-4 w-4 text-slate-400" />
                                <span className="text-xs font-bold text-slate-600">{booking.guest_email_limited}</span>
                            </div>
                        )}
                        {booking.guest_phone_limited && (
                            <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl">
                                <Phone className="h-4 w-4 text-slate-400" />
                                <span className="text-xs font-bold text-slate-600">{booking.guest_phone_limited}</span>
                            </div>
                        )}
                    </div>

                    {/* Activity Chips */}
                    <div className="flex flex-wrap gap-2 content-start">
                        {(details?.activities || []).map((act: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-1.5 bg-[#F0E68C]/20 px-3 py-1.5 rounded-lg border border-[#F0E68C]/50">
                                <CheckCircle2 className="h-3 w-3 text-[#857F3E]" />
                                <span className="text-[9px] font-black text-[#857F3E] uppercase tracking-wide">{act.name}</span>
                            </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="animate-spin rounded-2xl h-12 w-12 border-4 border-[#008080] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      <Header />
      
      <main className="flex-1 container max-w-5xl mx-auto px-4 py-12">
        {/* Dashboard Header */}
        <div className="flex items-center gap-4 mb-10">
            <div className="p-4 rounded-[22px] bg-white shadow-sm border border-slate-100">
                <LayoutDashboard className="h-6 w-6" style={{ color: COLORS.TEAL }} />
            </div>
            <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter leading-none" style={{ color: COLORS.TEAL }}>
                    Creator Portal
                </h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Managing confirmed guest reservations</p>
            </div>
        </div>

        <Tabs defaultValue="trips" className="w-full">
          <TabsList className="bg-white p-1.5 rounded-[24px] border border-slate-100 h-auto grid grid-cols-3 mb-10 shadow-sm">
            {['trips', 'hotels', 'adventure_place'].map((tab) => (
              <TabsTrigger 
                key={tab}
                value={tab} 
                className="rounded-[18px] py-4 font-black uppercase text-[10px] tracking-widest data-[state=active]:text-white"
                style={{
                  '--active-bg': tab === 'trips' ? COLORS.TEAL : tab === 'hotels' ? COLORS.CORAL : COLORS.KHAKI_DARK
                } as any}
              >
                {tab.replace('_', ' ')}
              </TabsTrigger>
            ))}
          </TabsList>

          <style>{`
            button[data-state=active] { background-color: var(--active-bg) !important; }
          `}</style>

          <TabsContent value="trips" className="mt-0 space-y-8 outline-none">
            <SectionHeader title="Active Trips" count={getBookingsByType('trip').length} />
            {renderBookings('trip', 'Trips')}
          </TabsContent>

          <TabsContent value="hotels" className="mt-0 space-y-8 outline-none">
            <SectionHeader title="Hotel Stays" count={getBookingsByType('hotel').length} />
            {renderBookings('hotel', 'Hotels')}
          </TabsContent>

          <TabsContent value="adventure_place" className="mt-0 space-y-8 outline-none">
            <SectionHeader title="Campsites & Experiences" count={getBookingsByType('adventure_place').length} />
            {renderBookings('adventure_place', 'Experiences')}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
      <MobileBottomBar />
    </div>
  );
};

const SectionHeader = ({ title, count }: { title: string, count: number }) => (
    <div className="flex items-end justify-between px-2">
        <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-800">{title}</h2>
            <div className="h-1.5 w-12 rounded-full mt-2" style={{ backgroundColor: COLORS.CORAL }} />
        </div>
        <div className="bg-white border border-slate-100 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confirmed</span>
            <span className="text-lg font-black" style={{ color: COLORS.TEAL }}>{count}</span>
        </div>
    </div>
);

export default CreatorDashboard;