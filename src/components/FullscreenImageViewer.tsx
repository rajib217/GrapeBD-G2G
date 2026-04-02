import { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FullscreenImageViewerProps {
  src: string;
  alt?: string;
  isOpen: boolean;
  onClose: () => void;
}

const FullscreenImageViewer = ({ src, alt, isOpen, onClose }: FullscreenImageViewerProps) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setRotation(0);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') setScale(s => Math.min(s + 0.25, 5));
      if (e.key === '-') setScale(s => Math.max(s - 0.25, 0.25));
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10" onClick={e => e.stopPropagation()}>
        <Button size="icon" variant="ghost" className="text-white hover:bg-white/20 h-10 w-10" onClick={() => setScale(s => Math.min(s + 0.25, 5))}>
          <ZoomIn className="w-5 h-5" />
        </Button>
        <Button size="icon" variant="ghost" className="text-white hover:bg-white/20 h-10 w-10" onClick={() => setScale(s => Math.max(s - 0.25, 0.25))}>
          <ZoomOut className="w-5 h-5" />
        </Button>
        <Button size="icon" variant="ghost" className="text-white hover:bg-white/20 h-10 w-10" onClick={() => setRotation(r => r + 90)}>
          <RotateCw className="w-5 h-5" />
        </Button>
        <Button size="icon" variant="ghost" className="text-white hover:bg-white/20 h-10 w-10" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Image */}
      <div className="max-w-[95vw] max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <img
          src={src}
          alt={alt || 'Fullscreen view'}
          className="max-w-full max-h-[90vh] object-contain transition-transform duration-200 select-none"
          style={{ transform: `scale(${scale}) rotate(${rotation}deg)` }}
          draggable={false}
        />
      </div>
    </div>
  );
};

export default FullscreenImageViewer;
