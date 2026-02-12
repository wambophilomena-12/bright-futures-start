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
  id, type, name, imageUrl, location, country, price, date,
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

  const optimizedImageUrl = useMemo(() => optimizeSupabaseImage(imageUrl, { width: 500, height: 350, quality: 80 }), [imageUrl]);
  const thumbnailUrl = useMemo(() => optimizeSupabaseImage(imageUrl, { width: 32, height: 24, quality: 30 }), [imageUrl]);
  const displayType = useMemo(() => isEventOrSport ? "Event & Sports" : type.replace('_', ' '), [isEventOrSport, type]);
  
  const formattedName = useMemo(() => {
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, [name]);
  
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
        "group overflow-hidden transition-all duration-500 hover:-translate-y-1.5 cursor-pointer border-none flex flex-col",
        "rounded-[24px] bg-white w-full max-w-full shadow-sm hover:shadow-2xl hover:shadow-slate-200/50",
        compact ? "h-auto" : "h-full",
        isUnavailable && "opacity-95"
      )}
    >
      {/* Image Section */}
      <div 
        ref={imageContainerRef} 
        className="relative overflow-hidden w-full bg-slate-100" 
        style={{ paddingBottom: '68%' }}
      >
        {!imageLoaded && !imageError && (
          <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
        )}
        
        {shouldLoadImage && !imageError && (
          <img 
            src={optimizedImageUrl} 
            alt={name}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={cn(
                "absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110", 
                imageLoaded ? "opacity-100" : "opacity-0",
                isUnavailable && "grayscale-[0.8]" 
            )} 
          />
        )}
        
        {/* Status Overlays */}
        {isUnavailable && (
          <div className="absolute inset-0 z-20 bg-black/20 flex items-center justify-center backdrop-blur-[2px]">
            <Badge className="bg-white/90 text-black font-bold border-none px-4 py-1.5 text-[10px] uppercase rounded-full shadow-xl">
                {isSoldOut ? 'Sold Out' : 'Not Available'}
            </Badge>
          </div>
        )}
        
        {/* Floating Category Tag */}
        <Badge 
          className="absolute top-4 left-4 z-10 px-3 py-1 border-none text-[9px] font-bold uppercase tracking-wider rounded-full backdrop-blur-md shadow-sm"
          style={{ background: isUnavailable ? 'rgba(100, 116, 139, 0.8)' : 'rgba(0, 128, 128, 0.85)', color: 'white' }}
        >
          {displayType}
        </Badge>

        {/* Round Save Button */}
        {onSave && (
          <button 
            onClick={handleSaveClick}
            className={cn(
                "absolute top-4 right-4 z-20 h-9 w-9 flex items-center justify-center rounded-full transition-all active:scale-90 shadow-lg", 
                isSavedLocal ? "bg-white" : "bg-white/70 hover:bg-white backdrop-blur-sm"
            )}
          >
            <Heart className={cn("h-4.5 w-4.5 transition-colors", isSavedLocal ? "text-red-500 fill-red-500" : "text-slate-700")} />
          </button>
        )}
      </div>
      
      {/* Content Section */}
      <div className="p-5 flex flex-col flex-1"> 
        <div className="flex justify-between items-start gap-2 mb-1.5">
          <h3 className="font-bold text-base md:text-[17px] leading-tight tracking-tight line-clamp-2 text-slate-800 transition-colors group-hover:text-teal-700">
            {formattedName}
          </h3>
          {avgRating && (
            <div className="flex items-center gap-1 shrink-0 bg-slate-50 px-2 py-1 rounded-lg">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="text-xs font-bold text-slate-700">{avgRating.toFixed(1)}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1 mb-4">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            <p className="text-[12px] font-medium text-slate-500 truncate capitalize">
                {locationString.toLowerCase()}
            </p>
        </div>

        {/* Activity Pills */}
        {activities && activities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {activities.slice(0, 2).map((act, i) => (
              <span key={i} className={cn(
                "text-[10px] font-semibold px-2.5 py-1 rounded-full",
                isUnavailable ? "bg-slate-100 text-slate-400" : "bg-teal-50 text-teal-700"
              )}>
                {typeof act === 'string' ? act : act.name}
              </span>
            ))}
          </div>
        )}
        
        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-slate-50 flex items-end justify-between">
            <div className="flex flex-col">
                {!hidePrice && price != null && (
                  <>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight mb-0.5">
                      {['HOTEL', 'ACCOMMODATION'].includes(type) ? 'Per Night' : 'Starting at'}
                    </span>
                    <span className={cn("text-lg font-black tracking-tighter", isUnavailable ? "text-slate-300 line-through" : "text-teal-900")}>
                        KSh {price.toLocaleString()}
                    </span>
                  </>
                )}
            </div>

            <div className="flex flex-col items-end gap-1.5">
                {(date || isFlexibleDate) && (
                  <div className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full",
                    isFlexibleDate ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-600"
                  )}>
                      <Calendar className="h-3 w-3" />
                      <span className="text-[10px] font-bold uppercase">
                          {isFlexibleDate ? 'Flexible' : new Date(date!).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </span>
                  </div>
                )}
                
                <div className="h-4">
                  {isOutdated ? (
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Passed</span>
                  ) : isSoldOut ? (
                    <span className="text-[9px] font-bold text-red-500 uppercase">Fully Booked</span>
                  ) : fewSlotsRemaining ? (
                    <span className="text-[9px] font-extrabold text-orange-600 uppercase flex items-center gap-1">
                        <Ticket className="h-2.5 w-2.5" /> Only {remainingTickets} left!
                    </span>
                  ) : (tracksAvailability && availableTickets > 0) && (
                    <span className="text-[9px] font-bold text-teal-600 uppercase">
                        {remainingTickets} Spots Available
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