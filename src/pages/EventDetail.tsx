import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { Button } from "@/components/ui/button";
import { MapPin, Share2, Heart, Calendar, Phone, Mail, ArrowLeft, Copy, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { SimilarItems } from "@/components/SimilarItems";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { ReviewSection } from "@/components/ReviewSection";
import { useSavedItems } from "@/hooks/useSavedItems";
import { MultiStepBooking, BookingFormData } from "@/components/booking/MultiStepBooking";
import { generateReferralLink, trackReferralClick } from "@/lib/referralUtils";
import { useBookingSubmit } from "@/hooks/useBookingSubmit";
import { extractIdFromSlug } from "@/lib/slugUtils";

interface Activity {
  name: string;
  price: number;
}
interface Event {
  id: string;
  name: string;
  location: string;
  country: string;
  place: string;
  image_url: string;
  images: string[];
  description: string;
  price: number;
  price_child: number;
  date: string;
  is_custom_date: boolean;
  available_tickets: number;
  phone_number?: string;
  email?: string;
  map_link?: string;
  activities?: Activity[];
  type: string;
  created_by: string | null;
}

const TEAL_COLOR = "#008080";
const ORANGE_COLOR = "#FF9800";
const RED_COLOR = "#FF0000";

const EventDetail = () => {
  const { slug } = useParams();
  const id = slug ? extractIdFromSlug(slug) : null;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { savedItems, handleSave: handleSaveItem } = useSavedItems();
  const isSaved = savedItems.has(id || "");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (id) fetchEvent();
    const urlParams = new URLSearchParams(window.location.search);
    const refSlug = urlParams.get("ref");
    if (refSlug && id) trackReferralClick(refSlug, id, "event", "booking");
  }, [id]);

  const fetchEvent = async () => {
    if (!id) return;
    try {
      let { data, error } = await supabase.from("trips").select("*").eq("id", id).eq("type", "event").single();
      if (error && id.length === 8) {
        const { data: prefixData, error: prefixError } = await supabase.from("trips").select("*").ilike("id", `${id}%`).eq("type", "event").single();
        if (!prefixError) { data = prefixData; error = null; }
      }
      if (error) throw error;
      setEvent(data as any);
    } catch (error) {
      toast({ title: "Event not found", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => id && handleSaveItem(id, "event");

  const openInMaps = () => {
    if (event?.map_link) window.open(event.map_link, "_blank");
    else {
      const query = encodeURIComponent(`${event?.name}, ${event?.location}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
    }
  };

  const { submitBooking } = useBookingSubmit();

  const handleBookingSubmit = async (data: BookingFormData) => {
    if (!event) return;
    setIsProcessing(true);
    try {
      const totalAmount = data.num_adults * event.price + data.num_children * event.price_child;
      await submitBooking({
        itemId: event.id, itemName: event.name, bookingType: 'event', totalAmount,
        slotsBooked: data.num_adults + data.num_children, visitDate: event.date,
        guestName: data.guest_name, guestEmail: data.guest_email, guestPhone: data.guest_phone,
        hostId: event.created_by,
        bookingDetails: { event_name: event.name, date: event.date, adults: data.num_adults, children: data.num_children }
      });
      setIsProcessing(false); setIsCompleted(true);
      toast({ title: "Booking Submitted" });
    } catch (error: any) {
      setIsProcessing(false);
      toast({ title: "Booking failed", variant: "destructive" });
    }
  };

  if (loading) return <div className="min-h-screen bg-background pb-20"><MobileBottomBar /></div>;
  if (!event) return <div className="min-h-screen flex items-center justify-center"><p>Event not found</p></div>;

  const allImages = [event.image_url, ...(event.images || [])].filter(Boolean);

  return (
    <div className="min-h-screen bg-background pb-40 md:pb-10">
      <Header className="hidden md:block" /> 
      
      {/* HERO SECTION */}
      <div className="relative w-full overflow-hidden md:max-w-6xl md:mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="absolute top-4 left-4 z-30 h-10 w-10 p-0 rounded-full text-white bg-black/50" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        <Button variant="ghost" onClick={handleSave} className={`absolute top-4 right-4 z-30 h-10 w-10 p-0 rounded-full text-white ${isSaved ? "bg-red-600" : "bg-black/50"}`} size="icon"><Heart className={`h-5 w-5 ${isSaved ? "fill-white" : ""}`} /></Button>
        
        <Carousel opts={{ loop: true }} plugins={[Autoplay({ delay: 3000 })]} className="w-full">
          <CarouselContent>
            {allImages.map((img, idx) => (
              <CarouselItem key={idx}><img src={img} alt={event.name} className="w-full h-[42vh] md:h-96 lg:h-[500px] object-cover" /></CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        <div className="absolute bottom-0 left-0 right-0 p-4 z-20 text-white bg-gradient-to-t from-black/90 via-black/40 to-transparent">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full w-fit uppercase tracking-wider" style={{ backgroundColor: ORANGE_COLOR }}>Upcoming Event</span>
            <h1 className="text-2xl md:text-3xl font-bold uppercase">{event.name}</h1>
          </div>
        </div>
      </div>
      
      <main className="container px-4 max-w-6xl mx-auto mt-6">
        <div className="grid lg:grid-cols-[2fr,1fr] gap-8">
          
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 font-medium" style={{ color: TEAL_COLOR }} onClick={openInMaps}>
              <MapPin className="h-5 w-5" />
              <span>{event.location}, {event.country}</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4 border-y">
                <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground uppercase">Date</span>
                    <span className="font-bold flex items-center gap-1"><Calendar className="h-4 w-4" style={{ color: TEAL_COLOR }} /> {new Date(event.date).toLocaleDateString()}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground uppercase">Adult Price</span>
                    <span className="font-bold" style={{ color: TEAL_COLOR }}>KSh {event.price}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground uppercase">Child Price</span>
                    <span className="font-bold" style={{ color: TEAL_COLOR }}>{event.price_child > 0 ? `KSh ${event.price_child}` : 'N/A'}</span>
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-bold border-l-4 pl-3" style={{ borderLeftColor: TEAL_COLOR }}>Details</h2>
                <p className="text-muted-foreground whitespace-pre-line">{event.description}</p>
            </div>

            {event.activities && event.activities.length > 0 && (
              <div className="p-4 bg-muted/30 rounded-xl space-y-3">
                <h3 className="font-bold flex items-center gap-2"><Users className="h-4 w-4" style={{ color: ORANGE_COLOR }} /> Included Activities</h3>
                <div className="flex flex-wrap gap-2">
                  {event.activities.map((act, i) => (
                    <span key={i} className="px-3 py-1 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: ORANGE_COLOR }}>{act.name}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* DESKTOP SIDEBAR */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 p-6 border-2 rounded-2xl space-y-6 bg-card" style={{ borderColor: TEAL_COLOR }}>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Starting from</p>
                <p className="text-4xl font-black" style={{ color: TEAL_COLOR }}>KSh {event.price}</p>
              </div>
              <Button className="w-full h-14 text-lg font-bold transition-transform hover:scale-[1.02]" style={{ backgroundColor: TEAL_COLOR }} onClick={() => setShowBooking(true)}>Book Now</Button>
            </div>
          </aside>
        </div>

        <div className="mt-12 space-y-12">
          <ReviewSection itemId={event.id} itemType="event" />
          <SimilarItems currentItemId={event.id} itemType="trip" location={event.location} country={event.country} />
        </div>
      </main>

      {/* STICKY MOBILE CTA BAR (Detailed) */}
      <div className="fixed bottom-[64px] left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t shadow-[0_-10px_20px_rgba(0,0,0,0.05)] lg:hidden transition-all duration-300">
        <div className="px-4 py-3 flex flex-col gap-3">
          {/* Top Info Row */}
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-tight border-b pb-2">
             <div className="flex items-center gap-1" style={{ color: TEAL_COLOR }}>
                <Calendar className="h-3 w-3" />
                {new Date(event.date).toLocaleDateString()}
             </div>
             <div className="flex items-center gap-3">
                <span style={{ color: TEAL_COLOR }}>Adult: KSh {event.price}</span>
                {event.price_child > 0 && <span style={{ color: ORANGE_COLOR }}>Child: KSh {event.price_child}</span>}
             </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col flex-1" onClick={openInMaps}>
               <span className="text-[10px] text-muted-foreground uppercase font-bold">Location</span>
               <div className="flex items-center gap-1 text-sm font-bold truncate" style={{ color: TEAL_COLOR }}>
                 <MapPin className="h-3 w-3 shrink-0" />
                 <span className="truncate">{event.location}</span>
               </div>
            </div>
            <Button 
                className="flex-[1.5] h-12 text-white font-black text-sm rounded-xl uppercase shadow-lg shadow-teal-900/20 transition-active:scale-95" 
                style={{ backgroundColor: TEAL_COLOR }}
                onClick={() => { setIsCompleted(false); setShowBooking(true); }}
                disabled={event.available_tickets <= 0}
            >
                {event.available_tickets <= 0 ? "Sold Out" : "Book Now"}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showBooking} onOpenChange={setShowBooking}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <MultiStepBooking 
            onSubmit={handleBookingSubmit} activities={event.activities || []} 
            priceAdult={event.price} priceChild={event.price_child} 
            isProcessing={isProcessing} isCompleted={isCompleted} 
            itemName={event.name} skipDateSelection={true} fixedDate={event.date} 
            skipFacilitiesAndActivities={true} itemId={event.id} 
            bookingType="event" hostId={event.created_by || ""} 
            onPaymentSuccess={() => setIsCompleted(true)} 
          />
        </DialogContent>
      </Dialog>

      <MobileBottomBar />
    </div>
  );
};

export default EventDetail;