import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MapPin, Mail, Navigation, Clock, X, Hotel, CheckCircle2, Plus, Camera, Phone } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { registrationNumberSchema, descriptionSchema, approvalStatusSchema } from "@/lib/validation";
import { CountrySelector } from "@/components/creation/CountrySelector";
import { PhoneInput } from "@/components/creation/PhoneInput";
import { EmailVerification } from "@/components/creation/EmailVerification";

const COLORS = {
  TEAL: "#008080",
  CORAL: "#FF7F50",
  CORAL_LIGHT: "#FF9E7A",
  KHAKI: "#F0E68C",
  KHAKI_DARK: "#857F3E",
  RED: "#FF0000",
  SOFT_GRAY: "#F8F9FA"
};

const CreateHotel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  const [formData, setFormData] = useState({
    registrationName: "",
    registrationNumber: "",
    locationName: "",
    place: "",
    localName: "",
    country: "",
    description: "",
    email: "",
    phoneNumber: "",
    locationLink: "",
    openingHours: "",
    closingHours: "",
    entranceFeeType: "free",
    childPrice: "0",
    adultPrice: "0",
    establishmentType: "hotel",
    latitude: null as number | null,
    longitude: null as number | null
  });

  const [facilities, setFacilities] = useState([{ name: "", priceType: "free", price: "0", capacity: "0" }]);
  const [activities, setActivities] = useState([{ name: "", priceType: "free", price: "0" }]);
  const [amenities, setAmenities] = useState<string[]>([""]);
  const [galleryImages, setGalleryImages] = useState<File[]>([]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('country').eq('id', user.id).single();
        if (profile?.country) setFormData(prev => ({ ...prev, country: profile.country }));
      }
    };
    fetchUserProfile();
  }, [user]);

  const getCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFormData(prev => ({ ...prev, locationLink: `https://google.com/maps?q=${latitude},${longitude}`, latitude, longitude }));
          toast({ title: "Coordinates Captured", description: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` });
        },
        () => toast({ title: "Error", description: "Enable location permissions.", variant: "destructive" })
      );
    }
  };

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).slice(0, 5 - galleryImages.length);
    setGalleryImages(prev => [...prev, ...newFiles]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return navigate("/auth");
    if (!formData.latitude) return toast({ title: "Missing Location", variant: "destructive" });
    if (galleryImages.length === 0) return toast({ title: "Photos Required", variant: "destructive" });

    setLoading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of galleryImages) {
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const { error: uploadError } = await supabase.storage.from('listing-images').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('listing-images').getPublicUrl(fileName);
        uploadedUrls.push(publicUrl);
      }

      const { error } = await supabase.from("hotels").insert([{
        name: formData.registrationName,
        local_name: formData.localName,
        registration_number: formData.registrationNumber,
        location: formData.locationName,
        place: formData.place || formData.locationName,
        country: formData.country,
        description: formData.description,
        email: formData.email,
        phone_numbers: [formData.phoneNumber],
        latitude: formData.latitude,
        longitude: formData.longitude,
        image_url: uploadedUrls[0],
        gallery_images: uploadedUrls,
        establishment_type: formData.establishmentType,
        facilities: facilities.filter(f => f.name),
        activities: activities.filter(a => a.name),
        amenities: amenities.filter(a => a),
        created_by: user.id,
        approval_status: "pending"
      }]);

      if (error) throw error;
      toast({ title: "Listing Submitted", description: "Our team will verify your property shortly." });
      navigate("/become-host");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      <Header className="hidden md:block" />

      {/* Hero Header */}
      <div className="relative w-full h-[30vh] md:h-[40vh] bg-slate-900 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200" 
          className="w-full h-full object-cover opacity-50" 
          alt="Hotel Header"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#F8F9FA] via-transparent to-transparent" />
        <div className="absolute bottom-10 left-0 w-full p-8 container mx-auto">
          <Button className="bg-[#FF7F50] hover:bg-[#FF7F50] border-none px-4 py-1.5 h-auto uppercase font-black tracking-[0.15em] text-[10px] rounded-full mb-4">
            Host Dashboard
          </Button>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none text-white drop-shadow-2xl">
            List Your <span style={{ color: COLORS.TEAL }}>Property</span>
          </h1>
        </div>
      </div>

      <main className="container px-4 max-w-4xl mx-auto -mt-10 relative z-50">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section: Registration */}
          <Card className="bg-white rounded-[28px] p-8 shadow-sm border-none">
            <h2 className="text-xl font-black uppercase tracking-tight mb-6 flex items-center gap-2" style={{ color: COLORS.TEAL }}>
              <CheckCircle2 className="h-5 w-5" /> Registration Details
            </h2>
            
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Business Name (As per Documents)</Label>
                <Input 
                  className="rounded-xl border-slate-100 bg-slate-50 focus:bg-white transition-all h-12 font-bold"
                  required 
                  value={formData.registrationName} 
                  onChange={(e) => setFormData({...formData, registrationName: e.target.value})}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Registration Number</Label>
                  <Input 
                    className="rounded-xl border-slate-100 bg-slate-50 h-12 font-bold"
                    required 
                    value={formData.registrationNumber} 
                    onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Property Category</Label>
                  <Select onValueChange={(v) => setFormData({...formData, establishmentType: v})} defaultValue="hotel">
                    <SelectTrigger className="rounded-xl border-slate-100 bg-slate-50 h-12 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hotel">Hotel / Resort</SelectItem>
                      <SelectItem value="apartment">Serviced Apartment</SelectItem>
                      <SelectItem value="lodge">Safari Lodge</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </Card>

          {/* Section: Location & Contact */}
          <Card className="bg-white rounded-[28px] p-8 shadow-sm border-none">
            <h2 className="text-xl font-black uppercase tracking-tight mb-6 flex items-center gap-2" style={{ color: COLORS.TEAL }}>
              <MapPin className="h-5 w-5" /> Location & Contact
            </h2>
            
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Country</Label>
                  <CountrySelector value={formData.country} onChange={(v) => setFormData({...formData, country: v})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">City / Place</Label>
                  <Input 
                    className="rounded-xl border-slate-100 bg-slate-50 h-12 font-bold"
                    required 
                    value={formData.place} 
                    onChange={(e) => setFormData({...formData, place: e.target.value})}
                  />
                </div>
              </div>

              <div className="p-6 rounded-[24px] border border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center text-center gap-4">
                <div className="p-4 rounded-full bg-white shadow-sm">
                  <Navigation className="h-6 w-6" style={{ color: COLORS.CORAL }} />
                </div>
                <div>
                  <h4 className="font-black uppercase tracking-tighter text-sm">Precision GPS Capture</h4>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mt-1">Stand at the property entrance for best accuracy</p>
                </div>
                <Button 
                  type="button" 
                  onClick={getCurrentLocation}
                  className="rounded-full px-8 font-black uppercase tracking-widest text-[10px] h-11 transition-all active:scale-95"
                  style={{ background: formData.latitude ? COLORS.TEAL : COLORS.CORAL }}
                >
                  {formData.latitude ? "Location Verified" : "Capture My Location"}
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Business Email</Label>
                <Input 
                  type="email"
                  className="rounded-xl border-slate-100 bg-slate-50 focus:bg-white transition-all h-12 font-bold"
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="contact@business.com"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone Number</Label>
                <PhoneInput value={formData.phoneNumber} onChange={(v) => setFormData({...formData, phoneNumber: v})} country={formData.country} />
              </div>
            </div>
          </Card>

          {/* Section: Photos */}
          <Card className="bg-white rounded-[28px] p-8 shadow-sm border-none">
            <h2 className="text-xl font-black uppercase tracking-tight mb-6 flex items-center gap-2" style={{ color: COLORS.TEAL }}>
              <Camera className="h-5 w-5" /> Gallery (Max 5)
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {galleryImages.map((file, i) => (
                <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-slate-100">
                  <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setGalleryImages(galleryImages.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 bg-red-500 p-1 rounded-full text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {galleryImages.length < 5 && (
                <Label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors">
                  <Plus className="h-6 w-6 text-slate-400" />
                  <span className="text-[9px] font-black uppercase mt-1 text-slate-400">Add Photo</span>
                  <Input type="file" multiple className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e.target.files)} />
                </Label>
              )}
            </div>
          </Card>

          {/* Section: Description */}
          <Card className="bg-white rounded-[28px] p-8 shadow-sm border-none">
            <h2 className="text-xl font-black uppercase tracking-tight mb-4" style={{ color: COLORS.TEAL }}>The Experience</h2>
            <Textarea 
              className="rounded-[20px] border-slate-100 bg-slate-50 min-h-[150px] p-4 font-medium"
              placeholder="Tell guests what makes your property unique..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </Card>

          {/* Action Button */}
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full py-8 rounded-[24px] text-md font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all active:scale-95 border-none"
            style={{ 
              background: `linear-gradient(135deg, ${COLORS.CORAL_LIGHT} 0%, ${COLORS.CORAL} 100%)`,
              boxShadow: `0 12px 24px -8px ${COLORS.CORAL}88`
            }}
          >
            {loading ? "Verifying Details..." : "Submit Property for Approval"}
          </Button>
        </form>
      </main>
      
      <MobileBottomBar />
    </div>
  );
};

export default CreateHotel;