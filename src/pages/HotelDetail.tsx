import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";

import { MobileBottomBar } from "@/components/MobileBottomBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// Icons will be Teal: #008080
import { MapPin, Phone, Share2, Mail, Calendar, Clock, ArrowLeft, Heart, Copy, Star } from "lucide-react";
import { SimilarItems } from "@/components/SimilarItems";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Carousel } from "@/components/ui/carousel"; // Only import Carousel, not subcomponents if they are not used outside
import { CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { ReviewSection } from "@/components/ReviewSection"; // Assuming ReviewSection accepts onRatingsChange
import Autoplay from "embla-carousel-autoplay";
import { useSavedItems } from "@/hooks/useSavedItems";
import { useAuth } from "@/contexts/AuthContext";
import { MultiStepBooking, BookingFormData } from "@/components/booking/MultiStepBooking";
import { generateReferralLink, trackReferralClick } from "@/lib/referralUtils";
import { useBookingSubmit } from "@/hooks/useBookingSubmit";
import { extractIdFromSlug } from "@/lib/slugUtils";
import { useGeolocation, calculateDistance } from "@/hooks/useGeolocation";

interface Facility {
  name: string;
  price: number;
  capacity: number;
}
interface Activity {
  name: string;
  price: number;
}
interface Hotel {
  id: string;
  name: string;
  local_name: string | null;
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
  activities: Activity[];
  opening_hours: string;
  closing_hours: string;
  days_opened: string[];
  registration_number: string;
  map_link: string;
  establishment_type: string;
  available_rooms: number;
  created_by: string | null;
  latitude: number | null;
  longitude: number | null;
}

// Define the custom colors
const TEAL_COLOR = "#008080";
const ORANGE_COLOR = "#FF9800";
const RED_COLOR = "#EF4444";

// --- START StarRatingDisplay Component (Helper for Read-Only Stars) ---
interface StarRatingDisplayProps {
  rating: number | null;
  count: number | null;
  size?: number; // e.g., 5 for h-5 w-5
}

const StarRatingDisplay = ({ rating, count, size = 5 }: StarRatingDisplayProps) => {
  if (rating === null || rating === 0) return null;

  const fullStars = Math.floor(rating);

  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-${size} w-${size} transition-colors duration-150`}
          style={{ color: ORANGE_COLOR }}
          fill={i < fullStars ? ORANGE_COLOR : "transparent"}
          stroke={ORANGE_COLOR}
        />
      ))}
      <span className="text-base font-semibold ml-1" style={{ color: ORANGE_COLOR }}>
        {rating.toFixed(1)}
      </span>
      {count !== null && (
        <span className="text-sm text-muted-foreground">
          ({count} reviews)
        </span>
      )}
    </div>
  );
};
// --- END StarRatingDisplay Component ---

const HotelDetail = () => {
  const { slug } = useParams();
  const id = slug ? extractIdFromSlug(slug) : null;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { position, requestLocation } = useGeolocation();
  
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [current, setCurrent] = useState(0);
  const { savedItems, handleSave: handleSaveItem } = useSavedItems();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const isSaved = savedItems.has(id || "");
  
  // State for the rating display (NEW)
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState<number | null>(null);

  // Request location on first user interaction
  useEffect(() => {
    const handleInteraction = () => {
      requestLocation();
      window.removeEventListener('scroll', handleInteraction);
      window.removeEventListener('click', handleInteraction);
    };
    window.addEventListener('scroll', handleInteraction, { once: true });
    window.addEventListener('click', handleInteraction, { once: true });
    return () => {
      window.removeEventListener('scroll', handleInteraction);
      window.removeEventListener('click', handleInteraction);
    };
  }, [requestLocation]);

  // Calculate distance if position and hotel coordinates available
  const distance = position && hotel?.latitude && hotel?.longitude
    ? calculateDistance(position.latitude, position.longitude, hotel.latitude, hotel.longitude)
    : undefined;

  useEffect(() => {
    fetchHotel();
    
    // Track referral clicks
    const urlParams = new URLSearchParams(window.location.search);
    const refSlug = urlParams.get("ref");
    if (refSlug && id) {
      trackReferralClick(refSlug, id, "hotel", "booking");
    }
  }, [id]);

  const fetchHotel = async () => {
    if (!id) return;
    try {
      let { data, error } = await supabase.from("hotels").select("*").eq("id", id).single();
      
      if (error && id.length === 8) {
        const { data: prefixData, error: prefixError } = await supabase
          .from("hotels")
          .select("*")
          .ilike("id", `${id}%`)
          .single();
        if (!prefixError) {
          data = prefixData;
          error = null;
        }
      }
      
      if (error) throw error;
      setHotel(data as any);
    } catch (error) {
      console.error("Error fetching hotel:", error);
      toast({
        title: "Error",
        description: "Failed to load hotel details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (id) {
      handleSaveItem(id, "hotel");
    }
  };

  const handleCopyLink = async () => {
    if (!hotel) {
      toast({ title: "Unable to Copy", description: "Hotel information not available", variant: "destructive" });
      return;
    }

    const refLink = await generateReferralLink(hotel.id, "hotel", hotel.id);

    try {
      await navigator.clipboard.writeText(refLink);
      toast({ 
        title: "Link Copied!", 
        description: user 
          ? "Share this link to earn commission on bookings!" 
          : "Share this hotel with others!" 
      });
    } catch (error) {
      toast({ 
        title: "Copy Failed", 
        description: "Unable to copy link to clipboard", 
        variant: "destructive" 
      });
    }
  };

  const handleShare = async () => {
    if (!hotel) {
      toast({ title: "Unable to Share", description: "Hotel information not available", variant: "destructive" });
      return;
    }

    const refLink = await generateReferralLink(hotel.id, "hotel", hotel.id);

    if (navigator.share) {
      try {
        await navigator.share({
          title: hotel?.name,
          text: hotel?.description,
          url: refLink
        });
      } catch (error) {
        console.log("Share failed:", error);
      }
    } else {
      await handleCopyLink();
    }
  };

  const openInMaps = () => {
    if (hotel?.map_link) {
      window.open(hotel.map_link, '_blank');
    } else {
      const query = encodeURIComponent(`${hotel?.name}, ${hotel?.location}, ${hotel?.country}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  };
  
  const { submitBooking } = useBookingSubmit();

  const handleBookingSubmit = async (data: BookingFormData) => {
    if (!hotel) return;
    setIsProcessing(true);
    
    try {
      const totalAmount = data.selectedFacilities.reduce((sum, f) => { 
        if (f.startDate && f.endDate) {
          // Calculate number of full days booked (minimum 1 day)
          const days = Math.ceil((new Date(f.endDate).getTime() - new Date(f.startDate).getTime()) / (1000 * 60 * 60 * 24));
          return sum + (f.price * Math.max(days, 1));
        }
        return sum + f.price; // Fallback if dates are somehow missing
      }, 0) +
      data.selectedActivities.reduce((sum, a) => sum + (a.price * a.numberOfPeople), 0);
      const totalPeople = data.num_adults + data.num_children;

      await submitBooking({
        itemId: hotel.id,
        itemName: hotel.name,
        bookingType: 'hotel',
        totalAmount,
        slotsBooked: totalPeople,
        visitDate: data.visit_date,
        guestName: data.guest_name,
        guestEmail: data.guest_email,
        guestPhone: data.guest_phone,
        hostId: hotel.created_by,
        bookingDetails: {
          hotel_name: hotel.name,
          adults: data.num_adults,
          children: data.num_children,
          facilities: data.selectedFacilities,
          activities: data.selectedActivities
        }
      });
      
      setIsProcessing(false);
      setIsCompleted(true);
      toast({ title: "Booking Submitted", description: "Your booking has been saved. Check your email for confirmation." });
    } catch (error: any) {
      toast({
        title: "Booking failed",
        description: error.message,
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };
  
  if (loading || !hotel) {
    return <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Header />
        <div className="container px-4 py-6"><div className="h-96 bg-muted animate-pulse rounded-lg" /></div>
        <MobileBottomBar />
      </div>;
  }
  
  const displayImages = [hotel.image_url, ...(hotel.gallery_images || []), ...(hotel.images || [])].filter(Boolean);
  
  return <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      <main className="container max-w-6xl mx-auto px-4">
        {/* Main Grid: 2/3rds for Content (Left), 1/3rd for Details/Actions (Right) */}
        <div className="grid lg:grid-cols-[2fr,1fr] gap-6 sm:gap-4">
          
          {/* --- START: Mobile-First Detail/Action Content Block --- 
            This block contains elements that must appear BEFORE the Carousel/Description on mobile, 
            but should be hidden on desktop as they are displayed in the fixed right column.
          */}
          <div className="lg:hidden space-y-4 sm:space-y-3">
            {/* 1. Name and Location Block */}
            <div>
              <h1 className="text-3xl sm:text-2xl font-bold mb-2">{hotel.name}</h1>
              {hotel.local_name && (
                <p className="text-lg sm:text-base text-muted-foreground mb-2">"{hotel.local_name}"</p>
              )}
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <MapPin className="h-4 w-4" style={{ color: TEAL_COLOR }} />
                <span className="sm:text-sm">{hotel.location}, {hotel.country}</span>
                {distance !== undefined && (
                  <span className="text-xs font-medium ml-auto" style={{ color: TEAL_COLOR }}>
                    {distance < 1 ? `${Math.round(distance * 1000)}m away` : `${distance.toFixed(1)}km away`}
                  </span>
                )}
              </div>
              {hotel.place && (
                <p className="text-sm text-muted-foreground mb-4 sm:mb-2">Place: {hotel.place}</p>
              )}
            </div>

            {/* 2. Operating Hours/Availability Card (Teal border) */}
            <div className="p-4 sm:p-3 border bg-card mb-4 sm:mb-2" style={{ borderColor: TEAL_COLOR }}>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" style={{ color: TEAL_COLOR }} />
                <div>
                  <p className="text-sm sm:text-xs text-muted-foreground">Working Hours & Days</p>
                  <p className="font-semibold sm:text-sm">
                    {(hotel.opening_hours || hotel.closing_hours)
                      ? `${hotel.opening_hours || 'N/A'} - ${hotel.closing_hours || 'N/A'}`
                      : 'Not specified'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="font-medium">Working Days:</span>{' '}
                    {hotel.days_opened && hotel.days_opened.length > 0
                      ? hotel.days_opened.join(', ')
                      : 'Not specified'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* 3. Total Star Rating (Mobile) */}
            <div className="mb-4">
              <StarRatingDisplay rating={averageRating} count={reviewCount} size={5} />
            </div>

            {/* 4. Book Now Button */}
            <div className="space-y-3">
              <Button 
                size="lg" 
                className="w-full text-white h-10 sm:h-9" 
                onClick={() => { setIsCompleted(false); setBookingOpen(true); }}
                style={{ backgroundColor: TEAL_COLOR }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#005555')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = TEAL_COLOR)}
              >
                Book Now
              </Button>
            </div>
            
            {/* 5. Action Buttons (Map, Copy, Share, Save) */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={openInMaps} className="flex-1 h-9" style={{ borderColor: TEAL_COLOR, color: TEAL_COLOR }}><MapPin className="h-4 w-4 md:mr-2" style={{ color: TEAL_COLOR }} /><span className="hidden md:inline">Map</span></Button>
              <Button variant="outline" size="sm" onClick={handleCopyLink} className="flex-1 h-9" style={{ borderColor: TEAL_COLOR, color: TEAL_COLOR }}><Copy className="h-4 w-4 md:mr-2" style={{ color: TEAL_COLOR }} /><span className="hidden md:inline">Copy Link</span></Button>
              <Button variant="outline" size="sm" onClick={handleShare} className="flex-1 h-9" style={{ borderColor: TEAL_COLOR, color: TEAL_COLOR }}><Share2 className="h-4 w-4 md:mr-2" style={{ color: TEAL_COLOR }} /><span className="hidden md:inline">Share</span></Button>
              <Button variant="outline" size="icon" onClick={handleSave} className={`h-9 w-9 ${isSaved ? "bg-red-500 text-white hover:bg-red-600" : ""}`} style={{ borderColor: TEAL_COLOR, color: isSaved ? 'white' : TEAL_COLOR }}>
                <Heart className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
              </Button>
            </div>

            {/* 6. Contact Information Section */}
            {(hotel.phone_numbers || hotel.email) && (
              <div className="mt-4 p-4 sm:p-3 border bg-card rounded-lg">
                <h2 className="text-xl sm:text-lg font-semibold mb-3">Contact Information</h2>
                <div className="space-y-2">
                  {hotel.phone_numbers?.map((phone, idx) => (
                    <a key={idx} href={`tel:${phone}`} className="flex items-center gap-2 px-4 py-3 border rounded-lg hover:bg-muted transition-colors" style={{ borderColor: TEAL_COLOR }}>
                      <Phone className="h-4 w-4" style={{ color: TEAL_COLOR }} />
                      <span className="text-sm" style={{ color: TEAL_COLOR }}>{phone}</span>
                    </a>
                  ))}
                  {hotel.email && (
                    <a href={`mailto:${hotel.email}`} className="flex items-center gap-2 px-4 py-3 border rounded-lg hover:bg-muted transition-colors" style={{ borderColor: TEAL_COLOR }}>
                      <Mail className="h-4 w-4" style={{ color: TEAL_COLOR }} />
                      <span className="text-sm" style={{ color: TEAL_COLOR }}>{hotel.email}</span>
                    </a>
                  )}
                </div>
              </div>
            )}
            
          </div>
          {/* --- END: Mobile-First Detail/Action Content Block --- */}


          {/* --- Image Carousel Section (Left Column on Desktop, Mobile Order 1 in its own parent div) --- */}
          <div className="w-full">
            <div className="relative">
              {/* Back Button over carousel */}
              <Button variant="ghost" onClick={() => navigate(-1)} className="absolute top-4 left-4 z-20 h-10 w-10 p-0 rounded-full text-white" style={{ backgroundColor: TEAL_COLOR }} size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <Carousel opts={{ loop: true }} plugins={[Autoplay({ delay: 3000 })]} className="w-full overflow-hidden" setApi={api => {
                if (api) api.on("select", () => setCurrent(api.selectedScrollSnap()));
              }}>
                <CarouselContent>
                  {displayImages.map((img, idx) => <CarouselItem key={idx}>
                      <img src={img} alt={`${hotel.name} ${idx + 1}`} loading="lazy" decoding="async" className="w-full h-64 md:h-96 object-cover" />
                    </CarouselItem>)}
                </CarouselContent>
              </Carousel>
              
              {/* Dot indicators */}
              {displayImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
                  {displayImages.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`w-2 h-2 rounded-full transition-all ${current === idx ? 'bg-white w-4' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
              )}
            </div>
            
            {/* 7. Description Section (Mobile Order 7/Post-Carousel) */}
            {hotel.description && 
              <div className="bg-card border rounded-lg p-4 sm:p-3 mt-4">
                <h2 className="text-lg sm:text-base font-semibold mb-2">About This Hotel</h2>
                <p className="text-sm text-muted-foreground">{hotel.description}</p>
              </div>
            }
            
            {/* 8. Amenities Section (RED) */}
            {hotel.amenities && hotel.amenities.length > 0 && (
              <div className="mt-6 sm:mt-4 p-4 sm:p-3 border bg-card rounded-lg">
                <h2 className="text-xl sm:text-lg font-semibold mb-4 sm:mb-3">Amenities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {hotel.amenities.map((amenity, idx) => (
                    <div 
                      key={idx} 
                      className="px-3 py-2 text-white rounded-lg text-sm flex items-center justify-center text-center min-h-[44px]"
                      style={{ backgroundColor: RED_COLOR }}
                    >
                      <span className="font-medium">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 9. Facilities (Room Types) Section (TEAL) */}
            {hotel.facilities && hotel.facilities.length > 0 && (
              <div className="mt-6 sm:mt-4 p-4 sm:p-3 border bg-card rounded-lg">
                <h2 className="text-xl sm:text-lg font-semibold mb-4 sm:mb-3">Facilities (Room Types)</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {hotel.facilities.map((facility, idx) => (
                    <div 
                      key={idx} 
                      className="px-3 py-2 text-white rounded-lg text-sm flex flex-col items-center justify-center text-center min-h-[60px]"
                      style={{ backgroundColor: TEAL_COLOR }}
                    >
                      <span className="font-medium">{facility.name}</span>
                      <span className="text-xs opacity-90 mt-1">{facility.price === 0 ? 'Free' : `KSh ${facility.price}/day`}</span>
                      {facility.capacity > 0 && <span className="text-xs opacity-90">Capacity: {facility.capacity}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 10. Activities Section (ORANGE) */}
            {hotel.activities && hotel.activities.length > 0 && (
              <div className="mt-6 sm:mt-4 p-4 sm:p-3 border bg-card rounded-lg">
                <h2 className="text-xl sm:text-lg font-semibold mb-4 sm:mb-3">Activities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {hotel.activities.map((activity, idx) => (
                    <div 
                      key={idx} 
                      className="px-3 py-2 text-white rounded-lg text-sm flex flex-col items-center justify-center text-center min-h-[60px]"
                      style={{ backgroundColor: ORANGE_COLOR }}
                    >
                      <span className="font-medium">{activity.name}</span>
                      <span className="text-xs opacity-90 mt-1">{activity.price === 0 ? 'Free' : `KSh ${activity.price}/person`}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 11. Review Section (Full Rating/Submission) - Placed after Activities/Facilities */}
            <div className="mt-6 sm:mt-4">
              <ReviewSection 
                itemId={hotel.id} 
                itemType="hotel" 
                // Capture the rating data here for the top display
                onRatingsChange={({ averageRating, reviewCount }: { averageRating: number, reviewCount: number }) => {
                  setAverageRating(averageRating);
                  setReviewCount(reviewCount);
                }}
              />
            </div>

          </div> {/* End of Left/Full Width Column (Carousel + Description + Amenities + Facilities + Activities + Full Review) */}

          {/* --- START: Fixed Detail/Action Content Block (Right Column on Desktop) --- 
            This block contains elements fixed to the right column on desktop, but hidden 
            on mobile because they are included in the mobile-first block above.
          */}
          <div className="hidden lg:block space-y-4 sm:space-y-3">
            {/* 1. Name and Location Block (Desktop) */}
            <div>
              <h1 className="text-3xl sm:text-2xl font-bold mb-2">{hotel.name}</h1>
              {hotel.local_name && (
                <p className="text-lg sm:text-base text-muted-foreground mb-2">"{hotel.local_name}"</p>
              )}
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <MapPin className="h-4 w-4" style={{ color: TEAL_COLOR }} />
                <span className="sm:text-sm">{hotel.location}, {hotel.country}</span>
                {distance !== undefined && (
                  <span className="text-xs font-medium ml-auto" style={{ color: TEAL_COLOR }}>
                    {distance < 1 ? `${Math.round(distance * 1000)}m away` : `${distance.toFixed(1)}km away`}
                  </span>
                )}
              </div>
              {hotel.place && (
                <p className="text-sm text-muted-foreground mb-4 sm:mb-2">Place: {hotel.place}</p>
              )}
            </div>

            {/* 2. Operating Hours/Availability Card (Desktop) */}
            <div className="p-4 sm:p-3 border bg-card mb-4 sm:mb-2" style={{ borderColor: TEAL_COLOR }}>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" style={{ color: TEAL_COLOR }} />
                <div>
                  <p className="text-sm sm:text-xs text-muted-foreground">Working Hours & Days</p>
                  <p className="font-semibold sm:text-sm">
                    {(hotel.opening_hours || hotel.closing_hours)
                      ? `${hotel.opening_hours || 'N/A'} - ${hotel.closing_hours || 'N/A'}`
                      : 'Not specified'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="font-medium">Working Days:</span>{' '}
                    {hotel.days_opened && hotel.days_opened.length > 0
                      ? hotel.days_opened.join(', ')
                      : 'Not specified'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* 3. Total Star Rating (Desktop) */}
            <div className="mb-4">
              <StarRatingDisplay rating={averageRating} count={reviewCount} size={5} />
            </div>

            {/* 4. Book Now Button (Desktop) */}
            <div className="space-y-3">
              <Button 
                size="lg" 
                className="w-full text-white h-10 sm:h-9" 
                onClick={() => { setIsCompleted(false); setBookingOpen(true); }}
                style={{ backgroundColor: TEAL_COLOR }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#005555')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = TEAL_COLOR)}
              >
                Book Now
              </Button>
            </div>

            {/* 5. Action Buttons (Desktop) */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={openInMaps} className="flex-1 h-9" style={{ borderColor: TEAL_COLOR, color: TEAL_COLOR }}><MapPin className="h-4 w-4 md:mr-2" style={{ color: TEAL_COLOR }} /><span className="hidden md:inline">Map</span></Button>
              <Button variant="outline" size="sm" onClick={handleCopyLink} className="flex-1 h-9" style={{ borderColor: TEAL_COLOR, color: TEAL_COLOR }}><Copy className="h-4 w-4 md:mr-2" style={{ color: TEAL_COLOR }} /><span className="hidden md:inline">Copy Link</span></Button>
              <Button variant="outline" size="sm" onClick={handleShare} className="flex-1 h-9" style={{ borderColor: TEAL_COLOR, color: TEAL_COLOR }}><Share2 className="h-4 w-4 md:mr-2" style={{ color: TEAL_COLOR }} /><span className="hidden md:inline">Share</span></Button>
              <Button variant="outline" size="icon" onClick={handleSave} className={`h-9 w-9 ${isSaved ? "bg-red-500 text-white hover:bg-red-600" : ""}`} style={{ borderColor: TEAL_COLOR, color: isSaved ? 'white' : TEAL_COLOR }}>
                <Heart className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
              </Button>
            </div>
            
            {/* 6. Contact Information Section (Desktop) */}
            {(hotel.phone_numbers || hotel.email) && (
              <div className="mt-4 p-4 sm:p-3 border bg-card rounded-lg">
                <h2 className="text-xl sm:text-lg font-semibold mb-3">Contact Information</h2>
                <div className="space-y-2">
                  {hotel.phone_numbers?.map((phone, idx) => (
                    <a key={idx} href={`tel:${phone}`} className="flex items-center gap-2 px-4 py-3 border rounded-lg hover:bg-muted transition-colors" style={{ borderColor: TEAL_COLOR }}>
                      <Phone className="h-4 w-4" style={{ color: TEAL_COLOR }} />
                      <span className="text-sm" style={{ color: TEAL_COLOR }}>{phone}</span>
                    </a>
                  ))}
                  {hotel.email && (
                    <a href={`mailto:${hotel.email}`} className="flex items-center gap-2 px-4 py-3 border rounded-lg hover:bg-muted transition-colors" style={{ borderColor: TEAL_COLOR }}>
                      <Mail className="h-4 w-4" style={{ color: TEAL_COLOR }} />
                      <span className="text-sm" style={{ color: TEAL_COLOR }}>{hotel.email}</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div> {/* End of Right Column (Desktop Only) */}
        </div>
        
        {/* --- Similar Items Section (Full Width) --- */}
        {hotel && <SimilarItems currentItemId={hotel.id} itemType="hotel" country={hotel.country} />}
      </main>

      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <MultiStepBooking 
            onSubmit={handleBookingSubmit} 
            facilities={hotel.facilities || []} 
            activities={hotel.activities || []} 
            isProcessing={isProcessing} 
            isCompleted={isCompleted} 
            itemName={hotel.name}
            itemId={hotel.id}
            bookingType="hotel"
            hostId={hotel.created_by || ""}
            onPaymentSuccess={() => setIsCompleted(true)}
          />
        </DialogContent>
      </Dialog>

      <MobileBottomBar />
    </div>;
};
export default HotelDetail;