import { useState } from "react";
import { MapPin, Heart, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, optimizeSupabaseImage } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { createDetailPath } from "@/lib/slugUtils";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

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
  activities?: any[]; // Array of activities to display
  hidePrice?: boolean;
  availableTickets?: number;
  bookedTickets?: number;
  showBadge?: boolean;
  priority?: boolean;
  minimalDisplay?: boolean;
  hideEmptySpace?: boolean;
  compact?: boolean;
  distance?: number;
}

export const ListingCard = ({
  id,
  type,
  name,
  imageUrl,
  location,
  country,
  price,
  date,
  isCustomDate = false,
  onSave,
  isSaved = false,
  amenities,
  activities,
  hidePrice = false,
  availableTickets,
  bookedTickets,
  showBadge = false,
  priority = false,
  minimalDisplay = false,
  hideEmptySpace = false,
  compact = false,
  distance
}: ListingCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const { ref: imageContainerRef, isIntersecting } = useIntersectionObserver({
    rootMargin: '200px',
    triggerOnce: true
  });

  const shouldLoadImage = priority || isIntersecting;
  const navigate = useNavigate();

  const handleCardClick = () => {
    const typeMap: Record<string, string> = {
      "TRIP": "trip",
      "EVENT": "event",
      "HOTEL": "hotel",
      "ADVENTURE PLACE": "adventure",
      "ACCOMMODATION": "accommodation",
      "ATTRACTION": "attraction"
    };
    const path = createDetailPath(typeMap[type], id, name, location);
    navigate(path);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "";
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSave) onSave(id, type);
  };

  const tealBgClass = "bg-[rgb(0,128,128)] text-white";
  const tealTextClass = "text-[rgb(0,100,100)]";
  const remainingTickets = availableTickets !== undefined ? availableTickets - (bookedTickets || 0) : undefined;
  const fewSlotsRemaining = (type === "TRIP" || type === "EVENT") && remainingTickets !== undefined && remainingTickets > 0 && remainingTickets <= 20;
  const isTripOrEvent = type === "TRIP" || type === "EVENT";

  const optimizedImageUrl = optimizeSupabaseImage(imageUrl, {
    width: 400,
    height: 300,
    quality: 75
  });

  return (
    <Card 
      onClick={handleCardClick} 
      className={cn(
        "group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border bg-card shadow-sm flex flex-col",
        "rounded-xl", // Restored border radius
        "w-[20%] min-w-[280px] h-fit min-h-[420px]" // Width 20%, Fixed aspect height to ensure content fits
      )}
    >
      {/* Image Container */}
      <div 
        ref={imageContainerRef} 
        className="relative overflow-hidden m-0 bg-muted" 
        style={{ paddingBottom: '66%' }}
      >
        {(!shouldLoadImage || !imageLoaded && !imageError) && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}
        
        {shouldLoadImage && (
          <img 
            src={optimizedImageUrl} 
            alt={name} 
            loading="lazy" 
            onLoad={() => setImageLoaded(true)} 
            onError={() => setImageError(true)} 
            className={cn(
              "absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-all duration-300", 
              imageLoaded ? "opacity-100" : "opacity-0"
            )} 
          />
        )}
        
        {imageError && (
          <div className="absolute inset-0 bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-xs">No image</span>
          </div>
        )}

        {/* Badge Logic */}
        {(type === "TRIP" || type === "EVENT" || showBadge) && (
          <Badge className={cn("absolute top-2 left-2 backdrop-blur text-[10px] z-10 px-2 py-0.5 lowercase font-medium", tealBgClass)}>
            {type.toLowerCase()}
          </Badge>
        )}

        {onSave && (
          <Button 
            size="icon" 
            onClick={handleSaveClick} 
            className="absolute top-2 right-2 z-20 h-8 w-8 bg-white/80 hover:bg-white rounded-full shadow-sm"
          >
            <Heart className={cn("h-4 w-4", isSaved ? "text-red-500 fill-red-500" : "text-slate-600")} />
          </Button>
        )}
      </div>
      
      {/* Content Area */}
      <div className="p-4 flex flex-col flex-1"> 
        <h3 className="font-bold text-sm md:text-base line-clamp-1 uppercase mb-1">
          {name.toUpperCase()}
        </h3>
        
        <div className="flex items-center gap-1 mb-3">
          <MapPin className={cn("h-3 w-3 flex-shrink-0", tealTextClass)} />
          <p className="text-[11px] md:text-xs text-muted-foreground line-clamp-1">
            {location}, {country}
          </p>
        </div>

        {/* NEW: Activities Section */}
        {activities && activities.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4 overflow-hidden max-h-[50px]">
            {activities.slice(0, 3).map((act, idx) => (
              <span key={idx} className="flex items-center gap-1 text-[9px] bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                <CheckCircle2 className="h-2 w-2 text-teal-600" />
                {typeof act === 'string' ? act : act.name}
              </span>
            ))}
            {activities.length > 3 && (
              <span className="text-[9px] text-muted-foreground pl-1">+{activities.length - 3} more</span>
            )}
          </div>
        )}
        
        {/* Price/Date Footer */}
        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex flex-col">
            {!hidePrice && price !== undefined && (
              <span className="text-sm font-bold text-[rgb(180,0,0)]">
                KSh {price.toLocaleString()}
              </span>
            )}
            {date && (
              <span className="text-[10px] text-muted-foreground">
                {isCustomDate ? "Flexible Date" : formatDate(date)}
              </span>
            )}
          </div>

          {fewSlotsRemaining && (
            <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded animate-pulse">
              LOW SLOTS
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};