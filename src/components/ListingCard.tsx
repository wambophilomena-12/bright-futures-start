import { useState, memo, useCallback, useMemo, useEffect } from "react";
import { MapPin, Heart, Star, Calendar, Ticket } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, optimizeSupabaseImage } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { createDetailPath } from "@/lib/slugUtils";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

const COLORS = {
  TEAL: "#008080",
  CORAL: "#FF7F50",
  KHAKI: "#F0E68C",
  KHAKI_DARK: "#857F3E",
  RED: "#FF0000",
  SOFT_GRAY: "#F8F9FA"
} as const;

interface ListingCardProps {
  id: string;
  type: 'TRIP' | 'EVENT' | 'SPORT' | 'HOTEL' | 'ADVENTURE PLACE' | 'ACCOMMODATION' | 'ATTRACTION';
  name: string;
  imageUrl: string;
  location: string;
  country: string;
  price?: number;
  date?: string;
  isCustomDate?: boolean;
  isFlexibleDate?: boolean;
  isOutdated?: boolean;
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
  place?: string;
  showFlexibleDate?: boolean;
}

const ListingCardComponent = ({
  id, type, name, imageUrl, location, price, date,
  isOutdated = false, onSave, isSaved = false, activities, 
  hidePrice = false, availableTickets = 0, bookedTickets = 0, 
  priority = false, compact = false, avgRating, distance, place,
  isFlexibleDate = false
}: ListingCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isSavedLocal, setIsSavedLocal] = useState(isSaved);
  const navigate = useNavigate();

  useEffect(() => {
    setIsSavedLocal(isSaved);
  }, [isSaved]);

  const { ref: imageContainerRef, isIntersecting } = useIntersectionObserver({
    rootMargin: '300px',
    triggerOnce: true
  });

  const shouldLoadImage = priority || isIntersecting;
  const isEventOrSport = useMemo(() => type === "EVENT" || type === "SPORT", [type]);
  const isTrip = useMemo(() => type === "TRIP", [type]);
  const tracksAvailability = useMemo(() => isEventOrSport || isTrip, [isEventOrSport, isTrip]);
  
  const remainingTickets = useMemo(() => availableTickets - bookedTickets, [availableTickets, bookedTickets]);
  const isSoldOut = useMemo(() => tracksAvailability && availableTickets > 0 && remainingTickets <= 0, [tracksAvailability, availableTickets, remainingTickets]);
  const fewSlotsRemaining = useMemo(() => tracksAvailability && remainingTickets > 0 && remainingTickets <= 10, [tracksAvailability, remainingTickets]);
  const isUnavailable = useMemo(() => isOutdated || isSoldOut, [isOutdated, isSoldOut]);

  // Increased width/height for the larger card display
  const optimizedImageUrl = useMemo(() => optimizeSupabaseImage(imageUrl, { width: 600, height: 450, quality: 85 }), [imageUrl]);
  const displayType = useMemo(() => isEventOrSport ? "Event & Sports" : type.replace('_', ' '), [isEventOrSport, type]);
  const locationString = useMemo(() => [place, location].filter(Boolean).join(', '), [place, location]);

  const handleCardClick = useCallback(() => {
    const typeMap: Record<string, string> = {
      "TRIP": "trip", "EVENT": "event", "SPORT": "event", "HOTEL": "hotel",
      "ADVENTURE PLACE": "adventure", "ACCOMMODATION": "accommodation", "ATTRACTION": "attraction"
    };
    navigate(createDetailPath(typeMap[type], id, name, location));
  }, [navigate, type, id, name, location]);

  const handleSaveClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSavedLocal(!isSavedLocal);
    onSave?.(id, type);
  }, [onSave, id, type, isSavedLocal]);

  return (
    <Card 
      onClick={handleCardClick} 
      className={cn(
        "group overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer border-slate-200 flex flex-col bg-white",
        "rounded-sm", // Very small border radius
        compact ? "h-auto" : "min-h-[440px] h-full", // Larger card height
        isUnavailable && "opacity-95"
      )}
    >
      {/* Image Section */}
      <div 
        ref={imageContainerRef} 
        className="relative overflow-hidden w-full bg-slate-100" 
        style={{ paddingBottom: '65%' }}
      >
        {!imageLoaded && !imageError && (
          <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
        )}
        
        {shouldLoadImage && !imageError && (
          <img 
            src={optimizedImageUrl} 
            alt={name}
            loading={priority ? "eager" : "lazy"}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={cn(
                "absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105", 
                imageLoaded ? "opacity-100" : "opacity-0",
                isUnavailable && "grayscale-[0.4]" 
            )} 
          />
        )}

        {isUnavailable && (
          <div className="absolute inset-0 z-20 bg-black/30 flex items-center justify-center backdrop-blur-[1px]">
            <Badge className="bg-white text-black font-medium border-none px-4 py-1.5 text-[10px] uppercase rounded-none tracking-widest">
                {isSoldOut ? 'Sold Out' : 'Unavailable'}
            </Badge>
          </div>
        )}
        
        <Badge 
          className="absolute top-4 left-4 z-10 px-2 py-0.5 border-none shadow-sm text-[8px] font-medium uppercase tracking-widest rounded-none"
          style={{ background: isUnavailable ? '#64748b' : COLORS.TEAL, color: 'white' }}
        >
          {displayType}
        </Badge>

        {onSave && (
          <button 
            onClick={handleSaveClick}
            className={cn(
                "absolute top-4 right-4 z-20 h-9 w-9 flex items-center justify-center rounded-none backdrop-blur-md transition-all active:scale-95", 
                isSavedLocal ? "bg-red-500" : "bg-black/20 hover:bg-black/40"
            )}
          >
            <Heart className={cn("h-4 w-4", isSavedLocal ? "text-white fill-white" : "text-white")} />
          </button>
        )}
      </div>
      
      {/* Content Section */}
      <div className="p-6 flex flex-col flex-1"> 
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-medium text-lg md:text-xl leading-tight uppercase tracking-tight line-clamp-2" 
              style={{ color: isUnavailable ? '#475569' : COLORS.TEAL }}>
            {name}
          </h3>
          {avgRating && (
            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 border border-slate-100">
              <Star className="h-3 w-3 fill-[#FF7F50] text-[#FF7F50]" />
              <span className="text-[12px] font-medium text-slate-700">{avgRating.toFixed(1)}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1.5 mb-4">
            <MapPin className="h-4 w-4 flex-shrink-0" style={{ color: isUnavailable ? '#94a3b8' : COLORS.CORAL }} />
            <p className="text-xs md:text-sm font-normal text-slate-500 capitalize tracking-wide">
                {locationString.toLowerCase()}
            </p>
        </div>

        {activities && activities.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {activities.slice(0, 3).map((act, i) => (
              <span key={i} className="text-[10px] font-normal px-2.5 py-1 bg-slate-100 text-slate-600 uppercase tracking-wider">
                {typeof act === 'string' ? act : act.name}
              </span>
            ))}
          </div>
        )}
        
        {/* Bottom Metadata */}
        <div className="mt-auto pt-5 border-t border-slate-100 flex items-center justify-between">
            <div className="flex flex-col">
                {!hidePrice && price !== undefined && (
                  <>
                    <span className="text-[10px] font-normal text-slate-400 uppercase tracking-widest mb-0.5">Starts at</span>
                    <span className={cn("text-xl font-normal", isUnavailable ? "text-slate-300 line-through" : "text-red-600")}>
                        KSh {price.toLocaleString()}
                    </span>
                  </>
                )}
            </div>

            <div className="flex flex-col items-end">
                {(date || isFlexibleDate) && (
                  <div className="flex items-center gap-1.5 text-slate-500">
                      <Calendar className="h-4 w-4" />
                      <span className={`text-[11px] font-medium uppercase ${isFlexibleDate ? 'text-emerald-600' : ''}`}>
                          {isFlexibleDate ? 'Flexible' : new Date(date!).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                  </div>
                )}
                
                <div className="mt-1.5">
                  {isOutdated ? (
                    <span className="text-[10px] font-medium text-slate-400 uppercase">Event Passed</span>
                  ) : isSoldOut ? (
                    <span className="text-[10px] font-medium text-red-600 uppercase">Sold Out</span>
                  ) : fewSlotsRemaining ? (
                    <span className="text-[10px] font-medium text-red-500 uppercase flex items-center gap-1">
                        <Ticket className="h-3 w-3" />
                        {remainingTickets} left
                    </span>
                  ) : (tracksAvailability && availableTickets > 0) && (
                    <span className="text-[10px] font-medium text-teal-600 uppercase">
                        {remainingTickets} Slots left
                    </span>
                  )}
                </div>
            </div>
        </div>
      </div>
    </Card>
  );
};

export const ListingCard = memo(ListingCardComponent);