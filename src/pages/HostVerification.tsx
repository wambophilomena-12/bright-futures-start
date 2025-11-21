import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MultiStepForm } from "@/components/creation/MultiStepForm";
import { Upload, CheckCircle2 } from "lucide-react";

const HostVerification = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [existingVerification, setExistingVerification] = useState<any>(null);

  // Form state
  const [legalName, setLegalName] = useState("");
  const [address, setAddress] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [documentFront, setDocumentFront] = useState<File | null>(null);
  const [documentBack, setDocumentBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    // Check if user already has a verification
    const checkVerification = async () => {
      const { data, error } = await supabase
        .from("host_verifications")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setExistingVerification(data);
        
        // If approved, redirect to become host
        if (data.status === "approved") {
          navigate("/become-host");
        }
      }
    };

    checkVerification();
  }, [user, navigate]);

  const uploadFile = async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from("verification-documents")
      .upload(path, file, { upsert: true });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from("verification-documents")
      .getPublicUrl(path);

    return urlData.publicUrl;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!legalName || !address || !documentType) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }
    } else if (currentStep === 2) {
      if (!documentFront || (documentType !== "passport" && !documentBack)) {
        toast({
          title: "Missing Documents",
          description: "Please upload all required documents.",
          variant: "destructive",
        });
        return;
      }
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!selfie) {
      toast({
        title: "Missing Selfie",
        description: "Please upload your selfie.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Upload files
      const frontUrl = await uploadFile(documentFront!, `${user!.id}/document_front_${Date.now()}`);
      const backUrl = documentBack 
        ? await uploadFile(documentBack, `${user!.id}/document_back_${Date.now()}`)
        : null;
      const selfieUrl = await uploadFile(selfie, `${user!.id}/selfie_${Date.now()}`);

      // Insert or update verification
      const verificationData = {
        user_id: user!.id,
        legal_name: legalName,
        residential_address: address,
        document_type: documentType,
        document_front_url: frontUrl,
        document_back_url: backUrl,
        selfie_url: selfieUrl,
        status: "pending",
        rejection_reason: null,
        submitted_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("host_verifications")
        .upsert(verificationData, { onConflict: "user_id" });

      if (error) throw error;

      toast({
        title: "Submission Successful",
        description: "Your identity is currently under review. We will notify you of the result soon.",
      });

      navigate("/verification-status");
    } catch (error: any) {
      console.error("Verification submission error:", error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit verification. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // If user has pending verification, show status
  if (existingVerification && existingVerification.status === "pending") {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container px-4 py-8 mb-20 md:mb-0">
          <Card className="max-w-2xl mx-auto p-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Verification Pending</h1>
            <p className="text-muted-foreground mb-6">
              Your identity verification is currently under review. We will notify you of the result soon.
            </p>
            <Button onClick={() => navigate("/")}>Return to Home</Button>
          </Card>
        </main>
        <Footer />
        <MobileBottomBar />
      </div>
    );
  }

  // If rejected, allow re-submission
  if (existingVerification && existingVerification.status === "rejected") {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container px-4 py-8 mb-20 md:mb-0">
          <Card className="max-w-2xl mx-auto p-8">
            <h1 className="text-2xl font-bold mb-4 text-destructive">Verification Failed</h1>
            <div className="bg-destructive/10 p-4 rounded-md mb-6">
              <p className="font-semibold mb-2">Rejection Reason:</p>
              <p className="text-muted-foreground">{existingVerification.rejection_reason}</p>
            </div>
            <Button onClick={() => setExistingVerification(null)} className="w-full">
              Start Verification Process Again
            </Button>
          </Card>
        </main>
        <Footer />
        <MobileBottomBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container px-4 py-8 mb-20 md:mb-0">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-2 text-center">Verify Your Identity to Become a Host</h1>
          <p className="text-muted-foreground mb-8 text-center">
            Complete the following steps to verify your identity and gain access to hosting features.
          </p>

          <MultiStepForm
            currentStep={currentStep}
            totalSteps={3}
            title={
              currentStep === 1
                ? "Identity Details"
                : currentStep === 2
                ? "Document Uploads"
                : "Liveness Check"
            }
            description={
              currentStep === 1
                ? "Provide your legal information"
                : currentStep === 2
                ? "Upload your government-issued documents"
                : "Upload a selfie for verification"
            }
            onNext={handleNext}
            onPrev={handlePrev}
            onSubmit={handleSubmit}
            nextDisabled={false}
            isLoading={isLoading}
          >
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="legalName">Legal Name (Must match government ID) *</Label>
                  <Input
                    id="legalName"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    placeholder="Enter your full legal name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="address">Current Residential Address *</Label>
                  <Textarea
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your full residential address"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="documentType">Government Document Type *</Label>
                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="national_id">National ID</SelectItem>
                      <SelectItem value="passport">Passport</SelectItem>
                      <SelectItem value="driving_licence">Driving Licence</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="documentFront">Upload Front Side of Document *</Label>
                  <div className="mt-2">
                    <Input
                      id="documentFront"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setDocumentFront(e.target.files?.[0] || null)}
                      required
                    />
                    {documentFront && (
                      <p className="text-sm text-muted-foreground mt-2">
                        <CheckCircle2 className="h-4 w-4 inline mr-1 text-green-600" />
                        {documentFront.name}
                      </p>
                    )}
                  </div>
                </div>

                {documentType !== "passport" && (
                  <div>
                    <Label htmlFor="documentBack">Upload Back Side of Document *</Label>
                    <div className="mt-2">
                      <Input
                        id="documentBack"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setDocumentBack(e.target.files?.[0] || null)}
                        required
                      />
                      {documentBack && (
                        <p className="text-sm text-muted-foreground mt-2">
                          <CheckCircle2 className="h-4 w-4 inline mr-1 text-green-600" />
                          {documentBack.name}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {documentType === "passport" && (
                  <p className="text-sm text-muted-foreground">
                    Back side upload is not required for passport.
                  </p>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="selfie">Upload a Clear Selfie *</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Please upload a clear photo of yourself. This will be used to verify your identity.
                  </p>
                  <div className="mt-2">
                    <Input
                      id="selfie"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSelfie(e.target.files?.[0] || null)}
                      required
                    />
                    {selfie && (
                      <div className="mt-4">
                        <img
                          src={URL.createObjectURL(selfie)}
                          alt="Selfie preview"
                          className="max-w-xs mx-auto rounded-lg border"
                        />
                        <p className="text-sm text-muted-foreground mt-2 text-center">
                          <CheckCircle2 className="h-4 w-4 inline mr-1 text-green-600" />
                          {selfie.name}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </MultiStepForm>
        </div>
      </main>
      <Footer />
      <MobileBottomBar />
    </div>
  );
};

export default HostVerification;