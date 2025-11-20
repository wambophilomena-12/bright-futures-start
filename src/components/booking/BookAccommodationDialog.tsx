import { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { guestBookingSchema, paymentPhoneSchema } from "@/lib/validation";

interface Accommodation {
  id: string;
  name: string;
  price: number;
  capacity: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accommodation: Accommodation;
}

export const BookAccommodationDialog = ({ open, onOpenChange, accommodation }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [guests, setGuests] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentPhone, setPaymentPhone] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Guest booking fields
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  const resetForm = () => {
    setStep(1);
    setStartDate("");
    setEndDate("");
    setGuests(1);
    setPaymentMethod("");
    setPaymentPhone("");
    setGuestName("");
    setGuestEmail("");
    setGuestPhone("");
    setLoading(false);
  };

  const calculateTotal = () => {
    if (!startDate || !endDate) return 0;
    const days = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
    return accommodation.price * Math.max(days, 1);
  };

  const handleStepOne = () => {
    if (!startDate || !endDate) {
      toast({
        title: "Missing dates",
        description: "Please enter check-in and check-out dates",
        variant: "destructive",
      });
      return;
    }

    if (guests < 1 || guests > accommodation.capacity) {
      toast({
        title: "Invalid number of guests",
        description: `Please enter between 1 and ${accommodation.capacity} guests`,
        variant: "destructive",
      });
      return;
    }

    setStep(2);
  };

  const handleBooking = async () => {
    // Validate guest fields if not logged in
    if (!user) {
      const validation = guestBookingSchema.safeParse({
        name: guestName,
        email: guestEmail,
        phone: guestPhone,
      });

      if (!validation.success) {
        toast({
          title: "Invalid input",
          description: validation.error.issues[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    if (!paymentMethod) {
      toast({
        title: "Select payment method",
        description: "Please select a payment method",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod !== "cash") {
      const validation = paymentPhoneSchema.safeParse(paymentPhone);
      if (!validation.success) {
        toast({
          title: "Invalid phone number",
          description: validation.error.issues[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);
    try {
      const bookingData = {
        item_id: accommodation.id,
        booking_type: 'accommodation',
        total_amount: calculateTotal(),
        payment_method: paymentMethod,
        payment_phone: paymentMethod !== "cash" ? paymentPhone : null,
        booking_details: {
          startDate,
          endDate,
          guests,
          accommodationName: accommodation.name,
        },
        ...(user 
          ? { user_id: user.id, is_guest_booking: false }
          : { 
              is_guest_booking: true,
              guest_name: guestName,
              guest_email: guestEmail,
              guest_phone: guestPhone,
            }
        ),
      };

      const { error } = await supabase.from('bookings').insert(bookingData);

      if (error) throw error;

      toast({
        title: "Booking successful!",
        description: "Your accommodation booking has been confirmed.",
      });

      resetForm();
      onOpenChange(false);
      navigate('/bookings');
    } catch (error: any) {
      console.error('Booking error:', error);
      toast({
        title: "Booking failed",
        description: error.message || "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>
            Book {accommodation.name} - Step {step} of 2
          </DrawerTitle>
        </DrawerHeader>

        <ScrollArea className="px-6 pb-6">
          {step === 1 ? (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Check-in Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Check-out Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Number of Guests (Max: {accommodation.capacity})</Label>
                  <Input
                    type="number"
                    value={guests}
                    onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                    min={1}
                    max={accommodation.capacity}
                  />
                </div>
              </div>

              {startDate && endDate && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-lg font-semibold">
                    Total: KSh {calculateTotal().toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} nights × KSh {accommodation.price.toLocaleString()}
                  </p>
                </div>
              )}

              <Button onClick={handleStepOne} className="w-full">
                Continue to Payment
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {!user && (
                <div className="space-y-4 p-4 bg-muted rounded-lg">
                  <p className="font-medium">Guest Information</p>
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="your.email@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number *</Label>
                    <Input
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="+254700000000"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <Label>Payment Method</Label>
                <div className="grid grid-cols-3 gap-4">
                  {["mpesa", "airtel", "cash"].map((method) => (
                    <Button
                      key={method}
                      type="button"
                      variant={paymentMethod === method ? "default" : "outline"}
                      onClick={() => setPaymentMethod(method)}
                      className="capitalize"
                    >
                      {method}
                    </Button>
                  ))}
                </div>
              </div>

              {paymentMethod && paymentMethod !== "cash" && (
                <div className="space-y-2">
                  <Label>Payment Phone Number</Label>
                  <Input
                    value={paymentPhone}
                    onChange={(e) => setPaymentPhone(e.target.value)}
                    placeholder="+254700000000"
                  />
                </div>
              )}

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-lg font-semibold">
                  Total Amount: KSh {calculateTotal().toLocaleString()}
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleBooking} disabled={loading} className="flex-1">
                  {loading ? "Processing..." : "Confirm Booking"}
                </Button>
              </div>
            </div>
          )}
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
};
