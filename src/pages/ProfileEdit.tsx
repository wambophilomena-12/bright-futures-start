import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { User, Calendar, Globe, Phone, ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CountrySelector } from "@/components/creation/CountrySelector";

const COLORS = {
  TEAL: "#008080",
  CORAL: "#FF7F50",
  CORAL_LIGHT: "#FF9E7A",
  KHAKI: "#F0E68C",
  KHAKI_DARK: "#857F3E",
  SOFT_GRAY: "#F8F9FA"
};

const ProfileEdit = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [profileData, setProfileData] = useState<{
    name: string;
    gender: "male" | "female" | "other" | "prefer_not_to_say" | "";
    date_of_birth: string;
    country: string;
    phone_number: string;
  }>({
    name: "",
    gender: "",
    date_of_birth: "",
    country: "",
    phone_number: ""
  });
  
  const [verificationCode, setVerificationCode] = useState("");
  const [showVerification, setShowVerification] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [originalPhone, setOriginalPhone] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchProfile = async () => {
      setFetchingProfile(true);
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfileData({
          name: data.name || "",
          gender: data.gender || "",
          date_of_birth: data.date_of_birth || "",
          country: data.country || "",
          phone_number: data.phone_number || ""
        });
        setOriginalPhone(data.phone_number || "");
      }
      setFetchingProfile(false);
    };

    fetchProfile();
  }, [user, navigate]);

  const handleSendVerificationCode = async () => {
    if (!profileData.phone_number || profileData.phone_number === originalPhone) {
      toast({ title: "Error", description: "Please enter a new phone number.", variant: "destructive" });
      return;
    }
    setSendingCode(true);
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      toast({ title: "Verification Code Sent", description: `Your code is: ${code}` });
      sessionStorage.setItem("phone_verification_code", code);
      sessionStorage.setItem("phone_to_verify", profileData.phone_number);
      setShowVerification(true);
    } catch (error) {
      toast({ title: "Error", description: "Failed to send code.", variant: "destructive" });
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    setVerifyingCode(true);
    try {
      const storedCode = sessionStorage.getItem("phone_verification_code");
      if (verificationCode !== storedCode) throw new Error("Invalid code.");
      
      const { error } = await supabase.from("profiles").update({ 
        phone_number: profileData.phone_number,
        phone_verified: true 
      }).eq("id", user!.id);

      if (error) throw error;
      toast({ title: "Verified!" });
      setShowVerification(false);
      setOriginalPhone(profileData.phone_number);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profileData.phone_number !== originalPhone && !showVerification) {
      toast({ title: "Verify Phone", description: "Please verify your new phone number first.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("profiles").update({
        name: profileData.name,
        date_of_birth: profileData.date_of_birth || null,
        country: profileData.country || null,
        gender: profileData.gender || null
      }).eq("id", user!.id);

      if (error) throw error;
      toast({ title: "Profile Updated" });
      navigate("/profile");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (fetchingProfile) return <div className="min-h-screen bg-[#F8F9FA] animate-pulse" />;

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      <Header />
      
      <main className="container px-4 py-8 max-w-2xl mx-auto relative z-10">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 hover:bg-white/50 rounded-full"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
        </Button>

        <div className="mb-8">
          <Button className="bg-[#FF7F50] hover:bg-[#FF7F50] border-none px-4 py-1.5 h-auto uppercase font-black tracking-[0.15em] text-[10px] rounded-full shadow-lg mb-4">
            Account Settings
          </Button>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none text-slate-900">
            Edit Profile
          </h1>
        </div>

        <div className="bg-white rounded-[28px] p-8 shadow-sm border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Field: Name */}
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <div className="bg-[#008080]/10 p-2.5 rounded-xl">
                    <User className="h-5 w-5 text-[#008080]" />
                  </div>
                  <Label className="text-[10px] font-black text-[#008080] uppercase tracking-[0.2em]">Full Name</Label>
               </div>
               <Input
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  placeholder="Enter your name"
                  className="bg-slate-50 border-none rounded-2xl h-14 px-6 font-bold focus-visible:ring-1 focus-visible:ring-[#008080]"
               />
            </div>

            {/* Row: Gender & DOB */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="bg-[#008080]/10 p-2.5 rounded-xl">
                      <Calendar className="h-5 w-5 text-[#008080]" />
                    </div>
                    <Label className="text-[10px] font-black text-[#008080] uppercase tracking-[0.2em]">Date of Birth</Label>
                </div>
                <Input
                  type="date"
                  value={profileData.date_of_birth}
                  onChange={(e) => setProfileData({ ...profileData, date_of_birth: e.target.value })}
                  className="bg-slate-50 border-none rounded-2xl h-14 px-6 font-bold focus-visible:ring-1 focus-visible:ring-[#008080]"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="bg-[#008080]/10 p-2.5 rounded-xl">
                      <ShieldCheck className="h-5 w-5 text-[#008080]" />
                    </div>
                    <Label className="text-[10px] font-black text-[#008080] uppercase tracking-[0.2em]">Gender</Label>
                </div>
                <Select
                  value={profileData.gender}
                  onValueChange={(value: any) => setProfileData({ ...profileData, gender: value })}
                >
                  <SelectTrigger className="bg-slate-50 border-none rounded-2xl h-14 px-6 font-bold focus:ring-1 focus:ring-[#008080]">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-xl">
                    <SelectItem value="male">MALE</SelectItem>
                    <SelectItem value="female">FEMALE</SelectItem>
                    <SelectItem value="other">OTHER</SelectItem>
                    <SelectItem value="prefer_not_to_say">PRIVATE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Field: Country */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                  <div className="bg-[#008080]/10 p-2.5 rounded-xl">
                    <Globe className="h-5 w-5 text-[#008080]" />
                  </div>
                  <Label className="text-[10px] font-black text-[#008080] uppercase tracking-[0.2em]">Country</Label>
              </div>
              <div className="bg-slate-50 rounded-2xl p-2 px-4">
                <CountrySelector
                  value={profileData.country}
                  onChange={(value) => setProfileData({ ...profileData, country: value })}
                />
              </div>
            </div>

            {/* Field: Phone */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                  <div className="bg-[#008080]/10 p-2.5 rounded-xl">
                    <Phone className="h-5 w-5 text-[#008080]" />
                  </div>
                  <Label className="text-[10px] font-black text-[#008080] uppercase tracking-[0.2em]">Phone Identity</Label>
              </div>
              <div className="flex gap-3">
                <Input
                  type="tel"
                  value={profileData.phone_number}
                  onChange={(e) => setProfileData({ ...profileData, phone_number: e.target.value })}
                  className="bg-slate-50 border-none rounded-2xl h-14 px-6 font-bold focus-visible:ring-1 focus-visible:ring-[#008080]"
                />
                {profileData.phone_number !== originalPhone && (
                  <Button
                    type="button"
                    onClick={handleSendVerificationCode}
                    disabled={sendingCode}
                    className="h-14 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest text-white shadow-lg"
                    style={{ background: COLORS.TEAL }}
                  >
                    {sendingCode ? "..." : "Verify"}
                  </Button>
                )}
              </div>
              
              {showVerification && (
                <div className="p-6 bg-[#F0E68C]/10 rounded-[24px] border border-[#F0E68C]/30 space-y-4 animate-in fade-in slide-in-from-top-2">
                  <p className="text-[10px] font-black text-[#857F3E] uppercase tracking-widest">Enter Verification Code</p>
                  <div className="flex gap-3">
                    <Input
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="6-Digit Code"
                      className="bg-white border-none rounded-xl h-12 px-4 font-black tracking-widest text-center"
                    />
                    <Button
                      type="button"
                      onClick={handleVerifyCode}
                      disabled={verifyingCode}
                      className="h-12 px-6 rounded-xl font-black bg-[#857F3E] hover:bg-[#857F3E]/90 text-white"
                    >
                      {verifyingCode ? "..." : "Confirm"}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 flex flex-col md:flex-row gap-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 py-8 rounded-2xl text-md font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all active:scale-95 border-none"
                style={{ 
                  background: `linear-gradient(135deg, ${COLORS.CORAL_LIGHT} 0%, ${COLORS.CORAL} 100%)`,
                  boxShadow: `0 12px 24px -8px ${COLORS.CORAL}88`
                }}
              >
                {loading ? "Updating..." : "Save Profile"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate("/profile")}
                className="py-8 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </main>

      <MobileBottomBar />
    </div>
  );
};

export default ProfileEdit;