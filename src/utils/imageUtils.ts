/**
 * Utility functions for image processing
 */

/**
 * Converts a data URL to a Blob
 * @param dataUrl The data URL to convert
 * @returns A Blob object
 */
export const dataURLtoBlob = (dataUrl: string): Blob => {
  // Split the data URL to get the content type and base64 data
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  
  // Create an array buffer from the base64 data
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  // Create a Blob from the array buffer
  return new Blob([u8arr], { type: mime });
};

/**
 * Compresses an image to reduce its size
 * @param imageUrl The URL of the image to compress
 * @param maxWidth The maximum width of the compressed image
 * @param quality The quality of the compressed image (0-1)
 * @returns A Promise that resolves to a compressed data URL
 */
export const compressImage = (imageUrl: string, maxWidth: number = 1200, quality: number = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      // Calculate the new dimensions
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      
      // Create a canvas to draw the compressed image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      // Draw the image on the canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert the canvas to a data URL
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      
      resolve(compressedDataUrl);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageUrl;
  });
};

/**
 * Prepares an image for OCR by enhancing its contrast and sharpness
 * @param imageUrl The URL of the image to enhance
 * @returns A Promise that resolves to an enhanced data URL
 */
export const enhanceImageForOCR = (imageUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      // Create a canvas to draw the enhanced image
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw the image on the canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      
      // Get the image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Apply contrast enhancement
      const contrast = 1.5; // Increase contrast
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      
      for (let i = 0; i < data.length; i += 4) {
        // Apply contrast to RGB channels
        data[i] = factor * (data[i] - 128) + 128; // Red
        data[i + 1] = factor * (data[i + 1] - 128) + 128; // Green
        data[i + 2] = factor * (data[i + 2] - 128) + 128; // Blue
        
        // Convert to grayscale for better OCR
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = data[i + 1] = data[i + 2] = avg;
        
        // Threshold to make text more distinct
        if (avg > 180) {
          data[i] = data[i + 1] = data[i + 2] = 255; // White
        } else if (avg < 100) {
          data[i] = data[i + 1] = data[i + 2] = 0; // Black
        }
      }
      
      // Put the enhanced image data back on the canvas
      ctx.putImageData(imageData, 0, 0);
      
      // Convert the canvas to a data URL
      const enhancedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      resolve(enhancedDataUrl);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageUrl;
  });
};
