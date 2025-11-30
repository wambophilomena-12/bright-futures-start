import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Loader2, MapPin, Upload, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Header } from "@/components/Header";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/creation/PageHeader";
import { PhoneInput } from "@/components/creation/PhoneInput";
import { approvalStatusSchema } from "@/lib/validation";
import { EmailVerification } from "@/components/creation/EmailVerification";
const EAST_AFRICAN_COUNTRIES = [
  { name: "Kenya", code: "KE", flag: "🇰🇪" },
  { name: "Uganda", code: "UG", flag: "🇺🇬" },
  { name: "Tanzania", code: "TZ", flag: "🇹🇿" },
  { name: "Rwanda", code: "RW", flag: "🇷🇼" },
  { name: "Burundi", code: "BI", flag: "🇧🇮" },
  { name: "South Sudan", code: "SS", flag: "🇸🇸" },
  { name: "Ethiopia", code: "ET", flag: "🇪🇹" },
  { name: "Somalia", code: "SO", flag: "🇸🇴" },
  { name: "Djibouti", code: "DJ", flag: "🇩🇯" },
];

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function CreateAttraction() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  
  const [formData, setFormData] = useState({
    // MODIFICATION 1: Remove default value
    registration_type: "", 
    registration_number: "",
    location_name: "",
    local_name: "",
    country: "",
    description: "",
    email: "",
    phone_number: "",
    location_link: "",
    latitude: null as number | null,
    longitude: null as number | null,
    opening_hours: "",
    closing_hours: "",
    days_opened: [] as string[],
    entrance_type: "free",
    price_child: 0,
    price_adult: 0,
  });
  
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [facilities, setFacilities] = useState<Array<{name: string, price: string, capacity: string, priceType: string}>>([
    { name: "", price: "", capacity: "", priceType: "free" }
  ]);
  const [activities, setActivities] = useState<Array<{name: string, price: string, priceType: string}>>([
    { name: "", price: "", priceType: "free" }
  ]);
  const [amenities, setAmenities] = useState<string[]>([""]);
  const [emailVerified, setEmailVerified] = useState(false);

  const addFacility = () => {
    setFacilities([...facilities, { name: "", price: "", capacity: "", priceType: "free" }]);
  };

  const removeFacility = (index: number) => {
    if (facilities.length > 1) {
      setFacilities(facilities.filter((_, i) => i !== index));
    }
  };

  const addActivity = () => {
    setActivities([...activities, { name: "", price: "", priceType: "free" }]);
  };

  const removeActivity = (index: number) => {
    if (activities.length > 1) {
      setActivities(activities.filter((_, i) => i !== index));
    }
  };

  const addAmenity = () => {
    setAmenities([...amenities, ""]);
  };

  const removeAmenity = (index: number) => {
    if (amenities.length > 1) {
      setAmenities(amenities.filter((_, i) => i !== index));
    }
  };

  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create an attraction",
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [user, navigate, toast]);

  const handleAutoLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));
          toast({
            title: "Location captured",
            description: "Your location has been automatically added",
          });
        },
        (error) => {
          toast({
            title: "Location error",
            description: "Could not access your location. Please add it manually.",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Not supported",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalPhotos = photoFiles.length + files.length;
    
    if (totalPhotos > 5) {
      toast({
        title: "Too many photos",
        description: "You can only upload up to 5 photos",
        variant: "destructive",
      });
      return;
    }

    setPhotoFiles(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (): Promise<string[]> => {
    if (photoFiles.length === 0) return [];
    
    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    for (const file of photoFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('listing-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('listing-images')
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);
    }

    setUploadingImages(false);
    return uploadedUrls;
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      days_opened: prev.days_opened.includes(day)
        ? prev.days_opened.filter(d => d !== day)
        : [...prev.days_opened, day]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create an attraction",
        variant: "destructive",
      });
      return;
    }

    // Verification logic...
    if (formData.email && !emailVerified) {
      toast({
        title: "Email Verification Required",
        description: "Please verify your email address before submitting",
        variant: "destructive"
      });
      return;
    }

    if (photoFiles.length === 0) {
      toast({
        title: "Photos required",
        description: "Please upload at least one photo",
        variant: "destructive",
      });
      return;
    }
    
    // Basic form validation to ensure required fields are not empty after removing default
    if (!formData.registration_type || !formData.registration_number || !formData.location_name || !formData.country || !formData.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (Registration, Location, Country, Description)",
        variant: "destructive",
      });
      return;
    }


    setLoading(true);

    try {
      const photoUrls = await uploadPhotos();
      
      // Prepare arrays for insert...
      const facilitiesArray = facilities
        .filter(f => f.name.trim())
        .map(f => ({ 
          name: f.name.trim(), 
          price: f.priceType === "free" ? 0 : parseFloat(f.price) || 0,
          capacity: parseInt(f.capacity) || 0
        }));
      
      const activitiesArray = activities
        .filter(a => a.name.trim())
        .map(a => ({ 
          name: a.name.trim(), 
          price: a.priceType === "free" ? 0 : parseFloat(a.price) || 0
        }));

      const amenitiesArray = amenities.filter(a => a.trim()).map(a => a.trim());
      
      const { error } = await supabase
        .from('attractions')
        .insert([{
          ...formData,
          photo_urls: photoUrls,
          gallery_images: photoUrls,
          facilities: facilitiesArray.length > 0 ? facilitiesArray : null,
          activities: activitiesArray.length > 0 ? activitiesArray : null,
          amenities: amenitiesArray.length > 0 ? amenitiesArray : null,
          created_by: user.id,
          approval_status: approvalStatusSchema.parse('pending'),
        }]);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your attraction has been submitted for approval",
      });
      
      navigate("/become-host");
    } catch (error: any) {
      console.error('Error creating attraction:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create attraction",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      <main className="container px-4 py-8 max-w-4xl mx-auto">
        <PageHeader 
          title="Create Attraction" 
          backgroundImage="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200"
        />
        <h1 className="md:hidden text-3xl font-bold mb-6">Create New Attraction</h1>
        
        <Card className="p-6">
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Registration Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Registration Details</h2>
            
            <div>
              {/* MODIFICATION 2: Change Label to 'Registered Name' */}
              <Label htmlFor="registration_type">Registered Name</Label>
              <Input
                id="registration_type"
                value={formData.registration_type}
                onChange={(e) => setFormData({...formData, registration_type: e.target.value})}
                required
                // MODIFICATION 3: Add placeholder and ensure it's not the old default value
                placeholder="Enter the registered name of the business/attraction"
              />
            </div>

            <div>
              <Label htmlFor="registration_number">Registration Number</Label>
              <Input
                id="registration_number"
                value={formData.registration_number}
                onChange={(e) => setFormData({...formData, registration_number: e.target.value})}
                required
                placeholder="Enter official registration number"
              />
            </div>
          </div>

          {/* Location Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Location Information</h2>
            
            <div>
              <Label htmlFor="location_name">Location Name</Label>
              <Input
                id="location_name"
                value={formData.location_name}
                onChange={(e) => setFormData({...formData, location_name: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="local_name">Local Name (Optional)</Label>
              <Input
                id="local_name"
                value={formData.local_name}
                onChange={(e) => setFormData({...formData, local_name: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="country">Country</Label>
              <Select value={formData.country} onValueChange={(value) => setFormData({...formData, country: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {EAST_AFRICAN_COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.name}>
                      {country.flag} {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={4}
                placeholder="Describe the attraction..."
              />
            </div>
          </div>

          {/* Contact Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Contact Information</h2>
            
            <EmailVerification
              email={formData.email}
              onEmailChange={(email) => setFormData({...formData, email})}
              isVerified={emailVerified}
              onVerificationChange={setEmailVerified}
            />

            <div>
              <Label htmlFor="phone_number">Phone Number</Label>
              <PhoneInput
                value={formData.phone_number}
                onChange={(value) => setFormData({...formData, phone_number: value})}
                country={formData.country}
                placeholder="0758800117"
              />
              <p className="text-sm text-muted-foreground">Enter number without leading zero</p>
            </div>

            <div>
              <Label htmlFor="location_link">Location Link (Google Maps)</Label>
              <Input
                id="location_link"
                type="url"
                value={formData.location_link}
                onChange={(e) => setFormData({...formData, location_link: e.target.value})}
                placeholder="https://maps.google.com/..."
              />
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={handleAutoLocation}>
                <MapPin className="mr-2 h-4 w-4" />
                Auto-Access My Location
              </Button>
              {formData.latitude && formData.longitude && (
                <span className="text-sm text-muted-foreground">
                  Location captured: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                </span>
              )}
            </div>
          </div>

          {/* Operating Hours Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Operating Hours</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="opening_hours">Opening Hours</Label>
                <Input
                  id="opening_hours"
                  type="time"
                  value={formData.opening_hours}
                  onChange={(e) => setFormData({...formData, opening_hours: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="closing_hours">Closing Hours</Label>
                <Input
                  id="closing_hours"
                  type="time"
                  value={formData.closing_hours}
                  onChange={(e) => setFormData({...formData, closing_hours: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label>Days Opened</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={day}
                      checked={formData.days_opened.includes(day)}
                      onCheckedChange={() => handleDayToggle(day)}
                    />
                    <label htmlFor={day} className="text-sm cursor-pointer">
                      {day}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Entrance Fee Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Entrance Fee</h2>
            
            <div>
              <Label>Entrance Type</Label>
              <Select value={formData.entrance_type} onValueChange={(value) => setFormData({...formData, entrance_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.entrance_type === 'paid' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price_adult">Adult Price</Label>
                  <Input
                    id="price_adult"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price_adult}
                    onChange={(e) => setFormData({...formData, price_adult: parseFloat(e.target.value) || 0})}
                  />
                </div>

                <div>
                  <Label htmlFor="price_child">Children Price</Label>
                  <Input
                    id="price_child"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price_child}
                    onChange={(e) => setFormData({...formData, price_child: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Facilities */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Facilities (Optional)</h2>
              <Button type="button" size="sm" onClick={addFacility}>Add Facility</Button>
            </div>
            <p className="text-sm text-muted-foreground">Add facilities with Name, Price, and Capacity</p>
            {facilities.map((facility, index) => (
              <div key={index} className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Name</Label>
                    <Input
                      placeholder="Facility name"
                      value={facility.name}
                      onChange={(e) => {
                        const newFacilities = [...facilities];
                        newFacilities[index].name = e.target.value;
                        setFacilities(newFacilities);
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Price Type</Label>
                    <Select
                      value={facility.priceType}
                      onValueChange={(value) => {
                        const newFacilities = [...facilities];
                        newFacilities[index].priceType = value;
                        setFacilities(newFacilities);
                      }}
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
                  {facility.priceType === "paid" && (
                    <div className="space-y-1">
                      <Label className="text-xs">Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={facility.price}
                        onChange={(e) => {
                          const newFacilities = [...facilities];
                          newFacilities[index].price = e.target.value;
                          setFacilities(newFacilities);
                        }}
                      />
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label className="text-xs">Capacity</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="20"
                        value={facility.capacity}
                        onChange={(e) => {
                          const newFacilities = [...facilities];
                          newFacilities[index].capacity = e.target.value;
                          setFacilities(newFacilities);
                        }}
                      />
                      {facilities.length > 1 && (
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => removeFacility(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Activities */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Activities (Optional)</h2>
              <Button type="button" size="sm" onClick={addActivity}>Add Activity</Button>
            </div>
            {activities.map((activity, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Name</Label>
                  <Input
                    placeholder="Activity name"
                    value={activity.name}
                    onChange={(e) => {
                      const newActivities = [...activities];
                      newActivities[index].name = e.target.value;
                      setActivities(newActivities);
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Price Type</Label>
                  <Select
                    value={activity.priceType}
                    onValueChange={(value) => {
                      const newActivities = [...activities];
                      newActivities[index].priceType = value;
                      setActivities(newActivities);
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 flex gap-2 items-end">
                  {activity.priceType === "paid" && (
                    <div className="flex-1">
                      <Label className="text-xs">Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={activity.price}
                        onChange={(e) => {
                          const newActivities = [...activities];
                          newActivities[index].price = e.target.value;
                          setActivities(newActivities);
                        }}
                      />
                    </div>
                  )}
                  {activities.length > 1 && (
                    <Button type="button" size="sm" variant="destructive" onClick={() => removeActivity(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Amenities */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Add amenities like Pool, Gym, etc. (Separate with a coma)</h2>
              <Button type="button" size="sm" onClick={addAmenity}>Add Amenity</Button>
            </div>
            {amenities.map((amenity, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="e.g. Free WiFi, Parking, Restrooms"
                  value={amenity}
                  onChange={(e) => {
                    const newAmenities = [...amenities];
                    newAmenities[index] = e.target.value;
                    setAmenities(newAmenities);
                  }}
                />
                {amenities.length > 1 && (
                  <Button type="button" size="sm" variant="destructive" onClick={() => removeAmenity(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Photos Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Photos (Maximum 5)</h2>
            
            <div>
              <Label htmlFor="photos" className="cursor-pointer">
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-accent transition-colors">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload photos ({photoFiles.length}/5)
                  </p>
                </div>
              </Label>
              <Input
                id="photos"
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoChange}
                className="hidden"
                disabled={photoFiles.length >= 5}
              />
            </div>

            {photoPreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photoPreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={() => removePhoto(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={loading || uploadingImages}>
            {loading || uploadingImages ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {uploadingImages ? "Uploading photos..." : "Submitting..."}
              </>
            ) : (
              "Submit for Approval"
            )}
          </Button>
        </form>
      </Card>
      </main>
      
      <Footer />
      <MobileBottomBar />
    </div>
  );
}