import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  ChevronRight, Plane, Building, Tent, MapPin, 
  Search, ArrowLeft, XCircle, AlertCircle, Loader2 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const COLORS = {
  TEAL: "#008080",
  CORAL: "#FF7F50",
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

const RejectedItems = () => {
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
    fetchRejectedItems(0);
  }, [user, navigate]);

  const fetchRejectedItems = async (fetchOffset: number) => {
    if (fetchOffset === 0) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      const [tripsRes, hotelsRes, adventuresRes] = await Promise.all([
        supabase.from("trips").select("id, name, location, created_at").eq("approval_status", "rejected").range(fetchOffset, fetchOffset + ITEMS_PER_PAGE - 1),
        supabase.from("hotels").select("id, name, location, created_at").eq("approval_status", "rejected").range(fetchOffset, fetchOffset + ITEMS_PER_PAGE - 1),
        supabase.from("adventure_places").select("id, name, location, created_at").eq("approval_status", "rejected").range(fetchOffset, fetchOffset + ITEMS_PER_PAGE - 1),
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
      console.error("Error fetching rejected items:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loadingMore) {
      fetchRejectedItems(offset);
    }
  };

  useEffect(() => {
    const query = searchQuery.toLowerCase().trim();
    if (query === "") {
      setFilteredItems(items);
    } else {
      setFilteredItems(items.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query)
      ));
    }
  }, [searchQuery, items]);

  const getIcon = (type: string) => {
    switch (type) {
      case "trip": return Plane;
      case "hotel": return Building;
      case "adventure": return Tent;
      default: return MapPin;
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#F8F9FA] animate-pulse" />;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      <Header className="hidden md:block" />

      <main className="container px-4 py-8 max-w-4xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="flex flex-col space-y-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="w-fit rounded-full bg-white shadow-sm border border-slate-100 hover:bg-slate-50 text-slate-600 px-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Dashboard</span>
          </Button>
          
          <div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-2" style={{ color: COLORS.TEAL }}>
              Rejected <span style={{ color: COLORS.RED }}>Listings</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              Review and update items that require changes
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8 group">
          <div className="absolute inset-0 bg-[#FF7F50]/5 blur-xl rounded-3xl group-focus-within:bg-[#FF7F50]/10 transition-all" />
          <div className="relative flex items-center">
            <Search className="absolute left-4 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="SEARCH BY NAME OR LOCATION..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-16 rounded-[24px] border-none bg-white shadow-xl text-sm font-bold placeholder:text-slate-300 focus-visible:ring-2 focus-visible:ring-[#FF7F50]"
            />
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-[32px] p-12 text-center shadow-sm border border-slate-100">
            <XCircle className="h-12 w-12 mx-auto mb-4 text-slate-200" />
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
              {searchQuery ? "No matching results found" : "No rejected items at this time"}
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
                    className="w-full text-left bg-white rounded-[28px] p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 group relative overflow-hidden"
                  >
                    {/* Accent Border */}
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500" />
                    
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-5">
                        <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-red-50 transition-colors">
                          <Icon className="h-6 w-6 text-slate-400 group-hover:text-red-500" />
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-2 py-0.5 rounded">
                              {item.type}
                            </span>
                            <span className="text-[9px] font-bold text-slate-300 uppercase">
                              {new Date(item.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <h3 className="text-lg font-black uppercase tracking-tight text-slate-800 leading-none mb-1">
                            {item.name}
                          </h3>
                          <div className="flex items-center gap-1 text-slate-400">
                            <MapPin className="h-3 w-3" />
                            <span className="text-[10px] font-bold uppercase tracking-tight">{item.location}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        <Badge className="bg-red-500 hover:bg-red-600 text-white border-none px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                          Action Required
                        </Badge>
                        <div className="bg-slate-50 p-2 rounded-xl group-hover:bg-[#008080] transition-colors">
                          <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-white" />
                        </div>
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
                  style={{ background: COLORS.RED }}
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

        {/* Footer Info */}
        <div className="mt-8 flex items-center justify-center gap-2 text-slate-400">
            <AlertCircle className="h-4 w-4" />
            <p className="text-[9px] font-bold uppercase tracking-widest">Click an item to see rejection reasons and edit</p>
        </div>
      </main>

      <MobileBottomBar />
    </div>
  );
};

export default RejectedItems;