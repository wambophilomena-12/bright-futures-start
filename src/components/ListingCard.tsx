// ... imports remain same

const ListingCardComponent = ({
  // ... props remain same
}: ListingCardProps) => {
  // ... existing hooks and logic remain same

  return (
    <Card 
      onClick={handleCardClick} 
      className={cn(
        "group overflow-hidden transition-all duration-500 hover:-translate-y-1 cursor-pointer border-none flex flex-col",
        "rounded-2xl bg-white w-full max-w-full shadow-sm hover:shadow-2xl", // Increased radius and updated shadows
        compact ? "h-auto" : "h-full",
        isUnavailable && "opacity-95"
      )}
    >
      {/* Image Section */}
      <div 
        ref={imageContainerRef} 
        className="relative overflow-hidden w-full bg-slate-100" 
        style={{ paddingBottom: '68%' }} // Slightly adjusted for better visual balance
      >
        {/* Skeleton & Images ... same logic ... */}
        {shouldLoadImage && !imageError && (
          <img 
            src={optimizedImageUrl} 
            alt={name}
            loading={priority ? "eager" : "lazy"}
            onLoad={handleImageLoad}
            onError={handleImageError}
            className={cn(
                "absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110", 
                imageLoaded ? "opacity-100" : "opacity-0",
                isUnavailable && "grayscale-[0.8]" 
            )} 
          />
        )}

        {/* Status Overlay */}
        {isUnavailable && (
          <div className="absolute inset-0 z-20 bg-black/30 flex items-center justify-center backdrop-blur-[2px]">
            <Badge className="bg-white/90 text-black font-bold border-none px-4 py-1.5 text-[10px] uppercase rounded-full shadow-lg">
                {isSoldOut ? 'Sold Out' : 'Unavailable'}
            </Badge>
          </div>
        )}
        
        {/* Floating Category Badge */}
        <Badge 
          className="absolute top-4 left-4 z-10 px-3 py-1 border-none text-[9px] font-bold uppercase tracking-wider rounded-full backdrop-blur-md shadow-sm"
          style={{ background: isUnavailable ? 'rgba(100, 116, 139, 0.8)' : 'rgba(0, 128, 128, 0.85)', color: 'white' }}
        >
          {displayType}
        </Badge>

        {/* Save Button - Rounder & More Refined */}
        {onSave && (
          <button 
            onClick={handleSaveClick}
            className={cn(
                "absolute top-3 right-3 z-20 h-9 w-9 flex items-center justify-center rounded-full transition-all active:scale-90 shadow-md", 
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
          <h3 className="font-bold text-base md:text-[17px] leading-tight tracking-tight line-clamp-2 text-slate-800 group-hover:text-teal-700 transition-colors">
            {formattedName}
          </h3>
          {avgRating && (
            <div className="flex items-center gap-1 shrink-0">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-bold text-slate-700">{avgRating.toFixed(1)}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1 mb-4">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            <p className="text-[12px] font-medium text-slate-500 truncate">
                {locationString}
            </p>
        </div>

        {/* Modern Tag Style */}
        {activities && activities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {activities.slice(0, 2).map((act, i) => (
              <span key={i} className={cn(
                "text-[10px] font-semibold px-2.5 py-1 rounded-full border-none",
                isUnavailable ? "bg-slate-100 text-slate-400" : "bg-teal-50 text-teal-700"
              )}>
                {typeof act === 'string' ? act : act.name}
              </span>
            ))}
          </div>
        )}
        
        {/* Footer Area */}
        <div className="mt-auto pt-4 border-t border-slate-50 flex items-end justify-between">
            <div className="flex flex-col">
                {!hidePrice && price != null && (
                  <>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight mb-0.5">
                      {type.includes('HOTEL') ? 'Per Night' : 'From'}
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className={cn("text-lg font-black", isUnavailable ? "text-slate-300 line-through" : "text-teal-800")}>
                          KSh {price.toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
            </div>

            <div className="flex flex-col items-end gap-1">
                {(date || isFlexibleDate) && (
                  <div className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-md",
                    isFlexibleDate ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-600"
                  )}>
                      <Calendar className="h-3 w-3" />
                      <span className="text-[10px] font-bold uppercase">
                          {isFlexibleDate ? 'Flexible' : new Date(date!).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </span>
                  </div>
                )}
                
                {/* Availability text */}
                <div className="h-4">
                  {isOutdated ? (
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Passed</span>
                  ) : isSoldOut ? (
                    <span className="text-[9px] font-bold text-red-500 uppercase">Fully Booked</span>
                  ) : fewSlotsRemaining ? (
                    <span className="text-[9px] font-extrabold text-orange-600 uppercase animate-pulse">
                        Only {remainingTickets} left!
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