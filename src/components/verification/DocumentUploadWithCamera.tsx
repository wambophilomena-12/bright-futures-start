import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload, CheckCircle2, X } from "lucide-react";
import { CameraCaptureFrame } from "./CameraCaptureFrame";

const TEAL_COLOR = "#008080";

type DocumentType = "national_id" | "passport" | "driving_licence";

interface DocumentUploadWithCameraProps {
  documentType: DocumentType;
  label: string;
  side: "front" | "back" | "selfie";
  file: File | null;
  onFileChange: (file: File | null) => void;
  required?: boolean;
}

const getCaptureType = (documentType: DocumentType, side: "front" | "back" | "selfie") => {
  if (side === "selfie") return "selfie";
  if (documentType === "passport") return "passport";
  if (documentType === "driving_licence") {
    return side === "front" ? "driving_licence_front" : "driving_licence_back";
  }
  return side === "front" ? "id_front" : "id_back";
};

export const DocumentUploadWithCamera = ({
  documentType,
  label,
  side,
  file,
  onFileChange,
  required = true,
}: DocumentUploadWithCameraProps) => {
  const [showCamera, setShowCamera] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    if (selectedFile) {
      onFileChange(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleCameraCapture = (capturedFile: File) => {
    onFileChange(capturedFile);
    setPreviewUrl(URL.createObjectURL(capturedFile));
    setShowCamera(false);
  };

  const handleRemove = () => {
    onFileChange(null);
    setPreviewUrl(null);
  };

  const captureType = getCaptureType(documentType, side);

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>

      {file && previewUrl ? (
        <div className="relative">
          <div className="relative rounded-lg overflow-hidden border-2 border-dashed" style={{ borderColor: TEAL_COLOR }}>
            <img 
              src={previewUrl} 
              alt={label}
              className={`w-full h-48 object-cover ${side === 'selfie' ? 'rounded-lg' : ''}`}
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 rounded-full"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" style={{ color: TEAL_COLOR }} />
            {file.name}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {/* Take Photo Button */}
          <Button
            type="button"
            variant="outline"
            className="h-24 flex flex-col items-center justify-center gap-2 border-2 border-dashed hover:border-solid transition-all"
            style={{ borderColor: TEAL_COLOR }}
            onClick={() => setShowCamera(true)}
          >
            <Camera className="h-8 w-8" style={{ color: TEAL_COLOR }} />
            <span className="text-xs font-medium">Take Photo</span>
          </Button>

          {/* Upload File Button */}
          <label className="cursor-pointer">
            <div className="h-24 flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-md hover:border-solid transition-all border-muted-foreground/30 hover:border-muted-foreground/50">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Upload File</span>
            </div>
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Instruction text */}
      <p className="text-xs text-muted-foreground">
        {side === "selfie" 
          ? "Take a clear photo of your face with good lighting." 
          : side === "front"
          ? "Capture the front side showing your photo and details."
          : "Capture the back side of your document."}
      </p>

      {/* Camera Capture Modal */}
      {showCamera && (
        <CameraCaptureFrame
          captureType={captureType}
          onCapture={handleCameraCapture}
          onCancel={() => setShowCamera(false)}
        />
      )}
    </div>
  );
};
