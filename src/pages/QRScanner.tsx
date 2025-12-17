import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Camera, CheckCircle, XCircle, AlertCircle, User, Calendar, Mail, Phone, Users } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface BookingData {
  bookingId: string;
  visitDate: string;
  email: string;
}

interface VerifiedBooking {
  id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  visit_date: string;
  total_amount: number;
  slots_booked: number;
  booking_type: string;
  item_id: string;
  payment_status: string;
  status: string;
  booking_details: any;
}

const QRScanner = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isMobile, setIsMobile] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [verifiedBooking, setVerifiedBooking] = useState<VerifiedBooking | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "verifying" | "valid" | "invalid" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [itemName, setItemName] = useState("");

  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < 768 || 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        window.matchMedia('(display-mode: standalone)').matches;
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const verifyBooking = async (qrData: string) => {
    setVerificationStatus("verifying");
    setErrorMessage("");

    try {
      const parsedData: BookingData = JSON.parse(qrData);
      const { bookingId, visitDate, email } = parsedData;

      if (!bookingId || !visitDate || !email) {
        throw new Error("Invalid QR code format");
      }

      // Fetch booking from database
      const { data: booking, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single();

      if (error || !booking) {
        setVerificationStatus("invalid");
        setErrorMessage("Booking not found");
        return;
      }

      // Verify booking details match
      if (booking.guest_email !== email) {
        setVerificationStatus("invalid");
        setErrorMessage("Booking email doesn't match");
        return;
      }

      // Check if booking is paid
      if (booking.payment_status !== "completed" && booking.payment_status !== "paid") {
        setVerificationStatus("invalid");
        setErrorMessage("Booking is not paid");
        return;
      }

      // Check if visit date matches
      const bookingVisitDate = booking.visit_date ? format(new Date(booking.visit_date), "yyyy-MM-dd") : null;
      if (bookingVisitDate !== visitDate) {
        setVerificationStatus("invalid");
        setErrorMessage(`Visit date mismatch. Expected: ${visitDate}, Found: ${bookingVisitDate}`);
        return;
      }

      // Verify host owns this item
      const itemId = booking.item_id;
      const bookingType = booking.booking_type;
      
      let itemData: { created_by: string | null; name: string } | null = null;

      if (bookingType === "trip" || bookingType === "event") {
        const { data } = await supabase
          .from("trips")
          .select("created_by, name")
          .eq("id", itemId)
          .single();
        itemData = data;
      } else if (bookingType === "hotel") {
        const { data } = await supabase
          .from("hotels")
          .select("created_by, name")
          .eq("id", itemId)
          .single();
        itemData = data;
      } else if (bookingType === "adventure_place" || bookingType === "campsite" || bookingType === "experience") {
        const { data } = await supabase
          .from("adventure_places")
          .select("created_by, name")
          .eq("id", itemId)
          .single();
        itemData = data;
      }

      if (itemData) {
        if (itemData.created_by !== user?.id) {
          setVerificationStatus("invalid");
          setErrorMessage("This booking is not for your listing");
          return;
        }
        setItemName(itemData.name || "Unknown Item");
      }

      setVerifiedBooking(booking as VerifiedBooking);
      setVerificationStatus("valid");
      
      toast({
        title: "Booking Verified",
        description: "Guest check-in confirmed successfully",
      });

    } catch (err) {
      setVerificationStatus("error");
      setErrorMessage("Invalid QR code. Please scan a valid booking QR code.");
    }
  };

  const handleScan = (result: any) => {
    if (result && result[0]?.rawValue && scanning) {
      setScanning(false);
      verifyBooking(result[0].rawValue);
    }
  };

  const handleError = (error: any) => {
    console.error("Scanner error:", error);
    toast({
      title: "Scanner Error",
      description: "Could not access camera. Please check permissions.",
      variant: "destructive",
    });
  };

  const resetScanner = () => {
    setScanning(true);
    setVerifiedBooking(null);
    setVerificationStatus("idle");
    setErrorMessage("");
    setItemName("");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isMobile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              QR Scanner
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              QR code scanner is only available on mobile devices or the installed PWA app.
            </p>
            <Button onClick={() => navigate(-1)} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-header text-header-foreground p-4 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="text-header-foreground hover:bg-header-foreground/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Scan Booking QR</h1>
      </div>

      <div className="p-4 space-y-4">
        {scanning && verificationStatus === "idle" && (
          <>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Point your camera at the guest's booking QR code to verify their check-in
                </p>
                <div className="rounded-lg overflow-hidden">
                  <Scanner
                    onScan={handleScan}
                    onError={handleError}
                    constraints={{ facingMode: "environment" }}
                    styles={{
                      container: { width: "100%", borderRadius: "0.5rem" },
                      video: { borderRadius: "0.5rem" }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {verificationStatus === "verifying" && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Verifying booking...</p>
            </CardContent>
          </Card>
        )}

        {verificationStatus === "valid" && verifiedBooking && (
          <Card className="border-green-500">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <CardTitle className="text-green-600">Booking Verified</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Valid Check-in
              </Badge>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Guest Name</p>
                    <p className="font-medium">{verifiedBooking.guest_name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{verifiedBooking.guest_email}</p>
                  </div>
                </div>

                {verifiedBooking.guest_phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-medium">{verifiedBooking.guest_phone}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Visit Date</p>
                    <p className="font-medium">
                      {verifiedBooking.visit_date
                        ? format(new Date(verifiedBooking.visit_date), "MMMM d, yyyy")
                        : "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Number of People</p>
                    <p className="font-medium">{verifiedBooking.slots_booked || 1} people</p>
                  </div>
                </div>

                {itemName && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">Item Booked</p>
                    <p className="font-medium">{itemName}</p>
                  </div>
                )}

                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">Booking ID</p>
                  <p className="font-mono text-sm">{verifiedBooking.id}</p>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">Total Amount</p>
                  <p className="font-semibold text-lg">KES {verifiedBooking.total_amount?.toLocaleString()}</p>
                </div>
              </div>

              <Button onClick={resetScanner} className="w-full mt-4">
                <Camera className="h-4 w-4 mr-2" />
                Scan Another
              </Button>
            </CardContent>
          </Card>
        )}

        {(verificationStatus === "invalid" || verificationStatus === "error") && (
          <Card className="border-destructive">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <XCircle className="h-6 w-6 text-destructive" />
                <CardTitle className="text-destructive">Verification Failed</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{errorMessage}</p>
              <Button onClick={resetScanner} className="w-full">
                <Camera className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default QRScanner;
