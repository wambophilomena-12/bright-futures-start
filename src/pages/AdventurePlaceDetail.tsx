import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { Button } from "@/components/ui/button";
import { MapPin, Share2, Heart, Calendar, Copy, CheckCircle2, ArrowLeft, Star, Clock, Phone, Mail } from "lucide-react";
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
import { useGeolocation, calculateDistance } from "@/hooks/useGeolocation";

const COLORS = {
  TEAL: "#008080",
  CORAL: "#FF7F50",
  RED: "#FF0000",
  ORANGE: "#FF9800",
  SOFT_GRAY: "#F8F9FA"
};

const AdventurePlaceDetail = () => {
  const { slug } = useParams();
  const id = slug ? extractIdFromSlug(slug) : null;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { position, requestLocation } = useGeolocation();
  
  const [place, setPlace] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const { savedItems, handleSave: handleSaveItem } = useSavedItems();
  const isSaved = savedItems.has(id || "");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (id) fetchPlace();
    requestLocation();
    const urlParams = new URLSearchParams(window.location.search);
    const refSlug = urlParams.get("ref");
    if (refSlug && id) trackReferralClick(refSlug, id, "adventure_place", "booking");
  }, [id]);

  const fetchPlace = async () => {
    if (!id) return;
    try {
      let { data, error } = await supabase.from("adventure_places").select("*").eq("id", id).single();
      if (error && id.length === 8) {
        const { data: pData, error: pError } = await supabase.from("adventure_places").select("*").ilike("id", `${id}%`).single();
        if (!pError) { data = pData; error = null; }
      }
      if (error) throw error;
      setPlace(data);
    } catch (e) { toast({ title: "Place not found", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const distance = position && place?.latitude && place?.longitude
    ? calculateDistance(position.latitude, position.longitude, place.latitude, place.longitude)
    : null;

  const handleSave = () => id && handleSaveItem(id, "adventure_place");
  const handleShare = async () => {
    if (!place) return;
    const refLink = await generateReferralLink(place.id, "adventure_place", place.id);
    if (navigator.share) {
      try { await navigator.share({ title: place.name, url: refLink }); } catch (e) {}
    } else {
      await navigator.clipboard.writeText(refLink);
      toast({ title: "Link Copied!" });
    }
  };

  const { submitBooking } = useBookingSubmit();

  const handleBookingSubmit = async (data: BookingFormData) => {
    if (!place) return;
    setIsProcessing(true);
    try {
      const entryPrice = place.entry_fee_type === 'free' ? 0 : (place.entry_fee || 0);
      const totalAmount = (data.num_adults * entryPrice) + (data.num_children * entryPrice);
      await submitBooking({
        itemId: place.id, itemName: place.name, bookingType: 'adventure_place', totalAmount,
        slotsBooked: data.num_adults + data.num_children, visitDate: data.visit_date,
        guestName: data.guest_name, guestEmail: data.guest_email, guestPhone: data.guest_phone,
        hostId: place.created_by, bookingDetails: { ...data, place_name: place.name }
      });
      setIsCompleted(true);
      setShowBooking(false);
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setIsProcessing(false); }
  };

  if (loading) return <div className="min-h-screen bg-slate-50 animate-pulse" />;
  if (!place) return null;

  const allImages = [place.image_url, ...(place.gallery_images || []), ...(place.images || [])].filter(Boolean);

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      <Header className="hidden md:block" />

      {/* Hero Section */}
      <div className="relative w-full h-[45vh] md:h-[55vh] overflow-hidden">
        <div className="absolute top-4 left-4 right-4 z-30 flex justify-between">
          <Button onClick={() => navigate(-1)} className="rounded-full bg-black/30 backdrop-blur-md text-white w-10 h-10 p-0"><ArrowLeft className="h-5 w-5" /></Button>
          <Button onClick={handleSave} className={`rounded-full backdrop-blur-md w-10 h-10 p-0 ${isSaved ? "bg-red-500" : "bg-black/30"}`}><Heart className={`h-5 w-5 ${isSaved ? "fill-white" : ""}`} /></Button>
        </div>
        <Carousel plugins={[Autoplay({ delay: 4000 })]} className="h-full">
          <CarouselContent className="h-full">
            {allImages.map((img, i) => (
              <CarouselItem key={i} className="h-full">
                <div className="relative h-full">
                  <img src={img} className="w-full h-full object-cover" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        <div className="absolute bottom-12 left-6 right-6 text-white">
          <Badge className="bg-[#008080] mb-3 uppercase font-black tracking-widest text-[10px]">Adventure Destination</Badge>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-none mb-2">{place.name}</h1>
          <div className="flex items-center gap-2 opacity-90 text-sm font-bold uppercase">
            <MapPin className="h-4 w-4 text-[#FF7F50]" /> {place.location} {distance && `• ${distance.toFixed(1)}km away`}
          </div>
        </div>
      </div>

      <main className="container px-4 max-w-6xl mx-auto -mt-10 relative z-40">
        <div className="grid lg:grid-cols-[1.7fr,1fr] gap-6">
          <div className="space-y-6">
            <div className="bg-white rounded-[28px] p-7 shadow-sm border border-slate-100">
              <h2 className="text-xl font-black uppercase tracking-tight mb-4" style={{ color: COLORS.TEAL }}>About</h2>
              <p className="text-slate-500 text-sm leading-relaxed">{place.description}</p>
            </div>

            {/* Facilities Section */}
            {place.facilities?.length > 0 && (
              <div className="bg-white rounded-[28px] p-7 shadow-sm border border-slate-100">
                <h2 className="text-xl font-black uppercase tracking-tight mb-5" style={{ color: COLORS.TEAL }}>Facilities</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {place.facilities.map((f: any, i: number) => (
                    <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                      <div>
                        <p className="text-xs font-black uppercase tracking-tight text-slate-700">{f.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold">CAPACITY: {f.capacity || 'N/A'}</p>
                      </div>
                      <span className="text-sm font-black text-[#008080]">KSh {f.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activities Section */}
            {place.activities?.length > 0 && (
              <div className="bg-white rounded-[28px] p-7 shadow-sm border border-slate-100">
                <h2 className="text-xl font-black uppercase tracking-tight mb-5" style={{ color: COLORS.ORANGE }}>Experiences</h2>
                <div className="flex flex-wrap gap-2">
                  {place.activities.map((act: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 bg-orange-50 px-4 py-2.5 rounded-2xl border border-orange-100">
                      <Star className="h-3 w-3 text-[#FF9800] fill-[#FF9800]" />
                      <span className="text-[11px] font-black text-[#857F3E] uppercase tracking-wide">{act.name} (KSh {act.price})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-[32px] p-8 shadow-2xl border border-slate-100 lg:sticky lg:top-24">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Entry Fee</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black" style={{ color: COLORS.RED }}>
                      {place.entry_fee_type === 'free' ? 'FREE' : `KSh ${place.entry_fee}`}
                    </span>
                  </div>
                </div>
                <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 flex items-center gap-2">
                  <Clock className="h-4 w-4" style={{ color: COLORS.CORAL }} />
                  <span className="text-xs font-black text-slate-600 uppercase">{place.opening_hours}</span>
                </div>
              </div>

              <Button 
                onClick={() => setShowBooking(true)}
                className="w-full py-8 rounded-2xl text-md font-black uppercase tracking-[0.2em] text-white transition-all active:scale-95 mb-6"
                style={{ background: `linear-gradient(135deg, ${COLORS.TEAL} 0%, #004D4D 100%)`, boxShadow: `0 12px 24px -8px ${COLORS.TEAL}88` }}
              >
                Secure Spot
              </Button>

              <div className="grid grid-cols-3 gap-3">
                <UtilityBtn icon={<MapPin className="h-5 w-5" />} label="Map" onClick={() => window.open(place.map_link)} />
                <UtilityBtn icon={<Copy className="h-5 w-5" />} label="Copy" onClick={() => {navigator.clipboard.writeText(window.location.href); toast({title: "Copied!"})}} />
                <UtilityBtn icon={<Share2 className="h-5 w-5" />} label="Share" onClick={handleShare} />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={showBooking} onOpenChange={setShowBooking}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden rounded-[40px] border-none shadow-2xl">
          <MultiStepBooking 
            onSubmit={handleBookingSubmit} facilities={place.facilities || []} activities={place.activities || []} 
            priceAdult={place.entry_fee} priceChild={place.entry_fee} isProcessing={isProcessing} isCompleted={isCompleted} 
            itemName={place.name} itemId={place.id} bookingType="adventure_place" hostId={place.created_by} onPaymentSuccess={() => setIsCompleted(true)} 
          />
        </DialogContent>
      </Dialog>
      <MobileBottomBar />
    </div>
  );
};

const UtilityBtn = ({ icon, label, onClick }: any) => (
  <Button variant="ghost" onClick={onClick} className="flex-col h-auto py-3 bg-slate-50 text-slate-500 rounded-2xl border border-slate-100">
    <div className="mb-1">{icon}</div>
    <span className="text-[10px] font-black uppercase">{label}</span>
  </Button>
);

export default AdventurePlaceDetail;