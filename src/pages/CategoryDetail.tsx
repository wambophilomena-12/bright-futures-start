import { useState, useEffect, useRef, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { SearchBarWithSuggestions } from "@/components/SearchBarWithSuggestions";
import { ListingCard } from "@/components/ListingCard";
import { FilterBar } from "@/components/FilterBar";
import { ListingGridSkeleton } from "@/components/ui/listing-skeleton";
import { supabase } from "@/integrations/supabase/client";
import { getUserId } from "@/lib/sessionManager";
import { cn } from "@/lib/utils";
import { useSavedItems } from "@/hooks/useSavedItems";
import { useGeolocation, calculateDistance } from "@/hooks/useGeolocation";
import { useRatings, sortByRating } from "@/hooks/useRatings";

const CategoryDetail = () => {
  const { category } = useParams<{ category: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const { savedItems, handleSave } = useSavedItems();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  const { position } = useGeolocation();
  const [showSearchIcon, setShowSearchIcon] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const categoryConfig: { [key: string]: any } = {
    trips: { title: "Trips", tables: ["trips"], type: "TRIP" },
    events: { title: "Events", tables: ["trips"], type: "EVENT", eventType: "event" },
    hotels: { title: "Hotels", tables: ["hotels"], type: "HOTEL" },
    adventure: { title: "Attractions", tables: ["attractions"], type: "ATTRACTION" },
    campsite: { title: "Campsite & Experience", tables: ["adventure_places"], type: "ADVENTURE PLACE" }
  };

  const config = category ? categoryConfig[category] : null;

  useEffect(() => {
    const initializeData = async () => {
      const uid = await getUserId();
      setUserId(uid);
      loadInitialData();
    };
    initializeData();
  }, [category]);

  // Handle Header Search Icon visibility only
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // If user scrolls down on desktop, show the icon in the main header
      if (window.innerWidth >= 768) {
        setShowSearchIcon(currentScrollY > 100);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    const data = await fetchData(0, 20);
    setItems(data);
    setLoading(false);
  };

  const fetchData = async (offset: number, limit: number) => {
    if (!config) return [];
    const allData: any[] = [];
    for (const table of config.tables) {
      const { data } = await supabase
        .from(table as any)
        .select("*")
        .range(offset, offset + limit - 1);
      if (data) allData.push(...data.map((item: any) => ({ ...item, table })));
    }
    return allData;
  };

  const itemIds = useMemo(() => items.map(item => item.id), [items]);
  const { ratings } = useRatings(itemIds);

  useEffect(() => {
    setFilteredItems(sortByRating(items, ratings, position, calculateDistance));
  }, [items, position, ratings]);

  const handleSearch = () => {
    const filtered = items.filter(item => 
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.location?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredItems(filtered);
  };

  if (!config) return <div className="p-10 text-center">Category not found</div>;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-10">
      {/* HEADER: Standard navigation header */}
      <div className="hidden md:block">
        <Header onSearchClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} showSearchIcon={showSearchIcon} />
      </div>

      {/* SEARCH BAR: STICKY AT TOP FOR BOTH MOBILE AND DESKTOP */}
      <div 
        ref={searchRef} 
        className={cn(
          "bg-white dark:bg-background border-b z-50 transition-all duration-300",
          "sticky top-0", // This keeps it at the very top on scroll
          isSearchFocused && "z-[600]"
        )}
      >
        <div className="container px-4 py-3">
          <SearchBarWithSuggestions 
            value={searchQuery} 
            onChange={setSearchQuery} 
            onSubmit={handleSearch} 
            onFocus={() => setIsSearchFocused(true)} 
            onBlur={() => setIsSearchFocused(false)} 
            onBack={() => {
              setIsSearchFocused(false);
              setSearchQuery("");
            }} 
            showBackButton={isSearchFocused} 
          />
        </div>
      </div>

      {/* FILTER BAR: RELATIVE (Will scroll away with the page content) */}
      <div className={cn(
        "bg-background border-b relative z-10",
        isSearchFocused && "opacity-0 pointer-events-none"
      )}>
        <div className="container px-4 py-3">
          <FilterBar 
            type={category === "hotels" ? "hotels" : "trips-events"} 
            onApplyFilters={(filters) => {
              console.log("Filters applied:", filters);
              // Implement filter logic here if needed
            }} 
          />
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className={cn(
        "container px-4 py-6 space-y-4 transition-opacity duration-200", 
        isSearchFocused && "pointer-events-none opacity-20"
      )}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
          {loading ? (
            <ListingGridSkeleton count={10} />
          ) : (
            filteredItems.map(item => (
              <ListingCard 
                key={item.id} 
                id={item.id} 
                type={item.table.toUpperCase()} 
                name={item.name} 
                imageUrl={item.image_url} 
                location={item.location} 
                country={item.country || ""}
                price={item.price} 
                onSave={handleSave} 
                isSaved={savedItems.has(item.id)} 
              />
            ))
          )}
        </div>

        {!loading && filteredItems.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            No items found matching your search.
          </div>
        )}
      </main>

      <MobileBottomBar />
    </div>
  );
};

export default CategoryDetail;