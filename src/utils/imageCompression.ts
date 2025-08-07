export const compressPostImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const MAX_WIDTH = 800;
    const MAX_HEIGHT = 600;
    const MAX_SIZE_KB = 500;

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions
      if (width > height) {
        if (width > MAX_WIDTH) {
          height = Math.round(height * (MAX_WIDTH / width));
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width = Math.round(width * (MAX_HEIGHT / height));
          height = MAX_HEIGHT;
        }
      }
       // Check if the new width is greater than MAX_WIDTH after height adjustment
      if (width > MAX_WIDTH) {
        height = Math.round(height * (MAX_WIDTH / width));
        width = MAX_WIDTH;
      }


      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Failed to get canvas context'));
      }
      ctx.drawImage(img, 0, 0, width, height);

      // Function to attempt compression
      const tryCompress = (quality: number) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const sizeKB = blob.size / 1024;
              if (sizeKB <= MAX_SIZE_KB || quality <= 0.1) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                // Reduce quality and try again
                tryCompress(quality - 0.1);
              }
            } else {
              reject(new Error('Canvas to Blob conversion failed'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      // Start with high quality
      tryCompress(0.9);
    };
    img.onerror = () => {
      reject(new Error('Image failed to load'));
    };
  });
};

export const compressImage = (file: File, maxSizeKB: number = 50): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      const maxDimension = 175; // Maximum width or height
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxDimension) {
          height *= maxDimension / width;
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width *= maxDimension / height;
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;
      
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Start with quality 0.8 and reduce until file size is acceptable
      let quality = 0.8;
      const tryCompress = () => {
        canvas.toBlob((blob) => {
          if (blob) {
            const sizeKB = blob.size / 1024;
            if (sizeKB <= maxSizeKB || quality <= 0.1) {
              // Create a new File object with the compressed blob
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              quality -= 0.1;
              tryCompress();
            }
          }
        }, 'image/jpeg', quality);
      };
      
      tryCompress();
    };

    img.src = URL.createObjectURL(file);
  });
};