import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { Button } from "@/components/ui/button";
import { MapPin, Share2, Heart, Calendar, Copy, CheckCircle2, Star } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

// Updated Color Palette
const COLORS = {
  TEAL: "#008080",      // Primary Brand Text
  CORAL: "#FF7F50",     // Booking Button Base
  CORAL_LIGHT: "#FF9E7A", // For gradients
  KHAKI: "#F0E68C",     // Button Backgrounds
  KHAKI_DARK: "#857F3E", // Icon and Button Text
  RED: "#FF0000",       // Heart/Saved
  SOFT_GRAY: "#F8F9FA"  // Background
};

const EventDetail = () => {
  const { slug } = useParams();
  const id = slug ? extractIdFromSlug(slug) : null;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [event, setEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
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
      setEvent(data);
    } catch (error) {
      toast({ title: "Event not found", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => id && handleSaveItem(id, "event");
  const handleCopyLink = async () => {
    if (!event) return;
    const refLink = await generateReferralLink(event.id, "event", event.id);
    await navigator.clipboard.writeText(refLink);
    toast({ title: "Link Copied!" });
  };

  const handleShare = async () => {
    if (!event) return;
    const refLink = await generateReferralLink(event.id, "event", event.id);
    if (navigator.share) {
      try { await navigator.share({ title: event.name, url: refLink }); } catch (e) {}
    } else { handleCopyLink(); }
  };

  const openInMaps = () => {
    const query = encodeURIComponent(`${event?.name}, ${event?.location}`);
    window.open(event?.map_link || `https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
  };

  const { submitBooking } = useBookingSubmit();

  const handleBookingSubmit = async (data: BookingFormData) => {
    if (!event) return;
    setIsProcessing(true);
    try {
      const totalAmount = (data.num_adults * event.price) + (data.num_children * event.price_child);
      await submitBooking({
        itemId: event.id, itemName: event.name, bookingType: 'event', totalAmount,
        slotsBooked: data.num_adults + data.num_children, visitDate: event.date,
        guestName: data.guest_name, guestEmail: data.guest_email, guestPhone: data.guest_phone,
        hostId: event.created_by, bookingDetails: { ...data, event_name: event.name }
      });
      setIsCompleted(true);
      setShowBooking(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally { setIsProcessing(false); }
  };

  // Star Rating Helper for Mobile Summary
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star 
            key={s} 
            className={`h-3 w-3 ${s <= Math.round(rating || 5) ? "fill-[#FF7F50] text-[#FF7F50]" : "text-slate-200"}`} 
          />
        ))}
      </div>
    );
  };

  if (loading) return <div className="min-h-screen bg-slate-50 animate-pulse" />;

  const allImages = [event?.image_url, ...(event?.images || [])].filter(Boolean);

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      <Header className="hidden md:block" />

      {/* Hero Image Section */}
      <div className="relative w-full overflow-hidden h-[40vh] md:h-[50vh]">
        <div className="absolute top-4 left-4 right-4 z-30 flex justify-between">
          <Button onClick={() => navigate(-1)} className="rounded-full bg-black/30 backdrop-blur-md text-white border-none w-10 h-10 p-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Button onClick={handleSave} className={`rounded-full backdrop-blur-md border-none w-10 h-10 p-0 shadow-lg ${isSaved ? "bg-red-500" : "bg-black/30"}`}>
            <Heart className={`h-5 w-5 text-white ${isSaved ? "fill-white" : ""}`} />
          </Button>
        </div>

        <Carousel plugins={[Autoplay({ delay: 4000 })]} className="w-full h-full">
          <CarouselContent className="h-full">
            {allImages.map((img, idx) => (
              <CarouselItem key={idx} className="h-full">
                <div className="relative h-full w-full">
                  <img src={img} alt={event.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        <div className="absolute bottom-6 left-6 text-white">
          <Badge className="bg-[#FF7F50] hover:bg-[#FF7F50] border-none px-3 py-1 mb-2">UPCOMING EVENT</Badge>
          <h1 className="text-2xl md:text-4xl font-bold uppercase tracking-tight leading-tight drop-shadow-lg">
            {event.name}
          </h1>
          <div className="flex items-center gap-1 opacity-90 mt-1">
            <MapPin className="h-3 w-3" />
            <span className="text-xs font-medium uppercase">{event.location}</span>
          </div>
        </div>
      </div>

      <main className="container px-4 max-w-6xl mx-auto -mt-4 relative z-40">
        <div className="grid lg:grid-cols-[1.7fr,1fr] gap-6">
          
          <div className="space-y-4">
            {/* About Card */}
            <div className="bg-white rounded-[24px] p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-3" style={{ color: COLORS.TEAL }}>About the Event</h2>
              <p className="text-slate-500 text-sm leading-relaxed leading-6">{event.description}</p>
            </div>

            {/* Highlights Card */}
            {event.activities?.length > 0 && (
              <div className="bg-white rounded-[24px] p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-4" style={{ color: COLORS.TEAL }}>Included Highlights</h2>
                <div className="flex flex-wrap gap-2">
                  {event.activities.map((act: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 bg-[#F0E68C]/30 px-4 py-2 rounded-full border border-[#F0E68C]">
                      <CheckCircle2 className="h-4 w-4 text-[#857F3E]" />
                      <span className="text-xs font-bold text-[#857F3E] uppercase">{act.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Review Section - Shown ONLY on large screens */}
            <div className="hidden lg:block">
               <ReviewSection itemId={event.id} itemType="event" />
            </div>
          </div>

          {/* Sidebar / Booking Card */}
          <div className="space-y-4">
            <div className="bg-white rounded-[24px] p-6 shadow-2xl border border-slate-100 lg:sticky lg:top-24">
              
              {/* MOBILE ONLY REVIEW SUMMARY: Stars and Average Rating */}
              <div className="flex items-center justify-between mb-5 lg:hidden pb-4 border-b border-slate-50">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Guest Experience</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-slate-800 leading-none">
                      {event.average_rating || "4.8"}
                    </span>
                    <div className="flex flex-col justify-center">
                      {renderStars(event.average_rating || 4.8)}
                      <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">
                        {event.review_count || "12"} Verified Reviews
                      </span>
                    </div>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-full bg-teal-50 flex items-center justify-center border border-teal-100">
                  <CheckCircle2 className="h-5 w-5 text-teal-600" />
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black" style={{ color: COLORS.TEAL }}>KSh {event.price}</span>
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-tighter">per adult</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                  <Calendar className="h-4 w-4" style={{ color: COLORS.CORAL }} />
                  <span className="text-[11px] font-black text-slate-500 uppercase">
                    {new Date(event.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              </div>

              <div className="space-y-4 py-4 border-t border-b border-dashed border-slate-200 mb-6">
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-400 font-bold uppercase">Child Price</span>
                  <span className="font-bold">KSh {event.price_child || 0}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-400 font-bold uppercase">Availability</span>
                  <span className="font-bold text-green-500">{event.available_tickets} slots left</span>
                </div>
              </div>

              <Button 
                onClick={() => setShowBooking(true)}
                disabled={event.available_tickets <= 0}
                className="w-full py-7 rounded-xl text-md font-black uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 border-none"
                style={{ 
                    background: `linear-gradient(135deg, ${COLORS.CORAL_LIGHT} 0%, ${COLORS.CORAL} 100%)`,
                    boxShadow: `0 10px 20px -5px ${COLORS.CORAL}66`
                }}
              >
                {event.available_tickets <= 0 ? "Fully Booked" : "Reserve Your Spot"}
              </Button>
              
              <p className="text-[10px] text-center text-slate-400 mt-4 uppercase font-bold tracking-tighter italic">
                Instant confirmation • Secure payment
              </p>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 mt-6 pt-6 border-t border-slate-50">
                <Button variant="ghost" onClick={openInMaps} className="flex-col h-auto py-2 bg-[#F0E68C]/20 text-[#857F3E] rounded-xl hover:bg-[#F0E68C]/40">
                  <MapPin className="h-5 w-5 mb-1" />
                  <span className="text-[9px] font-black uppercase">Map</span>
                </Button>
                <Button variant="ghost" onClick={handleCopyLink} className="flex-col h-auto py-2 bg-[#F0E68C]/20 text-[#857F3E] rounded-xl hover:bg-[#F0E68C]/40">
                  <Copy className="h-5 w-5 mb-1" />
                  <span className="text-[9px] font-black uppercase">Copy</span>
                </Button>
                <Button variant="ghost" onClick={handleShare} className="flex-col h-auto py-2 bg-[#F0E68C]/20 text-[#857F3E] rounded-xl hover:bg-[#F0E68C]/40">
                  <Share2 className="h-5 w-5 mb-1" />
                  <span className="text-[9px] font-black uppercase">Share</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12">
            <SimilarItems currentItemId={event.id} itemType="trip" location={event.location} country={event.country} />
        </div>
      </main>

      {/* Booking Dialog */}
      <Dialog open={showBooking} onOpenChange={setShowBooking}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden rounded-[32px] border-none shadow-2xl">
          <MultiStepBooking 
            onSubmit={handleBookingSubmit} activities={event.activities || []} 
            priceAdult={event.price} priceChild={event.price_child} 
            isProcessing={isProcessing} isCompleted={isCompleted} 
            itemName={event.name} skipDateSelection={true} fixedDate={event.date} 
            skipFacilitiesAndActivities={true} itemId={event.id} bookingType="event" 
            hostId={event.created_by || ""} onPaymentSuccess={() => setIsCompleted(true)} 
          />
        </DialogContent>
      </Dialog>

      <MobileBottomBar />
    </div>
  );
};

export default EventDetail;