import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronRight, Plane, Building, Tent, MapPin, Search, ArrowLeft, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const COLORS = {
  TEAL: "#008080",
  CORAL: "#FF7F50",
  CORAL_LIGHT: "#FF9E7A",
  KHAKI: "#F0E68C",
  KHAKI_DARK: "#857F3E",
  RED: "#FF0000",
  SOFT_GRAY: "#F8F9FA"
};

const ITEMS_PER_PAGE = 20;

interface ListingItem {
  id: string;
  name: string;
  type: string;
  location: string;
  created_at: string;
}

const PendingApprovalItems = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<ListingItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchPendingItems(0);
  }, [user, navigate]);

  const fetchPendingItems = async (fetchOffset: number) => {
    if (fetchOffset === 0) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      const [tripsRes, hotelsRes, adventuresRes] = await Promise.all([
        supabase.from("trips").select("id, name, location, created_at").eq("approval_status", "pending").range(fetchOffset, fetchOffset + ITEMS_PER_PAGE - 1),
        supabase.from("hotels").select("id, name, location, created_at").eq("approval_status", "pending").range(fetchOffset, fetchOffset + ITEMS_PER_PAGE - 1),
        supabase.from("adventure_places").select("id, name, location, created_at").eq("approval_status", "pending").range(fetchOffset, fetchOffset + ITEMS_PER_PAGE - 1),
      ]);

      const allItems: ListingItem[] = [
        ...(tripsRes.data?.map(t => ({ ...t, type: "trip" })) || []),
        ...(hotelsRes.data?.map(h => ({ ...h, type: "hotel" })) || []),
        ...(adventuresRes.data?.map(a => ({ ...a, type: "adventure" })) || []),
      ];

      const sortedItems = allItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      if (fetchOffset === 0) {
        setItems(sortedItems);
        setFilteredItems(sortedItems);
      } else {
        setItems(prev => [...prev, ...sortedItems]);
        setFilteredItems(prev => [...prev, ...sortedItems]);
      }
      
      setOffset(fetchOffset + ITEMS_PER_PAGE);
      setHasMore(allItems.length >= ITEMS_PER_PAGE);
    } catch (error) {
      console.error("Error fetching pending items:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loadingMore) {
      fetchPendingItems(offset);
    }
  };

  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = items.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query)
    );
    setFilteredItems(filtered);
  }, [searchQuery, items]);

  const getIcon = (type: string) => {
    switch (type) {
      case "trip": return Plane;
      case "hotel": return Building;
      case "adventure": return Tent;
      default: return MapPin;
    }
  };

  if (loading) return <div className="min-h-screen bg-[#F8F9FA] animate-pulse" />;

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      <Header className="hidden md:block" />

      {/* Hero Header Section */}
      <div className="bg-white border-b border-slate-100 pt-12 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            className="mb-6 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
          </Button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <Badge className="bg-[#FF7F50] hover:bg-[#FF7F50] border-none px-3 py-1 mb-4 uppercase font-black tracking-widest text-[9px] rounded-full">
                Admin Control
              </Badge>
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none text-slate-900">
                Pending <span style={{ color: COLORS.TEAL }}>Approvals</span>
              </h1>
              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.2em] mt-3">
                Queue Management & Review
              </p>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="SEARCH LISTINGS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 py-6 rounded-2xl border-slate-100 bg-slate-50 font-bold text-[11px] tracking-wider focus-visible:ring-[#008080]"
              />
            </div>
          </div>
        </div>
      </div>

      <main className="container px-4 max-w-4xl mx-auto -mt-8 relative z-10">
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-[28px] p-12 text-center shadow-sm border border-slate-100">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-slate-300" />
            </div>
            <p className="font-black uppercase tracking-widest text-slate-400 text-sm">
              {searchQuery ? "No matches found" : "Queue is empty"}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {filteredItems.map((item) => {
                const Icon = getIcon(item.type);
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(`/admin/review/${item.type}/${item.id}`)}
                    className="w-full bg-white rounded-[24px] p-5 flex items-center justify-between border border-slate-100 shadow-sm hover:shadow-md hover:border-[#008080]/20 transition-all group text-left"
                  >
                    <div className="flex items-center gap-5">
                      <div 
                        className="h-14 w-14 rounded-2xl flex items-center justify-center transition-colors"
                        style={{ backgroundColor: `${COLORS.TEAL}10` }}
                      >
                        <Icon className="h-6 w-6" style={{ color: COLORS.TEAL }} />
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-black uppercase tracking-[0.15em]" style={{ color: COLORS.CORAL }}>
                            {item.type}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            {new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                          </span>
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-tight text-slate-800 leading-tight group-hover:text-[#008080] transition-colors">
                          {item.name}
                        </h3>
                        <div className="flex items-center gap-1 mt-1 text-slate-400">
                          <MapPin className="h-3 w-3" />
                          <span className="text-[10px] font-bold uppercase tracking-wide">{item.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="hidden md:flex flex-col items-end">
                         <Badge variant="outline" className="border-khaki-dark text-[#857F3E] bg-[#F0E68C]/10 font-black text-[9px] uppercase tracking-widest rounded-lg px-3 py-1">
                          Review Required
                        </Badge>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-[#008080] group-hover:text-white transition-all">
                        <ChevronRight className="h-5 w-5" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            
            {hasMore && !searchQuery && (
              <div className="flex justify-center mt-10">
                <Button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="rounded-2xl font-black uppercase text-[10px] tracking-widest h-12 px-8"
                  style={{ background: COLORS.TEAL }}
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More"
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      <MobileBottomBar />
    </div>
  );
};

export default PendingApprovalItems;