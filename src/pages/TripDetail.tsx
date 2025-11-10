import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Share2, Calendar } from "lucide-react";
import { BookTripDialog } from "@/components/booking/BookTripDialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselPrevious, 
  CarouselNext 
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

interface Trip {
  id: string;
  name: string;
  location: string;
  place: string;
  country: string;
  image_url: string;
  images: string[];
  gallery_images: string[];
  description: string;
  price: number;
  price_child: number;
  date: string;
  date_type: string;
  available_tickets: number;
  phone_number: string;
  email: string;
  map_link: string;
}

const TripDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  // State for current slide index to implement custom dots
  const [current, setCurrent] = useState(0); 

  useEffect(() => {
    fetchTrip();
  }, [id]);

  const fetchTrip = async () => {
    try {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setTrip(data as any);
    } catch (error) {
      console.error("Error fetching trip:", error);
      toast({
        title: "Error",
        description: "Failed to load trip details",
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
          title: trip?.name,
          text: trip?.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Share failed:", error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Trip link copied to clipboard",
      });
    }
  };

  const openInMaps = () => {
    if (trip?.map_link) {
      window.open(trip.map_link, '_blank');
    } else {
      const query = encodeURIComponent(`${trip?.name}, ${trip?.location}, ${trip?.country}`);
      // NOTE: Corrected the Google Maps URL structure for the fallback
      window.open(`https://maps.google.com/?q=${query}`, '_blank');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background">Loading...</div>;
  }

  if (!trip) {
    return <div className="min-h-screen bg-background">Trip not found</div>;
  }

  const displayImages = trip.gallery_images?.length > 0 
    ? trip.gallery_images 
    : trip.images?.length > 0 
    ? trip.images 
    : [trip.image_url];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      <main className="container px-4 py-6 max-w-6xl mx-auto">
        {/* Image Gallery Carousel and Share Button Container */}
        <div className="relative w-full mb-6">
          <Button
            variant="ghost"
            onClick={handleShare}
            // MODIFICATION: Share button style changes: solid red, no hover, white text
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
                    alt={`${trip.name} ${idx + 1}`}
                    // MODIFICATION: Removed 'rounded-lg' to remove the border radius
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
        {/* End of Image Gallery Carousel and Share Button Container */}

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{trip.name}</h1>
              <p className="text-muted-foreground">{trip.location}, {trip.country}</p>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span>{new Date(trip.date).toLocaleDateString()}</span>
              </div>
              {trip.phone_number && (
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  <a href={`tel:${trip.phone_number}`}>{trip.phone_number}</a>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">About This Trip</h2>
              <p className="text-muted-foreground">{trip.description}</p>
            </div>
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

            <div className="bg-card p-6 rounded-lg border space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Adult Price</p>
                <p className="text-2xl font-bold">${trip.price}</p>
              </div>
              {trip.price_child > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Child Price</p>
                  <p className="text-xl font-semibold">${trip.price_child}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Available Tickets</p>
                <p className="text-lg font-semibold">{trip.available_tickets}</p>
              </div>
              <Button 
                className="w-full" 
                onClick={() => setBookingOpen(true)}
                disabled={trip.available_tickets === 0}
              >
                {trip.available_tickets === 0 ? 'Sold Out' : 'Book Now'}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <BookTripDialog
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        trip={trip}
      />

      <Footer />
      <MobileBottomBar />
    </div>
  );
};

export default TripDetail;