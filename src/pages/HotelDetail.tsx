import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Share2, Mail, Wifi, Users } from "lucide-react";
import { BookHotelDialog } from "@/components/booking/BookHotelDialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselPrevious, 
  CarouselNext 
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

// MODIFICATION: Import the necessary hook/component for the dots (if not already there, 
// a custom one might be needed, but for simplicity, we'll try to use a standard
// pattern or add a simple implementation here). For this specific request, 
// I'll add the dots implementation directly into the return block.

interface Facility {
  name: string;
  price: number;
  capacity: number;
}

interface Hotel {
  id: string;
  name: string;
  location: string;
  place: string;
  country: string;
  image_url: string;
  images: string[];
  gallery_images: string[];
  description: string;
  amenities: string[];
  phone_numbers: string[];
  email: string;
  facilities: Facility[];
  registration_number: string;
  map_link: string;
}

const HotelDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  // State for current slide index to implement custom dots
  const [current, setCurrent] = useState(0); 

  useEffect(() => {
    fetchHotel();
  }, [id]);

  const fetchHotel = async () => {
    try {
      const { data, error } = await supabase
        .from("hotels")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setHotel(data as any);
    } catch (error) {
      console.error("Error fetching hotel:", error);
      toast({
        title: "Error",
        description: "Failed to load hotel details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: hotel?.name,
          text: hotel?.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Share failed:", error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Hotel link copied to clipboard",
      });
    }
  };

  const openInMaps = () => {
    if (hotel?.map_link) {
      window.open(hotel.map_link, '_blank');
    } else {
      const query = encodeURIComponent(`${hotel?.name}, ${hotel?.location}, ${hotel?.country}`);
      // Fixed the incorrect URL structure here for Google Maps
      window.open(`https://maps.google.com/?q=${query}`, '_blank');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background">Loading...</div>;
  }

  if (!hotel) {
    return <div className="min-h-screen bg-background">Hotel not found</div>;
  }

  const displayImages = hotel.gallery_images?.length > 0 
    ? hotel.gallery_images 
    : hotel.images?.length > 0 
    ? hotel.images 
    : [hotel.image_url];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      <main className="container px-4 py-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">{hotel.name}</h1>

        {/* Image Gallery Carousel and Share Button Container */}
        <div className="relative w-full mb-6">
          <Button
            variant="ghost"
            onClick={handleShare}
            // MODIFICATION: Share button style changes
            // Set background to a solid red, no hover effect, circular shape.
            className="absolute top-4 right-4 z-20 bg-red-600 rounded-full p-2 h-auto w-auto text-white shadow-lg 
                       hover:bg-red-600 focus:bg-red-700 active:bg-red-700" 
          >
            <Share2 className="h-5 w-5" />
          </Button>

          {/* Image Gallery Carousel */}
          <Carousel
            opts={{ loop: true }}
            plugins={[Autoplay({ delay: 3000 })]}
            className="w-full"
            // Add on an index change handler for the dots
            // Note: The `onSelect` prop might be specific to some carousel libraries. 
            // Assuming this is a shadcn/ui carousel wrapper around Embla, 
            // you typically use `api` to get the current index, 
            // but for simplicity and directness, I'll use a direct event handler 
            // if available or a similar common approach.
            // For now, I'll use a placeholder for the `onSelect` and use the 
            // `default` implementation of the carousel controls and add the dots logic.
            setApi={(api) => {
                if (api) {
                    api.on("select", () => {
                        setCurrent(api.selectedScrollSnap());
                    });
                }
            }}
          >
            <CarouselContent>
              {displayImages.map((img, idx) => (
                <CarouselItem key={idx}>
                  <img
                    src={img}
                    alt={`${hotel.name} ${idx + 1}`}
                    className="w-full h-64 md:h-96 object-cover" 
                  />
                </CarouselItem>
              ))}
            </CarouselContent>

            {/* Carousel navigation controls - MODIFICATION: Added RGBA background */}
            <CarouselPrevious 
              className="left-4 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white border-none" 
            />
            <CarouselNext 
              className="right-4 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white border-none" 
            />
            
            {/* White live dots - MODIFICATION: Added this section */}
            {displayImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
                    {displayImages.map((_, index) => (
                        <div
                            key={index}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                index === current
                                    ? 'bg-white' // Active dot
                                    : 'bg-white/40' // Inactive dot with RGBA
                            }`}
                            // Optionally add onClick to navigate, but keeping it simple for now
                        />
                    ))}
                </div>
            )}
          </Carousel>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <p className="text-muted-foreground">{hotel.location}, {hotel.country}</p>

            <div>
              <h2 className="text-xl font-semibold mb-2">About</h2>
              <p className="text-muted-foreground">{hotel.description}</p>
            </div>

            {hotel.amenities && hotel.amenities.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-2">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {hotel.amenities.map((amenity, idx) => (
                    <span key={idx} className="bg-secondary px-3 py-1 rounded-full text-sm flex items-center gap-1">
                      <Wifi className="h-3 w-3" />
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {hotel.facilities && hotel.facilities.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-3">Available Facilities</h2>
                <div className="grid gap-3">
                  {hotel.facilities.map((facility, idx) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{facility.name}</h3>
                        <span className="text-lg font-bold">${facility.price}/day</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>Capacity: {facility.capacity} guests</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Button
              variant="outline"
              onClick={openInMaps}
              className="w-full"
            >
              <MapPin className="mr-2 h-4 w-4" />
              View on Map
            </Button>

            <div className="bg-card p-6 rounded-lg border space-y-3">
              <h3 className="font-semibold">Contact Information</h3>
              {hotel.phone_numbers && hotel.phone_numbers.map((phone, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <a href={`tel:${phone}`} className="text-sm">{phone}</a>
                </div>
              ))}
              {hotel.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <a href={`mailto:${hotel.email}`} className="text-sm">{hotel.email}</a>
                </div>
              )}
              <Button 
                className="w-full mt-4" 
                onClick={() => setBookingOpen(true)}
              >
                Book Now
              </Button>
            </div>
          </div>
        </div>
      </main>

      <BookHotelDialog
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        hotel={hotel}
      />

      <Footer />
      <MobileBottomBar />
    </div>
  );
};
export default HotelDetail;