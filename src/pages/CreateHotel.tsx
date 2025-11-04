import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MapPin, Upload, Mail, Phone } from "lucide-react";

const CreateHotel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    place: "",
    country: "",
    image_url: "",
    email: "",
    phone_numbers: "",
    facilities: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create content.",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }

    setLoading(true);

    try {
      const phoneArray = formData.phone_numbers
        .split(',')
        .map(p => p.trim())
        .filter(p => p);

      const facilitiesArray = formData.facilities
        ? formData.facilities.split(',').map(f => ({ name: f.trim() }))
        : [];

      const { error } = await supabase
        .from("hotels")
        .insert([{
          name: formData.name,
          description: formData.description,
          location: formData.location,
          place: formData.place,
          country: formData.country,
          image_url: formData.image_url,
          email: formData.email || null,
          phone_numbers: phoneArray.length > 0 ? phoneArray : null,
          facilities: facilitiesArray.length > 0 ? facilitiesArray : null,
          created_by: user.id
        }]);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your hotel has been submitted for approval.",
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
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      <main className="container px-4 py-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create Hotel & Accommodation</h1>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Hotel Name *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter hotel name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  required
                  value={formData.country}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                  placeholder="Enter country"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="place">Place *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="place"
                    required
                    className="pl-10"
                    value={formData.place}
                    onChange={(e) => setFormData({...formData, place: e.target.value})}
                    placeholder="Enter place"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location Details *</Label>
                <Input
                  id="location"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Enter location details"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Contact Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="contact@hotel.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_numbers">Contact Phones</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone_numbers"
                    className="pl-10"
                    value={formData.phone_numbers}
                    onChange={(e) => setFormData({...formData, phone_numbers: e.target.value})}
                    placeholder="+123456789, +987654321"
                  />
                </div>
                <p className="text-sm text-muted-foreground">Separate multiple numbers with commas</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe your hotel and accommodation..."
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="facilities">Facilities</Label>
              <Input
                id="facilities"
                value={formData.facilities}
                onChange={(e) => setFormData({...formData, facilities: e.target.value})}
                placeholder="WiFi, Pool, Gym, Restaurant"
              />
              <p className="text-sm text-muted-foreground">Separate facilities with commas</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url">Main Image URL *</Label>
              <div className="relative">
                <Upload className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="image_url"
                  required
                  className="pl-10"
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Submitting..." : "Submit for Approval"}
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

export default CreateHotel;
