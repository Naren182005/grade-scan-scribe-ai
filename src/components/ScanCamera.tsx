
import React, { useRef, useState, useEffect } from 'react';
import { ScanText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { extractTextFromImage } from "@/utils/evaluationServices";
import CameraView from "./camera/CameraView";
import CameraControls from "./camera/CameraControls";

interface ScanCameraProps {
  onCapture: (text: string, imageUrl: string) => void;
  title?: string;
  description?: string;
}

const ScanCamera: React.FC<ScanCameraProps> = ({ 
  onCapture, 
  title = "Scan Answer Sheet",
  description = "Position the answer sheet within the frame and capture a clear image"
}) => {
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
      toast.success(`${title} scanned successfully!`);
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
          <h2 className="font-semibold text-app-blue-900">{title}</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {description}
        </p>
        
        <CameraView
          isActive={isActive}
          isCaptured={isCaptured}
          capturedImageUrl={capturedImageUrl}
          cameraError={cameraError}
          videoRef={videoRef}
        />
        
        <canvas ref={canvasRef} className="hidden" />
        
        <CameraControls
          isActive={isActive}
          isCaptured={isCaptured}
          isProcessing={isProcessing}
          onStartCamera={startCamera}
          onStopCamera={stopCamera}
          onCaptureImage={captureImage}
          onRetakePhoto={retakePhoto}
        />
      </div>
    </Card>
  );
};

export default ScanCamera;
