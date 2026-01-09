import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  className?: string;
  bgImage?: string;
}

export const CategoryCard = ({
  icon: Icon,
  title,
  description,
  onClick,
  className,
  bgImage,
}: CategoryCardProps) => {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "group cursor-pointer overflow-hidden border-2 hover:border-primary transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
        className
      )}
    >
      {/* Mobile: Simple icon + title layout */}
      <div className="p-2 md:hidden flex flex-col items-center text-center gap-1">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground group-hover:scale-110 transition-transform duration-300">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-bold text-xs text-foreground">{title}</h3>
        </div>
      </div>

      {/* Desktop: Background image with overlay text */}
      <div 
        className="hidden md:flex relative h-40 lg:h-48 items-end justify-center overflow-hidden"
      >
        {/* Category image - lazy loaded */}
        {bgImage && (
          <img 
            src={bgImage}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 group-hover:from-black/70 group-hover:via-black/30 transition-all" />
        
        {/* Icon centered */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <Icon className="h-12 w-12 lg:h-16 lg:w-16 text-white drop-shadow-lg" />
        </div>
        
        {/* Text at bottom inside image */}
        <div className="relative z-10 p-3 text-center w-full">
          <h3 className="font-bold text-base lg:text-lg text-white drop-shadow-lg">{title}</h3>
          <p className="text-sm text-white/90 mt-1 drop-shadow">{description}</p>
        </div>
      </div>
    </Card>
  );
};
