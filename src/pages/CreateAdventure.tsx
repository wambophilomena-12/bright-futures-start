import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MapPin, Mail, Navigation, Clock, X, Plus, Camera, CheckCircle2, Info } from "lucide-react";
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

const CreateAdventure = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
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
    latitude: null as number | null,
    longitude: null as number | null
  });
  
  const [workingDays, setWorkingDays] = useState({
    Mon: false, Tue: false, Wed: false, Thu: false, Fri: false, Sat: false, Sun: false
  });
  
  const [facilities, setFacilities] = useState([{name: "", priceType: "free", price: "0", capacity: "0"}]);
  const [activities, setActivities] = useState([{name: "", priceType: "free", price: "0"}]);
  const [amenities, setAmenities] = useState<string[]>([""]);
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

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
          setFormData(prev => ({ ...prev, locationLink: `https://www.google.com/maps?q=${latitude},${longitude}`, latitude, longitude }));
          toast({ title: "Coordinates captured", description: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` });
        },
        () => toast({ title: "Location Error", variant: "destructive" })
      );
    }
  };

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).slice(0, 5 - galleryImages.length);
    setGalleryImages(prev => [...prev, ...newFiles].slice(0, 5));
  };

  const removeImage = (index: number) => setGalleryImages(prev => prev.filter((_, i) => i !== index));
  const addFacility = () => setFacilities([...facilities, {name: "", priceType: "free", price: "0", capacity: "0"}]);
  const removeFacility = (index: number) => facilities.length > 1 && setFacilities(facilities.filter((_, i) => i !== index));
  const addActivity = () => setActivities([...activities, {name: "", priceType: "free", price: "0"}]);
  const removeActivity = (index: number) => activities.length > 1 && setActivities(activities.filter((_, i) => i !== index));
  const addAmenity = () => setAmenities([...amenities, ""]);
  const removeAmenity = (index: number) => amenities.length > 1 && setAmenities(amenities.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate("/auth"); return; }
    if (!formData.latitude) { toast({ title: "Location Required", variant: "destructive" }); return; }
    if (galleryImages.length === 0) { toast({ title: "Images Required", variant: "destructive" }); return; }

    setLoading(true);
    setUploading(true);

    try {
      const uploadedUrls: string[] = [];
      for (const file of galleryImages) {
        const fileName = `${user.id}/${Math.random()}.${file.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage.from('listing-images').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('listing-images').getPublicUrl(fileName);
        uploadedUrls.push(publicUrl);
      }

      const selectedDays = Object.entries(workingDays).filter(([_, s]) => s).map(([d]) => d);

      const { error } = await supabase.from("adventure_places").insert([{
        name: formData.registrationName,
        local_name: formData.localName,
        registration_number: formData.registrationNumber,
        location: formData.locationName,
        place: formData.place,
        country: formData.country,
        description: formData.description,
        email: formData.email,
        phone_numbers: [formData.phoneNumber],
        map_link: formData.locationLink,
        latitude: formData.latitude,
        longitude: formData.longitude,
        opening_hours: formData.openingHours,
        closing_hours: formData.closingHours,
        days_opened: selectedDays,
        image_url: uploadedUrls[0],
        gallery_images: uploadedUrls,
        entry_fee_type: formData.entranceFeeType,
        entry_fee: formData.entranceFeeType === "paid" ? parseFloat(formData.adultPrice) : 0,
        activities: activities.filter(a => a.name),
        facilities: facilities.filter(f => f.name),
        amenities: amenities.filter(a => a),
        created_by: user.id,
        approval_status: "pending"
      }]);

      if (error) throw error;
      toast({ title: "Experience Submitted", description: "Pending admin review." });
      navigate("/become-host");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      <Header />
      
      {/* Dynamic Hero Header */}
      <div className="relative h-[40vh] w-full overflow-hidden bg-slate-900">
        <img 
          src="https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200" 
          className="absolute inset-0 w-full h-full object-cover opacity-60"
          alt="Host Header"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#F8F9FA] via-transparent to-transparent" />
        
        <div className="absolute bottom-12 left-0 w-full p-8 container max-w-4xl mx-auto">
            <Button className="bg-[#FF7F50] hover:bg-[#FF7F50] border-none px-4 py-1.5 h-auto uppercase font-black tracking-[0.15em] text-[10px] rounded-full shadow-lg mb-4">
               New Listing
            </Button>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none text-white drop-shadow-2xl">
              Create <span style={{ color: COLORS.KHAKI }}>Adventure</span>
            </h1>
            <p className="text-white/80 text-xs font-bold uppercase tracking-widest mt-2 max-w-md">
                Build your experience and join our community of elite hosts.
            </p>
        </div>
      </div>

      <main className="container px-4 max-w-4xl mx-auto -mt-10 relative z-50">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section: Registration */}
          <Card className="bg-white rounded-[28px] p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-[#008080]/10 text-[#008080]">
                    <Info className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black uppercase tracking-tight" style={{ color: COLORS.TEAL }}>Registration</h2>
            </div>
            
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Registration Name</Label>
                <Input
                  required
                  value={formData.registrationName}
                  onChange={(e) => setFormData({...formData, registrationName: e.target.value})}
                  placeholder="Official Government Name"
                  className="rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all h-12 font-bold"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Registration Number</Label>
                  <Input
                    required
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})}
                    placeholder="e.g. BN-X12345"
                    className="rounded-xl border-slate-100 bg-slate-50/50 h-12 font-bold"
                  />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Country</Label>
                    <CountrySelector
                    value={formData.country}
                    onChange={(value) => setFormData({...formData, country: value})}
                    />
                </div>
              </div>
            </div>
          </Card>

          {/* Section: Location */}
          <Card className="bg-white rounded-[28px] p-8 shadow-sm border border-slate-100">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-[#FF7F50]/10 text-[#FF7F50]">
                    <MapPin className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black uppercase tracking-tight" style={{ color: COLORS.TEAL }}>Location Details</h2>
            </div>

            <div className="grid gap-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Location Name</Label>
                    <Input
                        required
                        value={formData.locationName}
                        onChange={(e) => setFormData({...formData, locationName: e.target.value})}
                        placeholder="Area / Forest / Beach"
                        className="rounded-xl border-slate-100 bg-slate-50/50 h-12 font-bold"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Place (City/Town)</Label>
                    <Input
                        required
                        value={formData.place}
                        onChange={(e) => setFormData({...formData, place: e.target.value})}
                        placeholder="e.g. Nairobi"
                        className="rounded-xl border-slate-100 bg-slate-50/50 h-12 font-bold"
                    />
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-[#F0E68C]/10 border border-[#F0E68C]/30 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-[#857F3E]">GPS Coordinates</h4>
                        <p className="text-[10px] text-[#857F3E]/80 font-bold uppercase mt-1">Capture precise location for maps</p>
                    </div>
                    <Button 
                        type="button" 
                        onClick={getCurrentLocation}
                        className="bg-[#857F3E] hover:bg-[#857F3E]/90 text-white rounded-xl px-6 h-12 font-black uppercase text-[10px] tracking-widest"
                    >
                        <Navigation className="h-4 w-4 mr-2" />
                        {formData.latitude ? 'Update Location' : 'Auto-Capture GPS'}
                    </Button>
                </div>
                {formData.latitude && (
                    <div className="flex items-center gap-2 text-[#857F3E] text-xs font-black bg-white/50 p-3 rounded-lg border border-[#F0E68C]">
                        <CheckCircle2 className="h-4 w-4" /> 
                        COORD: {formData.latitude.toFixed(6)}, {formData.longitude?.toFixed(6)}
                    </div>
                )}
              </div>
            </div>
          </Card>

          {/* Section: Contact & About */}
          <Card className="bg-white rounded-[28px] p-8 shadow-sm border border-slate-100">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-[#008080]/10 text-[#008080]">
                    <Mail className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black uppercase tracking-tight" style={{ color: COLORS.TEAL }}>Contact & About</h2>
            </div>
            
            <div className="space-y-6">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Business Email</Label>
                    <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="contact@business.com"
                        className="rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all h-12 font-bold"
                    />
                </div>
                
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">WhatsApp / Phone</Label>
                    <PhoneInput
                        value={formData.phoneNumber}
                        onChange={(value) => setFormData({...formData, phoneNumber: value})}
                        country={formData.country}
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description</Label>
                    <Textarea
                        required
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="Tell the community what makes this adventure special..."
                        rows={4}
                        className="rounded-2xl border-slate-100 bg-slate-50/50 font-bold resize-none"
                    />
                </div>
            </div>
          </Card>

          {/* Section: Pricing & Schedule */}
          <Card className="bg-white rounded-[28px] p-8 shadow-sm border border-slate-100">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-[#FF7F50]/10 text-[#FF7F50]">
                    <Clock className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black uppercase tracking-tight" style={{ color: COLORS.TEAL }}>Access & Pricing</h2>
            </div>

            <div className="grid gap-8">
                <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Operating Days</Label>
                    <div className="flex flex-wrap gap-2">
                    {Object.keys(workingDays).map((day) => (
                        <button
                        key={day}
                        type="button"
                        onClick={() => setWorkingDays({...workingDays, [day]: !workingDays[day as keyof typeof workingDays]})}
                        className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase transition-all ${
                            workingDays[day as keyof typeof workingDays]
                            ? 'bg-[#008080] text-white border-[#008080] shadow-md'
                            : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'
                        }`}
                        >
                        {day}
                        </button>
                    ))}
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Entrance Fee</Label>
                        <Select value={formData.entranceFeeType} onValueChange={(v) => setFormData({...formData, entranceFeeType: v})}>
                            <SelectTrigger className="rounded-xl h-12 font-bold border-slate-100">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl font-bold">
                                <SelectItem value="free">FREE ACCESS</SelectItem>
                                <SelectItem value="paid">PAID ADMISSION</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {formData.entranceFeeType === "paid" && (
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Adult Price (KSh)</Label>
                            <Input
                                type="number"
                                value={formData.adultPrice}
                                onChange={(e) => setFormData({...formData, adultPrice: e.target.value})}
                                className="rounded-xl h-12 font-black text-[#FF7F50] border-slate-100"
                            />
                        </div>
                    )}
                </div>
            </div>
          </Card>

          {/* Section: Dynamic Lists (Facilities/Activities) */}
          <div className="grid md:grid-cols-2 gap-6">
             {/* Facilities */}
            <Card className="bg-white rounded-[28px] p-8 shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-sm font-black uppercase tracking-tight" style={{ color: COLORS.TEAL }}>Facilities</h2>
                    <Button type="button" size="sm" onClick={addFacility} className="rounded-full h-8 w-8 p-0 bg-[#008080]">
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                <div className="space-y-3">
                    {facilities.map((f, i) => (
                        <div key={i} className="flex gap-2">
                            <Input 
                                placeholder="e.g. Pool" 
                                value={f.name} 
                                onChange={(e) => {
                                    const next = [...facilities];
                                    next[i].name = e.target.value;
                                    setFacilities(next);
                                }}
                                className="rounded-xl text-xs font-bold"
                            />
                            {facilities.length > 1 && (
                                <Button type="button" variant="ghost" onClick={() => removeFacility(i)} className="text-red-400 p-2">
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </Card>

             {/* Amenities */}
            <Card className="bg-white rounded-[28px] p-8 shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-sm font-black uppercase tracking-tight" style={{ color: COLORS.TEAL }}>Amenities</h2>
                    <Button type="button" size="sm" onClick={addAmenity} className="rounded-full h-8 w-8 p-0 bg-[#008080]">
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                <div className="space-y-3">
                    {amenities.map((a, i) => (
                        <div key={i} className="flex gap-2">
                            <Input 
                                placeholder="e.g. Free WiFi" 
                                value={a} 
                                onChange={(e) => {
                                    const next = [...amenities];
                                    next[i] = e.target.value;
                                    setAmenities(next);
                                }}
                                className="rounded-xl text-xs font-bold"
                            />
                            {amenities.length > 1 && (
                                <Button type="button" variant="ghost" onClick={() => removeAmenity(i)} className="text-red-400 p-2">
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </Card>
          </div>

          {/* Section: Gallery */}
          <Card className="bg-white rounded-[28px] p-8 shadow-sm border border-slate-100">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-[#F0E68C]/20 text-[#857F3E]">
                    <Camera className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black uppercase tracking-tight" style={{ color: COLORS.TEAL }}>Visuals</h2>
            </div>
            
            <div className="space-y-4">
              <Label htmlFor="gallery-images-adventure" className="cursor-pointer group">
                <div className="border-2 border-dashed rounded-[20px] p-10 text-center border-slate-200 hover:border-[#008080] hover:bg-[#008080]/5 transition-all">
                  <div className="mx-auto h-12 w-12 text-slate-300 mb-2 group-hover:text-[#008080]">📁</div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">Drop adventure photos here</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Maximum 5 high-res images</p>
                </div>
              </Label>
              <Input
                id="gallery-images-adventure"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleImageUpload(e.target.files)}
                disabled={galleryImages.length >= 5}
                className="hidden"
              />
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {galleryImages.map((file, index) => (
                  <div key={index} className="relative group aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-md">
                    <img
                      src={URL.createObjectURL(file)}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Final Submit Action */}
          <div className="pt-8">
            <Button 
                type="submit" 
                disabled={loading || uploading}
                className="w-full py-10 rounded-[30px] text-lg font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all active:scale-95 border-none"
                style={{ 
                    background: `linear-gradient(135deg, ${COLORS.CORAL_LIGHT} 0%, ${COLORS.CORAL} 100%)`,
                    boxShadow: `0 12px 24px -8px ${COLORS.CORAL}88`
                }}
            >
                {loading ? "Verifying Data..." : "Submit Experience for Approval"}
            </Button>
            <p className="text-center mt-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                By submitting, you agree to our host verification guidelines.
            </p>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CreateAdventure;