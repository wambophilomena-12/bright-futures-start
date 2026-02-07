import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { MapPin, Navigation, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createDetailPath } from "@/lib/slugUtils";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons for Leaflet in bundled environments
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const COLORS = {
  TEAL: "#008080",
  CORAL: "#FF7F50",
};

interface DetailMapSectionProps {
  currentItem: {
    id: string;
    name: string;
    latitude?: number | null;
    longitude?: number | null;
    location?: string;
    country?: string;
    image_url?: string;
    price?: number | null;
    entry_fee?: number | null;
  };
  itemType: "adventure" | "hotel" | "trip" | "event";
}

interface NearbyItem {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  location: string;
  country: string;
  image_url: string;
  price?: number | null;
  entry_fee?: number | null;
  type: "adventure" | "hotel" | "trip";
}

const currentMarkerIcon = new L.Icon({
  iconUrl: "data:image/svg+xml;base64," + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
      <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 26 16 26s16-14 16-26C32 7.16 24.84 0 16 0z" fill="#008080"/>
      <circle cx="16" cy="16" r="8" fill="white"/>
      <circle cx="16" cy="16" r="5" fill="#008080"/>
    </svg>
  `),
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -42],
});

const otherMarkerIcon = new L.Icon({
  iconUrl: "data:image/svg+xml;base64," + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.27 21.73 0 14 0z" fill="#FF7F50"/>
      <circle cx="14" cy="14" r="6" fill="white"/>
    </svg>
  `),
  iconSize: [28, 36],
  iconAnchor: [14, 36],
  popupAnchor: [0, -36],
});

export const DetailMapSection = ({ currentItem, itemType }: DetailMapSectionProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [nearbyItems, setNearbyItems] = useState<NearbyItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<NearbyItem | null>(null);
  const navigate = useNavigate();

  const hasLocation = currentItem.latitude && currentItem.longitude;

  useEffect(() => {
    if (hasLocation) {
      fetchNearbyItems();
    }
  }, [currentItem.id, currentItem.country]);

  const fetchNearbyItems = async () => {
    try {
      const results: NearbyItem[] = [];

      // Fetch from all 3 tables in parallel
      const [adventureRes, hotelRes, tripRes] = await Promise.all([
        supabase
          .from("adventure_places")
          .select("id, name, latitude, longitude, location, country, image_url, entry_fee")
          .eq("approval_status", "approved")
          .eq("is_hidden", false)
          .not("latitude", "is", null)
          .not("longitude", "is", null)
          .eq("country", currentItem.country || "")
          .neq("id", itemType === "adventure" ? currentItem.id : "")
          .limit(10),
        supabase
          .from("hotels")
          .select("id, name, latitude, longitude, location, country, image_url")
          .eq("approval_status", "approved")
          .eq("is_hidden", false)
          .not("latitude", "is", null)
          .not("longitude", "is", null)
          .eq("country", currentItem.country || "")
          .neq("id", itemType === "hotel" ? currentItem.id : "")
          .limit(10),
        supabase
          .from("trips")
          .select("id, name, location, country, image_url, price")
          .eq("approval_status", "approved")
          .eq("is_hidden", false)
          .neq("id", (itemType === "trip" || itemType === "event") ? currentItem.id : "")
          .eq("country", currentItem.country || "")
          .limit(10),
      ]);

      if (adventureRes.data) {
        adventureRes.data.forEach((item: any) => {
          if (item.latitude && item.longitude) {
            results.push({ ...item, type: "adventure" as const, price: item.entry_fee });
          }
        });
      }
      if (hotelRes.data) {
        hotelRes.data.forEach((item: any) => {
          if (item.latitude && item.longitude) {
            results.push({ ...item, type: "hotel" as const });
          }
        });
      }
      // Trips don't have lat/lng in schema, so skip adding them as map markers
      // but they're fetched for potential future use

      setNearbyItems(results);
    } catch (error) {
      console.error("Error fetching nearby items:", error);
    }
  };

  useEffect(() => {
    if (!mapContainer.current || !hasLocation) return;

    // Clean up previous map
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const lat = currentItem.latitude!;
    const lng = currentItem.longitude!;

    const map = L.map(mapContainer.current, {
      scrollWheelZoom: false,
    }).setView([lat, lng], 10);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    // Add current item marker
    const currentMarker = L.marker([lat, lng], { icon: currentMarkerIcon }).addTo(map);
    currentMarker.bindPopup(
      `<div style="text-align:center;padding:4px;">
        <strong style="font-size:13px;">${currentItem.name}</strong><br/>
        <span style="font-size:11px;color:#666;">${currentItem.location || ""}</span>
      </div>`
    );

    // Add nearby item markers
    const bounds = L.latLngBounds([[lat, lng]]);

    nearbyItems.forEach((item) => {
      const marker = L.marker([item.latitude, item.longitude], { icon: otherMarkerIcon }).addTo(map);
      bounds.extend([item.latitude, item.longitude]);

      marker.on("click", () => {
        setSelectedItem(item);
      });

      marker.bindTooltip(item.name, {
        direction: "top",
        offset: [0, -36],
        className: "leaflet-tooltip-custom",
      });
    });

    // Fit bounds if we have nearby items
    if (nearbyItems.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }

    mapRef.current = map;

    // Force map to recalculate size after render
    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [hasLocation, nearbyItems, currentItem.latitude, currentItem.longitude]);

  const handleNavigateToItem = (item: NearbyItem) => {
    const path = createDetailPath(item.type, item.id, item.name, item.location);
    navigate(path);
    window.scrollTo(0, 0);
  };

  if (!hasLocation) return null;

  return (
    <div className="mt-12 mb-4">
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl" style={{ backgroundColor: `${COLORS.TEAL}10` }}>
              <MapPin className="h-5 w-5" style={{ color: COLORS.TEAL }} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight" style={{ color: COLORS.TEAL }}>
                Location & Nearby
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Explore places around this area
              </p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.TEAL }} />
              <span className="text-[10px] font-black text-slate-400 uppercase">This place</span>
            </div>
            {nearbyItems.length > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.CORAL }} />
                <span className="text-[10px] font-black text-slate-400 uppercase">Other places</span>
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="relative w-full h-[350px] md:h-[450px]">
          <div ref={mapContainer} className="absolute inset-0" />

          {/* Selected item popup */}
          {selectedItem && (
            <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white rounded-2xl p-4 shadow-xl z-[1000] border border-slate-100">
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-2 right-2 p-1 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="h-4 w-4 text-slate-400" />
              </button>

              <div
                onClick={() => handleNavigateToItem(selectedItem)}
                className="cursor-pointer"
              >
                <img
                  src={selectedItem.image_url}
                  alt={selectedItem.name}
                  loading="lazy"
                  className="w-full h-32 object-cover rounded-xl mb-3"
                />

                <h3 className="font-black text-sm uppercase tracking-tight text-slate-800 line-clamp-1 mb-1">
                  {selectedItem.name}
                </h3>

                <div className="flex items-center gap-1 text-slate-400 mb-2">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-wider line-clamp-1">
                    {selectedItem.location}, {selectedItem.country}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  {(selectedItem.price || selectedItem.entry_fee) ? (
                    <span className="text-sm font-black" style={{ color: COLORS.CORAL }}>
                      KSh {(selectedItem.price || selectedItem.entry_fee || 0).toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full"
                      style={{ color: COLORS.TEAL, backgroundColor: `${COLORS.TEAL}10` }}>
                      View Details
                    </span>
                  )}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${COLORS.TEAL}10` }}
                  >
                    <ArrowRight className="h-4 w-4" style={{ color: COLORS.TEAL }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Open in Maps button */}
        <div className="p-4 pt-3">
          <Button
            variant="ghost"
            onClick={() => {
              const query = encodeURIComponent(`${currentItem.name}, ${currentItem.location}`);
              window.open(`https://www.google.com/maps/search/?api=1&query=${currentItem.latitude},${currentItem.longitude}`, "_blank");
            }}
            className="w-full py-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors"
          >
            <Navigation className="h-4 w-4 mr-2" style={{ color: COLORS.TEAL }} />
            <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: COLORS.TEAL }}>
              Open in Google Maps
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
};
