import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Upload } from "lucide-react";

const ProfileEdit = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profileData, setProfileData] = useState<{
    name: string;
    phone_number: string;
    gender: "male" | "female" | "other" | "prefer_not_to_say" | "";
  }>({
    name: "",
    phone_number: "",
    gender: ""
  });
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [currentPictureUrl, setCurrentPictureUrl] = useState<string>("");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfileData({
          name: data.name || "",
          phone_number: data.phone_number || "",
          gender: data.gender || ""
        });
        setCurrentPictureUrl(data.profile_picture_url || "");
      }
    };

    fetchProfile();
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUploading(true);

    try {
      let pictureUrl = currentPictureUrl;

      if (profilePicture) {
        const fileExt = profilePicture.name.split('.').pop();
        const fileName = `${user!.id}/profile.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(fileName, profilePicture, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(fileName);
          
        pictureUrl = publicUrl;
      }

    const updateData: any = {
      name: profileData.name,
      phone_number: profileData.phone_number,
      profile_picture_url: pictureUrl
    };
    
    if (profileData.gender) {
      updateData.gender = profileData.gender;
    }

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user!.id);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your profile has been updated.",
      });

      navigate("/profile");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      <main className="container px-4 py-8 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Edit Profile</h1>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                placeholder="Your name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                value={profileData.phone_number}
                onChange={(e) => setProfileData({...profileData, phone_number: e.target.value})}
                placeholder="+1234567890"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
                className="w-full px-3 py-2 border rounded-md"
                value={profileData.gender}
                onChange={(e) => setProfileData({...profileData, gender: e.target.value as "male" | "female" | "other" | "prefer_not_to_say" | ""})}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Profile Picture</Label>
              {currentPictureUrl && !profilePicture && (
                <img src={currentPictureUrl} alt="Current profile" className="w-24 h-24 rounded-full object-cover mb-2" />
              )}
              {profilePicture && (
                <img src={URL.createObjectURL(profilePicture)} alt="New profile" className="w-24 h-24 rounded-full object-cover mb-2" />
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setProfilePicture(e.target.files?.[0] || null)}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading || uploading} className="flex-1">
                {uploading ? "Uploading..." : loading ? "Saving..." : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </main>

      <Footer />
      <MobileBottomBar />
    </div>
  );
};

export default ProfileEdit;
