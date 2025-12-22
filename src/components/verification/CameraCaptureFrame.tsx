import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X, RotateCcw, Check, AlertCircle } from "lucide-react";

const TEAL_COLOR = "#008080";

type CaptureType = "id_front" | "id_back" | "passport" | "driving_licence_front" | "driving_licence_back" | "selfie";

interface CameraCaptureFrameProps {
  captureType: CaptureType;
  onCapture: (file: File) => void;
  onCancel: () => void;
}

const CAPTURE_CONFIG: Record<CaptureType, { 
  title: string; 
  instruction: string; 
  aspectRatio: number;
  isCircular?: boolean;
  width: number;
  height: number;
}> = {
  id_front: {
    title: "Front of ID Card",
    instruction: "Position the FRONT of your ID card within the frame. Ensure all text is clearly visible.",
    aspectRatio: 1.586, // Standard ID card ratio (85.6mm x 54mm)
    width: 320,
    height: 202,
  },
  id_back: {
    title: "Back of ID Card",
    instruction: "Position the BACK of your ID card within the frame. Ensure all text is clearly visible.",
    aspectRatio: 1.586,
    width: 320,
    height: 202,
  },
  passport: {
    title: "Passport Photo Page",
    instruction: "Position your passport's photo page within the frame. Ensure your photo and details are legible.",
    aspectRatio: 1.0, // Passport photo page is roughly square
    width: 280,
    height: 280,
  },
  driving_licence_front: {
    title: "Front of Driving Licence",
    instruction: "Position the FRONT of your driving licence within the frame.",
    aspectRatio: 1.586,
    width: 320,
    height: 202,
  },
  driving_licence_back: {
    title: "Back of Driving Licence",
    instruction: "Position the BACK of your driving licence within the frame.",
    aspectRatio: 1.586,
    width: 320,
    height: 202,
  },
  selfie: {
    title: "Selfie Verification",
    instruction: "Center your face within the circle. Ensure good lighting and remove any obstructions.",
    aspectRatio: 1,
    isCircular: true,
    width: 280,
    height: 280,
  },
};

export const CameraCaptureFrame = ({ captureType, onCapture, onCancel }: CameraCaptureFrameProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    captureType === "selfie" ? "user" : "environment"
  );

  const config = CAPTURE_CONFIG[captureType];

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Unable to access camera. Please ensure you have granted camera permissions.");
    } finally {
      setIsLoading(false);
    }
  }, [facingMode, stream]);

  useEffect(() => {
    startCamera();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  const switchCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    if (!ctx) return;

    // Set canvas to capture area dimensions
    const captureWidth = config.width * 2; // Higher res for quality
    const captureHeight = config.height * 2;
    canvas.width = captureWidth;
    canvas.height = captureHeight;

    // Calculate crop area from video center
    const videoAspect = video.videoWidth / video.videoHeight;
    const targetAspect = config.width / config.height;
    
    let sourceX = 0, sourceY = 0, sourceWidth = video.videoWidth, sourceHeight = video.videoHeight;
    
    if (videoAspect > targetAspect) {
      // Video is wider - crop sides
      sourceWidth = video.videoHeight * targetAspect;
      sourceX = (video.videoWidth - sourceWidth) / 2;
    } else {
      // Video is taller - crop top/bottom
      sourceHeight = video.videoWidth / targetAspect;
      sourceY = (video.videoHeight - sourceHeight) / 2;
    }

    // Draw cropped and scaled image
    ctx.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, captureWidth, captureHeight);

    // If circular (selfie), apply circular mask
    if (config.isCircular) {
      ctx.globalCompositeOperation = "destination-in";
      ctx.beginPath();
      ctx.arc(captureWidth / 2, captureHeight / 2, captureWidth / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    }

    const imageUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(imageUrl);
  }, [config]);

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const confirmPhoto = useCallback(() => {
    if (!capturedImage) return;

    // Convert base64 to File
    fetch(capturedImage)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], `${captureType}_${Date.now()}.jpg`, { type: "image/jpeg" });
        onCapture(file);
      });
  }, [capturedImage, captureType, onCapture]);

  const handleCancel = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="bg-black/80 p-4 flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleCancel}
          className="text-white hover:bg-white/20"
        >
          <X className="h-6 w-6" />
        </Button>
        <h2 className="text-white font-bold text-lg">{config.title}</h2>
        {captureType !== "selfie" && (
          <Button 
            variant="ghost" 
            size="icon"
            onClick={switchCamera}
            className="text-white hover:bg-white/20"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
        )}
        {captureType === "selfie" && <div className="w-10" />}
      </div>

      {/* Camera View */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="text-center p-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-white mb-4">{error}</p>
            <Button onClick={startCamera} style={{ backgroundColor: TEAL_COLOR }}>
              Try Again
            </Button>
          </div>
        ) : capturedImage ? (
          <div className="relative">
            <img 
              src={capturedImage} 
              alt="Captured" 
              className={`max-w-full max-h-full object-contain ${config.isCircular ? 'rounded-full' : 'rounded-lg'}`}
              style={{ width: config.width, height: config.height }}
            />
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
            />
            
            {/* Overlay with cutout */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Semi-transparent overlay */}
              <svg className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <mask id="frameMask">
                    <rect width="100%" height="100%" fill="white" />
                    {config.isCircular ? (
                      <circle 
                        cx="50%" 
                        cy="50%" 
                        r={config.width / 2} 
                        fill="black" 
                      />
                    ) : (
                      <rect 
                        x="50%" 
                        y="50%" 
                        width={config.width} 
                        height={config.height} 
                        fill="black"
                        transform={`translate(-${config.width / 2}, -${config.height / 2})`}
                        rx="12"
                      />
                    )}
                  </mask>
                </defs>
                <rect 
                  width="100%" 
                  height="100%" 
                  fill="rgba(0,0,0,0.7)" 
                  mask="url(#frameMask)" 
                />
              </svg>

              {/* Frame border */}
              <div 
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                style={{ 
                  width: config.width, 
                  height: config.height,
                  border: `3px solid ${TEAL_COLOR}`,
                  borderRadius: config.isCircular ? '50%' : '12px',
                  boxShadow: `0 0 0 4px rgba(0,128,128,0.3)`,
                }}
              />

              {/* Corner guides for rectangular frames */}
              {!config.isCircular && (
                <div 
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  style={{ width: config.width, height: config.height }}
                >
                  {/* Top-left corner */}
                  <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 rounded-tl-lg" style={{ borderColor: TEAL_COLOR }} />
                  {/* Top-right corner */}
                  <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 rounded-tr-lg" style={{ borderColor: TEAL_COLOR }} />
                  {/* Bottom-left corner */}
                  <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 rounded-bl-lg" style={{ borderColor: TEAL_COLOR }} />
                  {/* Bottom-right corner */}
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 rounded-br-lg" style={{ borderColor: TEAL_COLOR }} />
                </div>
              )}
            </div>

            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: TEAL_COLOR, borderTopColor: 'transparent' }} />
              </div>
            )}
          </>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Instructions */}
      <div className="bg-black/80 px-6 py-3">
        <p className="text-white/80 text-sm text-center">{config.instruction}</p>
      </div>

      {/* Actions */}
      <div className="bg-black p-6 flex justify-center gap-6">
        {capturedImage ? (
          <>
            <Button
              variant="outline"
              size="lg"
              onClick={retakePhoto}
              className="rounded-full px-8 border-white/30 text-white hover:bg-white/10"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Retake
            </Button>
            <Button
              size="lg"
              onClick={confirmPhoto}
              className="rounded-full px-8"
              style={{ backgroundColor: TEAL_COLOR }}
            >
              <Check className="h-5 w-5 mr-2" />
              Use Photo
            </Button>
          </>
        ) : (
          <Button
            size="lg"
            onClick={capturePhoto}
            disabled={isLoading || !!error}
            className="rounded-full w-20 h-20 p-0"
            style={{ backgroundColor: TEAL_COLOR }}
          >
            <Camera className="h-8 w-8" />
          </Button>
        )}
      </div>
    </div>
  );
};
