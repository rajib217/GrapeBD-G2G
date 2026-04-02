import { useEffect, useRef } from 'react';

interface ProfileQRCodeProps {
  profileId: string;
  size?: number;
}

const ProfileQRCode = ({ profileId, size = 150 }: ProfileQRCodeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const url = `${window.location.origin}/user/${profileId}`;

  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Simple QR code generation using a canvas-based approach
    // We'll use an external API for simplicity
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&format=png&margin=8`;
    img.onload = () => {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx && canvasRef.current) {
        canvasRef.current.width = size;
        canvasRef.current.height = size;
        ctx.drawImage(img, 0, 0, size, size);
      }
    };
  }, [profileId, size, url]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `profile-qr-${profileId}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas ref={canvasRef} className="rounded-lg border border-border" width={size} height={size} />
      <p className="text-[10px] text-muted-foreground text-center max-w-[150px] truncate">{url}</p>
      <button
        onClick={handleDownload}
        className="text-xs text-primary hover:underline"
      >
        QR ডাউনলোড করুন
      </button>
    </div>
  );
};

export default ProfileQRCode;
