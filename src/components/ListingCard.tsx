import { useState } from "react";
import { MapPin, Heart, Star, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, optimizeSupabaseImage } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { createDetailPath } from "@/lib/slugUtils";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

// Syncing with EventDetail colors
const COLORS = {
  TEAL: "#008080",
  CORAL: "#FF7F50",
  KHAKI: "#F0E68C",
  KHAKI_DARK: "#857F3E",
  RED: "#FF0000",
  SOFT_GRAY: "#F8F9FA"
};

interface ListingCardProps {
  id: string;
  type: 'TRIP' | 'EVENT' | 'HOTEL' | 'ADVENTURE PLACE' | 'ACCOMMODATION' | 'ATTRACTION';
  name: string;
  imageUrl: string;
  location: string;
  country: string;
  price?: number;
  date?: string;
  isCustomDate?: boolean;
  onSave?: (id: string, type: string) => void;
  isSaved?: boolean;
  amenities?: string[];
  activities?: any[];
  hidePrice?: boolean;
  availableTickets?: number;
  bookedTickets?: number;
  showBadge?: boolean;
  priority?: boolean;
  minimalDisplay?: boolean;
  hideEmptySpace?: boolean;
  compact?: boolean;
  distance?: number;
  avgRating?: number;
  reviewCount?: number;
}

export const ListingCard = ({
  id, type, name, imageUrl, location, country, price, date,
  onSave, isSaved = false, activities, hidePrice = false,
  availableTickets, bookedTickets, priority = false,
  minimalDisplay = false, hideEmptySpace = false,
  compact = false, avgRating, reviewCount
}: ListingCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();

  const { ref: imageContainerRef, isIntersecting } = useIntersectionObserver({
    rootMargin: '200px', triggerOnce: true
  });

  const shouldLoadImage = priority || isIntersecting;
  const handleCardClick = () => {
    const typeMap: Record<string, string> = {
      "TRIP": "trip", "EVENT": "event", "HOTEL": "hotel",
      "ADVENTURE PLACE": "adventure", "ACCOMMODATION": "accommodation", "ATTRACTION": "attraction"
    };
    navigate(createDetailPath(typeMap[type], id, name, location));
  };

  const remainingTickets = availableTickets !== undefined ? availableTickets - (bookedTickets || 0) : undefined;
  const fewSlotsRemaining = (type === "TRIP" || type === "EVENT") && remainingTickets !== undefined && remainingTickets > 0 && remainingTickets <= 10;

  const optimizedImageUrl = optimizeSupabaseImage(imageUrl, { width: 400, height: 300, quality: 80 });

  return (
    <Card 
      onClick={handleCardClick} 
      className={cn(
        "group overflow-hidden transition-all duration-300 hover:shadow-2xl cursor-pointer border-slate-100 bg-white flex flex-col",
        "rounded-[24px]", // Matches the rounded-heavy aesthetic
        compact ? "h-auto" : "h-full"
      )}
    >
      {/* Image Container */}
      <div ref={imageContainerRef} className="relative overflow-hidden m-2 rounded-[20px] bg-slate-100" style={{ paddingBottom: '70%' }}>
        {shouldLoadImage && (
          <img 
            src={optimizedImageUrl} 
            alt={name} 
            onLoad={() => setImageLoaded(true)} 
            className={cn("absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110", imageLoaded ? "opacity-100" : "opacity-0")} 
          />
        )}
        
        {/* Floating Category Badge */}
        <Badge 
          className="absolute top-3 left-3 z-10 px-3 py-1 border-none shadow-lg text-[10px] font-black uppercase tracking-widest"
          style={{ background: COLORS.TEAL, color: 'white' }}
        >
          {type.replace('_', ' ')}
        </Badge>

        {onSave && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => { e.stopPropagation(); onSave(id, type); }} 
            className={cn("absolute top-3 right-3 z-20 h-9 w-9 rounded-full backdrop-blur-md transition-all", isSaved ? "bg-red-500 hover:bg-red-600" : "bg-black/20 hover:bg-black/40")}
          >
            <Heart className={cn("h-4 w-4", isSaved ? "text-white fill-white" : "text-white")} />
          </Button>
        )}
      </div>
      
      {/* Content Section */}
      <div className="p-5 flex flex-col flex-1"> 
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-black text-sm md:text-lg leading-tight uppercase tracking-tighter line-clamp-2" style={{ color: COLORS.TEAL }}>
            {name}
          </h3>
          {avgRating && (
            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
              <Star className="h-3 w-3 fill-[#FF7F50] text-[#FF7F50]" />
              <span className="text-[11px] font-black" style={{ color: COLORS.TEAL }}>{avgRating.toFixed(1)}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1.5 mb-3">
            <MapPin className="h-3.5 w-3.5" style={{ color: COLORS.CORAL }} />
            <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider line-clamp-1">
                {location}
            </p>
        </div>

        {/* Highlights/Activities as Horizontal List */}
        {activities && activities.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {activities.slice(0, 3).map((act, i) => (
              <span key={i} className="text-[9px] font-black bg-[#F0E68C]/20 text-[#857F3E] px-2 py-0.5 rounded-md uppercase tracking-tighter">
                {typeof act === 'string' ? act : act.name}
              </span>
            ))}
          </div>
        )}
        
        {/* Footer: Price & Date */}
        <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
            <div className="flex flex-col">
                {!hidePrice && price !== undefined && (
                  <>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Starts at</span>
                    <span className="text-base font-black" style={{ color: COLORS.RED }}>
                        KSh {price.toLocaleString()}
                    </span>
                  </>
                )}
            </div>

            {date && (
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1 text-slate-500">
                    <Calendar className="h-3 w-3" />
                    <span className="text-[10px] font-black uppercase">
                        {new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </span>
                </div>
                {fewSlotsRemaining && (
                  <span className="text-[9px] font-black text-red-500 uppercase mt-1 animate-pulse">
                      {remainingTickets} Slots Left
                  </span>
                )}
              </div>
            )}
        </div>
      </div>
    </Card>
  );
};