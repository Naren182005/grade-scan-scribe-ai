
import React, { useRef, useState, useEffect } from 'react';
import { Camera, CameraOff, ScanText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { extractTextFromImage } from "@/utils/evaluationService";

interface ScanCameraProps {
  onCapture: (text: string, imageUrl: string) => void;
}

const ScanCamera: React.FC<ScanCameraProps> = ({ onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isCaptured, setIsCaptured] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().catch(err => {
              console.error("Error playing video:", err);
              toast.error("Failed to start camera stream");
              setCameraError("Failed to start camera stream");
            });
          }
        };
      }
      
      setStream(mediaStream);
      setIsActive(true);
      toast.success("Camera started");
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Failed to access camera. Please check camera permissions.");
      setCameraError("Failed to access camera. Please ensure you've granted camera permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsActive(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    try {
      // Convert to image URL
      const imageUrl = canvas.toDataURL('image/png');
      setCapturedImageUrl(imageUrl);
      setIsCaptured(true);
      
      // Process the image with OCR
      setIsProcessing(true);
      const extractedText = await extractTextFromImage(imageUrl);
      onCapture(extractedText, imageUrl);
      toast.success("Answer sheet scanned successfully!");
    } catch (error) {
      console.error("Error processing image:", error);
      toast.error("Error processing image");
    } finally {
      setIsProcessing(false);
      
      // Stop the camera after capture
      stopCamera();
    }
  };

  const retakePhoto = () => {
    setIsCaptured(false);
    setCapturedImageUrl('');
    startCamera();
  };

  return (
    <Card className="overflow-hidden shadow-lg border-app-teal-100">
      <div className="p-4 bg-app-blue-50">
        <div className="flex items-center gap-2 mb-2">
          <ScanText className="h-5 w-5 text-app-teal-600" />
          <h2 className="font-semibold text-app-blue-900">Scan Answer Sheet</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Position the answer sheet within the frame and capture a clear image
        </p>
        
        <div className="relative aspect-[4/3] bg-black rounded-lg overflow-hidden shadow-inner">
          {isActive && !isCaptured && (
            <>
              <div className="scan-line animate-scan"></div>
              <div className="scan-overlay"></div>
            </>
          )}
          
          {isActive && !isCaptured ? (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline
              className="absolute inset-0 w-full h-full object-cover camera-cutout"
            />
          ) : isCaptured ? (
            <img 
              src={capturedImageUrl} 
              alt="Captured answer sheet" 
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full bg-app-blue-900 text-white p-6">
              <CameraOff size={48} className="opacity-50 mb-4" />
              {cameraError ? (
                <p className="text-center text-sm opacity-80">{cameraError}</p>
              ) : (
                <p className="text-center text-sm opacity-80">Click "Start Camera" to begin scanning</p>
              )}
            </div>
          )}
          
          <canvas ref={canvasRef} className="hidden" />
        </div>
        
        <div className="flex gap-2 mt-4 justify-center">
          {isActive ? (
            <Button 
              onClick={captureImage} 
              className="bg-app-teal-500 hover:bg-app-teal-600 transition-all shadow-md focus:ring-2 focus:ring-app-teal-300 focus:ring-offset-2"
              aria-label="Capture image"
            >
              <Camera className="mr-2 h-4 w-4" />
              Capture
            </Button>
          ) : isCaptured ? (
            <Button 
              onClick={retakePhoto}
              variant="outline"
              disabled={isProcessing}
              className="border-app-teal-300 hover:bg-app-teal-50 focus:ring-2 focus:ring-app-teal-300 focus:ring-offset-2"
              aria-label="Retake photo"
            >
              <Camera className="mr-2 h-4 w-4" />
              Retake
            </Button>
          ) : (
            <Button 
              onClick={startCamera} 
              className="bg-app-blue-500 hover:bg-app-blue-600 transition-all shadow-md focus:ring-2 focus:ring-app-blue-300 focus:ring-offset-2"
              aria-label="Start camera"
            >
              <Camera className="mr-2 h-4 w-4" />
              Start Camera
            </Button>
          )}
          
          {isActive && (
            <Button 
              onClick={stopCamera} 
              variant="outline"
              className="border-app-blue-300 hover:bg-app-blue-50 focus:ring-2 focus:ring-app-blue-300 focus:ring-offset-2"
              aria-label="Cancel camera"
            >
              <CameraOff className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ScanCamera;
