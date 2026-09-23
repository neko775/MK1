import React, { useEffect, useState, useRef } from 'react';

interface GlowBackgroundProps {
  customBgUrl: string | null;
  customBgType: 'image' | 'video' | null;
  isTyping: boolean;
  nightModeEnabled: boolean;
  manualColorIndex?: number | null; // optional manual override
  glowSpeedSec?: number;
}

// 7 primary spectrum single colors: Red, Orange, Yellow, Green, Aqua/Cyan, Blue, Purple
const GLOW_COLORS = [
  { name: '赤 (Ruby)', hex: '239, 68, 68', primary: '#EF4444' },
  { name: '橙 (Amber)', hex: '249, 115, 22', primary: '#F97316' },
  { name: '黄 (Sun)', hex: '234, 179, 8', primary: '#EAB308' },
  { name: '緑 (Emerald)', hex: '16, 185, 129', primary: '#10B981' },
  { name: '水 (Cyan)', hex: '6, 182, 212', primary: '#06B6D4' },
  { name: '青 (Sapphire)', hex: '59, 130, 246', primary: '#3B82F6' },
  { name: '紫 (Violet)', hex: '139, 92, 246', primary: '#8B5CF6' },
];

export const GlowBackground: React.FC<GlowBackgroundProps> = React.memo(({
  customBgUrl,
  customBgType,
  isTyping,
  nightModeEnabled,
  manualColorIndex = null,
  glowSpeedSec = 12,
}) => {
  const [currentColorIndex, setCurrentColorIndex] = useState(0);
  const [glowOpacity, setGlowOpacity] = useState(0.45);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Determine night-time auto dimming based on local hours (22:00 ~ 06:00)
  const currentHour = new Date().getHours();
  const isNightHours = currentHour >= 22 || currentHour < 6;
  const isDimmed = nightModeEnabled || isNightHours;

  const hasCustomBackground = Boolean(customBgUrl && customBgUrl.trim().length > 0);

  // When customBgUrl is present, STOP the 7-color animation loop completely!
  useEffect(() => {
    if (hasCustomBackground) {
      // Custom background is active: disable 7-color transition
      return;
    }

    if (manualColorIndex !== null && manualColorIndex !== undefined) {
      setCurrentColorIndex(manualColorIndex);
      setGlowOpacity(0.5);
      return;
    }

    // Interval for a full cycle (fade in -> hold -> fade out -> switch)
    const holdDuration = (glowSpeedSec * 1000) * 0.7;
    const fadeDuration = (glowSpeedSec * 1000) * 0.3;

    const timer = setInterval(() => {
      // 1. Fade out to 0 so colors never mix
      setIsFadingOut(true);
      setGlowOpacity(0.02);

      setTimeout(() => {
        // 2. Switch color when invisible
        setCurrentColorIndex((prev) => (prev + 1) % GLOW_COLORS.length);
        setIsFadingOut(false);
        // 3. Fade back in
        setGlowOpacity(0.45);
      }, fadeDuration);
    }, holdDuration + fadeDuration);

    return () => clearInterval(timer);
  }, [glowSpeedSec, manualColorIndex, hasCustomBackground]);

  // Resource Protection: Auto-pause video when document is hidden or user is actively typing
  useEffect(() => {
    if (!hasCustomBackground || customBgType !== 'video') return;

    const handleVisibilityChange = () => {
      if (!videoRef.current) return;
      if (document.hidden || isTyping) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    };

    handleVisibilityChange();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isTyping, hasCustomBackground, customBgType]);

  const activeColor = GLOW_COLORS[currentColorIndex];
  const computedOpacity = isDimmed ? glowOpacity * 0.45 : glowOpacity;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden select-none -z-10 bg-[#FAFAFC] transition-colors duration-1000">
      {/* 1. Custom User Background (Image or Video) - Shown exclusively when set */}
      {hasCustomBackground && customBgUrl && (
        <div className={`absolute inset-0 transition-opacity duration-700 ${isDimmed ? 'brightness-75' : 'brightness-100'}`}>
          {customBgType === 'video' ? (
            <video
              ref={videoRef}
              src={customBgUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={customBgUrl}
              alt="Custom Background"
              className="w-full h-full object-cover"
            />
          )}
          {/* Frosted overlay for crisp readable content */}
          <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px]" />
        </div>
      )}

      {/* 2. 7-Color Animated Radial Glow - ONLY active when NO custom background is set */}
      {!hasCustomBackground && (
        <>
          <div
            className="absolute top-[44%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[620px] max-w-[92vw] h-[340px] rounded-full pointer-events-none transition-all duration-1000 ease-in-out"
            style={{
              background: `radial-gradient(ellipse at center, rgba(${activeColor.hex}, ${computedOpacity}) 0%, rgba(${activeColor.hex}, ${computedOpacity * 0.4}) 45%, rgba(${activeColor.hex}, 0) 75%)`,
              filter: 'blur(75px)',
              transform: `translate(-50%, -50%) scale(${isFadingOut ? 0.92 : 1})`,
            }}
          />

          <div
            className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] max-w-[80vw] h-[130px] rounded-full pointer-events-none transition-all duration-1000 ease-in-out"
            style={{
              background: `radial-gradient(ellipse at center, rgba(${activeColor.hex}, ${computedOpacity * 0.7}) 0%, rgba(${activeColor.hex}, 0) 70%)`,
              filter: 'blur(45px)',
            }}
          />
        </>
      )}

      {/* Subtle night-time ambient vignette when night mode is active */}
      {isDimmed && (
        <div className="absolute inset-0 bg-indigo-950/10 transition-opacity duration-1000" />
      )}
    </div>
  );
});
