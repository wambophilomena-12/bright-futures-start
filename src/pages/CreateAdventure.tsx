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
import { MapPin, Upload, Mail, Phone, DollarSign } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CreateAdventure = () => {
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
    entry_fee_type: "free",
    entry_fee: "",
    activities: "",
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

      const activitiesArray = formData.activities
        ? formData.activities.split(',').map(a => ({ name: a.trim() }))
        : [];

      const facilitiesArray = formData.facilities
        ? formData.facilities.split(',').map(f => ({ name: f.trim() }))
        : [];

      const { error } = await supabase
        .from("adventure_places")
        .insert([{
          name: formData.name,
          description: formData.description,
          location: formData.location,
          place: formData.place,
          country: formData.country,
          image_url: formData.image_url,
          email: formData.email || null,
          phone_numbers: phoneArray.length > 0 ? phoneArray : null,
          entry_fee_type: formData.entry_fee_type,
          entry_fee: formData.entry_fee ? parseFloat(formData.entry_fee) : 0,
          activities: activitiesArray.length > 0 ? activitiesArray : null,
          facilities: facilitiesArray.length > 0 ? facilitiesArray : null,
          created_by: user.id
        }]);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your adventure place has been submitted for verification.",
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
        <h1 className="text-3xl font-bold mb-8">Create Place to Adventure</h1>
        <p className="text-muted-foreground mb-6">
          Submit your adventure place for admin verification. It will be visible after approval.
        </p>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Place Name *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter place name"
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
                <Label htmlFor="entry_fee_type">Entry Fee Type *</Label>
                <Select
                  value={formData.entry_fee_type}
                  onValueChange={(value) => setFormData({...formData, entry_fee_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.entry_fee_type === "paid" && (
                <div className="space-y-2">
                  <Label htmlFor="entry_fee">Entry Fee *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="entry_fee"
                      type="number"
                      step="0.01"
                      required
                      className="pl-10"
                      value={formData.entry_fee}
                      onChange={(e) => setFormData({...formData, entry_fee: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}

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
                    placeholder="contact@example.com"
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
                placeholder="Describe your adventure place..."
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="activities">Activities</Label>
              <Input
                id="activities"
                value={formData.activities}
                onChange={(e) => setFormData({...formData, activities: e.target.value})}
                placeholder="Hiking, Climbing, Swimming, Photography"
              />
              <p className="text-sm text-muted-foreground">Separate activities with commas</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="facilities">Facilities</Label>
              <Input
                id="facilities"
                value={formData.facilities}
                onChange={(e) => setFormData({...formData, facilities: e.target.value})}
                placeholder="Parking, Restrooms, Guide Services, Equipment Rental"
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
                {loading ? "Submitting..." : "Submit for Verification"}
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

export default CreateAdventure;
