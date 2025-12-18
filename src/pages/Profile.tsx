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
import { User, Calendar, Globe, Phone, ArrowLeft, CheckCircle2 } from "lucide-react";
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
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    toast({ title: "Verification Code Sent", description: `Your code is: ${code}` });
    sessionStorage.setItem("phone_verification_code", code);
    sessionStorage.setItem("phone_to_verify", profileData.phone_number);
    setShowVerification(true);
    setSendingCode(false);
  };

  const handleVerifyCode = async () => {
    setVerifyingCode(true);
    try {
      const storedCode = sessionStorage.getItem("phone_verification_code");
      const storedPhone = sessionStorage.getItem("phone_to_verify");
      if (verificationCode !== storedCode || profileData.phone_number !== storedPhone) throw new Error("Invalid code.");

      const { error } = await supabase
        .from("profiles")
        .update({ phone_number: profileData.phone_number, phone_verified: true })
        .eq("id", user!.id);

      if (error) throw error;
      toast({ title: "Success!", description: "Phone number verified." });
      setShowVerification(false);
      setOriginalPhone(profileData.phone_number);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally { setVerifyingCode(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profileData.phone_number !== originalPhone && !showVerification) {
      toast({ title: "Action Required", description: "Verify your new phone number first.", variant: "destructive" });
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
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      <Header />
      
      <main className="container px-4 py-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button 
            onClick={() => navigate(-1)} 
            variant="ghost" 
            className="rounded-full bg-white shadow-sm border border-slate-100 w-10 h-10 p-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-black uppercase tracking-tighter" style={{ color: COLORS.TEAL }}>
            Edit Profile
          </h1>
        </div>

        <div className="bg-white rounded-[28px] p-2 shadow-sm border border-slate-100">
          {fetchingProfile ? (
            <div className="p-8 space-y-6 animate-pulse">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 bg-slate-50 rounded-2xl" />)}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-1">
              {/* Field Wrapper Component would go here, but written inline for clarity */}
              
              <ProfileField icon={<User />} label="Full Name">
                <Input
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  placeholder="Your Name"
                  className="border-none shadow-none p-0 h-auto font-bold text-slate-700 focus-visible:ring-0 placeholder:text-slate-300"
                />
              </ProfileField>

              <ProfileField icon={<Calendar />} label="Date of Birth">
                <Input
                  type="date"
                  value={profileData.date_of_birth}
                  onChange={(e) => setProfileData({ ...profileData, date_of_birth: e.target.value })}
                  className="border-none shadow-none p-0 h-auto font-bold text-slate-700 focus-visible:ring-0"
                />
              </ProfileField>

              <ProfileField icon={<User />} label="Gender Identity">
                <Select 
                  value={profileData.gender} 
                  onValueChange={(v: any) => setProfileData({ ...profileData, gender: v })}
                >
                  <SelectTrigger className="border-none shadow-none p-0 h-auto font-bold text-slate-700 focus:ring-0">
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100">
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Private</SelectItem>
                  </SelectContent>
                </Select>
              </ProfileField>

              <ProfileField icon={<Globe />} label="Home Country">
                <div className="pt-1">
                  <CountrySelector
                    value={profileData.country}
                    onChange={(v) => setProfileData({ ...profileData, country: v })}
                  />
                </div>
              </ProfileField>

              <ProfileField icon={<Phone />} label="Phone Number" noBorder>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 items-center">
                    <Input
                      type="tel"
                      value={profileData.phone_number}
                      onChange={(e) => setProfileData({ ...profileData, phone_number: e.target.value })}
                      className="border-none shadow-none p-0 h-auto font-bold text-slate-700 focus-visible:ring-0"
                      placeholder="Enter number"
                    />
                    {profileData.phone_number !== originalPhone && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSendVerificationCode}
                        disabled={sendingCode}
                        className="rounded-xl px-4 text-[10px] font-black uppercase tracking-widest text-white border-none h-8"
                        style={{ background: COLORS.TEAL }}
                      >
                        {sendingCode ? "..." : "Verify"}
                      </Button>
                    )}
                  </div>
                  
                  {showVerification && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Security Code</Label>
                      <div className="flex gap-2">
                        <Input
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          placeholder="000000"
                          className="bg-white rounded-xl border-slate-200 text-center font-black tracking-widest"
                          maxLength={6}
                        />
                        <Button
                          type="button"
                          onClick={handleVerifyCode}
                          disabled={verifyingCode}
                          className="rounded-xl px-6 font-black uppercase text-[10px] border-none"
                          style={{ background: COLORS.KHAKI_DARK }}
                        >
                          Confirm
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </ProfileField>

              <div className="p-6 pt-4 flex gap-3">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-7 rounded-2xl text-sm font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all active:scale-95 border-none"
                  style={{ 
                    background: `linear-gradient(135deg, ${COLORS.CORAL_LIGHT} 0%, ${COLORS.CORAL} 100%)`,
                    boxShadow: `0 12px 24px -8px ${COLORS.CORAL}88`
                  }}
                >
                  {loading ? "Saving..." : "Save Profile"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate("/profile")}
                  className="py-7 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </main>

      <MobileBottomBar />
    </div>
  );
};

/* Helper UI Component for consistent field styling */
const ProfileField = ({ icon, label, children, noBorder = false }: { icon: React.ReactNode, label: string, children: React.ReactNode, noBorder?: boolean }) => (
  <div className={`p-5 flex items-start gap-5 hover:bg-slate-50/50 transition-colors ${!noBorder ? 'border-b border-slate-50' : ''}`}>
    <div 
      className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
      style={{ backgroundColor: `${COLORS.TEAL}15` }}
    >
      <div style={{ color: COLORS.TEAL }}>
        {icon}
      </div>
    </div>
    <div className="flex-1 min-w-0">
      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1.5 block">
        {label}
      </Label>
      <div className="min-h-[24px]">
        {children}
      </div>
    </div>
  </div>
);

export default ProfileEdit;