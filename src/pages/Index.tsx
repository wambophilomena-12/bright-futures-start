import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { SearchBarWithSuggestions } from "@/components/SearchBarWithSuggestions";
import { ListingCard } from "@/components/ListingCard";
import { Card } from "@/components/ui/card";
import {
  Calendar,
  Hotel,
  Tent,
  Compass,
  Grid,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getUserId } from "@/lib/sessionManager";
import { useGeolocation, calculateDistance } from "@/hooks/useGeolocation";
import { ListingSkeleton } from "@/components/ui/listing-skeleton";
import { useSavedItems } from "@/hooks/useSavedItems";
import {
  getCachedHomePageData,
  setCachedHomePageData
} from "@/hooks/useHomePageCache";

const MapView = lazy(() =>
  import("@/components/MapView").then((m) => ({ default: m.MapView }))
);

const Index = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  const { savedItems, handleSave } = useSavedItems();
  const { position, requestLocation } = useGeolocation();

  const featuredForYouRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleInteraction = () => {
      requestLocation();
      window.removeEventListener("click", handleInteraction);
    };
    window.addEventListener("click", handleInteraction, { once: true });
    return () =>
      window.removeEventListener("click", handleInteraction);
  }, [requestLocation]);

  useEffect(() => {
    getUserId().then(setUserId);
  }, []);

  const categories = [
    {
      icon: Calendar,
      title: "Trips & Tours",
      path: "/category/trips",
      bgImage:
        "https://images.unsplash.com/photo-1488646953014-85cb44e25828",
      description: "Explore guided tours"
    },
    {
      icon: Compass,
      title: "Sports & Events",
      path: "/category/events",
      bgImage:
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30",
      description: "Live experiences"
    },
    {
      icon: Hotel,
      title: "Hotels",
      path: "/category/hotels",
      bgImage:
        "https://images.unsplash.com/photo-1566073771259-6a8506099945",
      description: "Comfortable stays"
    },
    {
      icon: Tent,
      title: "Campsites",
      path: "/category/campsite",
      bgImage:
        "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4",
      description: "Outdoor adventures"
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />

      {/* HERO */}
      <div
        className="relative h-56 md:h-80 w-full"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1506929562872-bb421503ef21)",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
          <h1 className="text-white text-3xl md:text-5xl font-bold mb-4 text-center">
            Discover Your Next Adventure
          </h1>
          <SearchBarWithSuggestions
            value={searchQuery}
            onChange={setSearchQuery}
            onSubmit={() => setIsSearchFocused(true)}
          />
        </div>
      </div>

      <main className="w-full px-4 md:px-6 lg:px-8 py-6">

        {/* ✅ CATEGORIES – FULL WIDTH */}
        <section className="mb-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 w-full">
            {categories.map((cat) => (
              <div
                key={cat.title}
                onClick={() => navigate(cat.path)}
                className="relative h-24 md:h-40 lg:h-48 rounded-lg overflow-hidden cursor-pointer w-full"
                style={{
                  backgroundImage: `url(${cat.bgImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center"
                }}
              >
                <div className="absolute inset-0 bg-black/50 hover:bg-black/40 transition flex flex-col items-center justify-center text-center p-3">
                  <cat.icon className="h-6 w-6 md:h-12 md:w-12 text-white mb-2" />
                  <span className="text-white font-bold text-xs md:text-lg">
                    {cat.title}
                  </span>
                  <p className="hidden md:block text-white/80 text-sm mt-1">
                    {cat.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURED / NEAR YOU */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg md:text-2xl font-bold">
              {position ? "Near You" : "Latest"}
            </h2>
          </div>

          <div className="relative w-full">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                featuredForYouRef.current?.scrollBy({
                  left: -300,
                  behavior: "smooth"
                })
              }
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white"
            >
              <ChevronLeft />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                featuredForYouRef.current?.scrollBy({
                  left: 300,
                  behavior: "smooth"
                })
              }
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white"
            >
              <ChevronRight />
            </Button>

            {/* ✅ FULL WIDTH SCROLL */}
            <div
              ref={featuredForYouRef}
              className="flex gap-3 overflow-x-auto w-full px-0 scrollbar-hide"
            >
              {loading
                ? [...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 w-[85vw] sm:w-[45vw] md:w-64"
                    >
                      <ListingSkeleton />
                    </div>
                  ))
                : listings.map((item) => {
                    const distance =
                      position && item.latitude && item.longitude
                        ? calculateDistance(
                            position.latitude,
                            position.longitude,
                            item.latitude,
                            item.longitude
                          )
                        : undefined;

                    return (
                      <div
                        key={item.id}
                        className="flex-shrink-0 w-[85vw] sm:w-[45vw] md:w-64"
                      >
                        <ListingCard
                          {...item}
                          isSaved={savedItems.has(item.id)}
                          onSave={() => handleSave(item.id, item.type)}
                          distance={distance}
                        />
                      </div>
                    );
                  })}
            </div>
          </div>
        </section>
      </main>

      <MobileBottomBar />
    </div>
  );
};

export default Index;
