import React, { useEffect, useRef, useState } from 'react';
import { Activity, Volume2, VolumeX, Mic } from 'lucide-react';

interface AudioWaveformVisualizerProps {
  stream?: MediaStream | null;
  isListening: boolean;
  variant?: 'bars' | 'wave' | 'compact' | 'mini';
  barCount?: number;
  height?: number;
  className?: string;
  showVolumeMeter?: boolean;
  activeThreshold?: number; // Volume threshold (0-1) to transition color (default: 0.12)
  peakThreshold?: number; // High volume threshold (0-1) for peak energy (default: 0.55)
}

export const AudioWaveformVisualizer: React.FC<AudioWaveformVisualizerProps> = ({
  stream,
  isListening,
  variant = 'bars',
  barCount = 24,
  height = 36,
  className = '',
  showVolumeMeter = true,
  activeThreshold = 0.12,
  peakThreshold = 0.55,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const [volumePercent, setVolumePercent] = useState<number>(0);
  const [peakLevel, setPeakLevel] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isThresholdReached, setIsThresholdReached] = useState<boolean>(false);

  // Smooth value storage for physics-based fluid animation
  const smoothValuesRef = useRef<number[]>(new Array(barCount).fill(0.1));
  const smoothVolumeRef = useRef<number>(0);

  useEffect(() => {
    if (!isListening) {
      // Cleanup Web Audio nodes when not listening
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.disconnect();
        } catch {
          // ignore
        }
        sourceNodeRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          audioContextRef.current.close();
        } catch {
          // ignore
        }
        audioContextRef.current = null;
      }
      setVolumePercent(0);
      setPeakLevel(0);
      setIsSpeaking(false);
      return;
    }

    let analyser: AnalyserNode | null = null;
    let dataArray: Uint8Array | null = null;
    let timeDomainArray: Uint8Array | null = null;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx && stream && stream.active && stream.getAudioTracks().length > 0) {
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const source = ctx.createMediaStreamSource(stream);
        sourceNodeRef.current = source;

        analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.75;
        analyser.minDecibels = -90;
        analyser.maxDecibels = -10;

        source.connect(analyser);
        analyserRef.current = analyser;

        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        timeDomainArray = new Uint8Array(bufferLength);
      }
    } catch (err) {
      console.warn('Web Audio API stream initialization note:', err);
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let tick = 0;

    const render = () => {
      tick++;
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      let currentVolume = 0;
      let rawValues: number[] = [];

      if (analyser && dataArray && timeDomainArray) {
        analyser.getByteFrequencyData(dataArray as any);
        analyser.getByteTimeDomainData(timeDomainArray as any);

        // Compute RMS Volume from time domain
        let sumSquares = 0;
        for (let i = 0; i < timeDomainArray.length; i++) {
          const norm = (timeDomainArray[i] - 128) / 128;
          sumSquares += norm * norm;
        }
        const rms = Math.sqrt(sumSquares / timeDomainArray.length);
        currentVolume = Math.min(1, rms * 4.2); // Boost gain for visual feedback

        // Map frequency bands across barCount
        const binStep = Math.max(1, Math.floor(dataArray.length / barCount));
        for (let b = 0; b < barCount; b++) {
          const binIndex = Math.min(b * binStep, dataArray.length - 1);
          const val = dataArray[binIndex] / 255;
          rawValues.push(val);
        }
      } else {
        // Fallback simulation when direct stream is not accessible
        const pulse = (Math.sin(tick * 0.08) + 1) * 0.5;
        currentVolume = 0.15 + pulse * 0.35;

        for (let b = 0; b < barCount; b++) {
          const noise = Math.sin(tick * 0.1 + b * 0.4) * 0.5 + 0.5;
          const harmonic = Math.cos(tick * 0.05 + b * 0.2) * 0.5 + 0.5;
          rawValues.push((noise * 0.6 + harmonic * 0.4) * currentVolume);
        }
      }

      // Smooth interpolation for silky physics
      smoothVolumeRef.current += (currentVolume - smoothVolumeRef.current) * 0.25;
      const displayVol = Math.round(smoothVolumeRef.current * 100);
      setVolumePercent(displayVol);
      
      const isOverThreshold = smoothVolumeRef.current >= activeThreshold;
      setIsSpeaking(smoothVolumeRef.current > 0.05);
      setIsThresholdReached(isOverThreshold);

      setPeakLevel((prev) => {
        const next = Math.max(prev * 0.95, displayVol);
        return Math.round(next);
      });

      // Update smooth bars
      const numBars = smoothValuesRef.current.length;
      for (let i = 0; i < numBars; i++) {
        const target = rawValues[i] || 0;
        smoothValuesRef.current[i] += (target - smoothValuesRef.current[i]) * 0.3;
      }

      const curVol = smoothVolumeRef.current;

      // DRAWING LOGIC BASED ON VARIANT
      if (variant === 'bars' || variant === 'compact' || variant === 'mini') {
        const barWidth = Math.max(2, (width - (numBars - 1) * 2.5) / numBars);
        const gap = 2.5;

        // Dynamic Glow on Threshold Reached
        if (curVol >= peakThreshold) {
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 10;
        } else if (curVol >= activeThreshold) {
          ctx.shadowColor = '#34d399';
          ctx.shadowBlur = 8;
        } else {
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
        }

        for (let i = 0; i < numBars; i++) {
          const val = smoothValuesRef.current[i];
          const minH = 3;
          const barH = Math.max(minH, val * (height - 4));
          const x = i * (barWidth + gap);
          const y = (height - barH) / 2;

          // Vibrant reactive gradient based on volume threshold
          const grad = ctx.createLinearGradient(0, y, 0, y + barH);

          if (curVol >= peakThreshold) {
            // Peak / High Energy: Amber Gold to Emerald to Coral Red
            grad.addColorStop(0, '#fbbf24'); // Gold
            grad.addColorStop(0.5, '#34d399'); // Emerald
            grad.addColorStop(1, '#f43f5e'); // Coral rose
          } else if (curVol >= activeThreshold) {
            // Threshold exceeded (Active Voice): Bright Emerald & Mint Green
            grad.addColorStop(0, '#6ee7b7'); // Mint green
            grad.addColorStop(0.5, '#10b981'); // Emerald
            grad.addColorStop(1, '#059669'); // Deep emerald
          } else if (curVol > 0.04) {
            // Low / Sub-threshold: Cyan to Sky Blue
            grad.addColorStop(0, '#38bdf8'); // Sky blue
            grad.addColorStop(1, '#2563eb'); // Royal blue
          } else {
            // Ambient idle: Soft slate blue
            grad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
            grad.addColorStop(1, 'rgba(99, 102, 241, 0.25)');
          }

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barH, [barWidth / 2]);
          ctx.fill();

          // Peak dot caps for 'bars' variant
          if (variant === 'bars' && val > 0.25) {
            ctx.fillStyle = curVol >= activeThreshold ? '#ffffff' : '#93c5fd';
            ctx.beginPath();
            ctx.arc(x + barWidth / 2, y - 2, 1, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.shadowBlur = 0; // Reset shadow
      } else if (variant === 'wave') {
        // Continuous fluid wave / oscilloscope
        ctx.beginPath();
        const sliceWidth = width / (numBars - 1);
        ctx.moveTo(0, height / 2);

        for (let i = 0; i < numBars; i++) {
          const val = smoothValuesRef.current[i];
          const offset = (val - 0.5) * (height * 0.85);
          const x = i * sliceWidth;
          const y = height / 2 + offset;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            const prevX = (i - 1) * sliceWidth;
            const prevY = height / 2 + (smoothValuesRef.current[i - 1] - 0.5) * (height * 0.85);
            const cx = (prevX + x) / 2;
            const cy = (prevY + y) / 2;
            ctx.quadraticCurveTo(prevX, prevY, cx, cy);
          }
        }

        ctx.lineTo(width, height / 2);

        // Dynamic stroke & glow based on threshold
        if (curVol >= peakThreshold) {
          ctx.strokeStyle = '#fbbf24'; // Amber Gold
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 12;
        } else if (curVol >= activeThreshold) {
          ctx.strokeStyle = '#10b981'; // Emerald Green
          ctx.shadowColor = '#34d399';
          ctx.shadowBlur = 10;
        } else {
          ctx.strokeStyle = '#38bdf8'; // Blue
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 4;
        }

        ctx.lineWidth = curVol >= activeThreshold ? 3 : 2.5;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.disconnect();
        } catch {
          // ignore
        }
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          audioContextRef.current.close();
        } catch {
          // ignore
        }
      }
    };
  }, [isListening, stream, variant, barCount, height, activeThreshold, peakThreshold]);

  // Handle High-DPI canvas resolution
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const displayWidth = rect.width || (barCount * 6 + 10);
    const displayHeight = height;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  }, [barCount, height]);

  if (!isListening) return null;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Live Canvas Waveform Container with Reactive Glow Frame */}
      <div
        className={`relative flex items-center bg-black/50 rounded-xl px-2.5 py-1 border transition-all duration-200 backdrop-blur-xs ${
          isThresholdReached
            ? 'border-emerald-400/80 shadow-[0_0_16px_rgba(52,211,153,0.35)] ring-2 ring-emerald-500/20'
            : 'border-white/10 shadow-inner'
        }`}
      >
        <canvas
          ref={canvasRef}
          style={{ height: `${height}px` }}
          className="w-full min-w-[120px] max-w-[240px] block"
        />

        {/* Live Audio Activity Glowing Dot */}
        <span
          className={`absolute right-1.5 top-1.5 w-2 h-2 rounded-full transition-all duration-150 ${
            volumePercent > peakThreshold * 100
              ? 'bg-amber-400 shadow-[0_0_10px_#fbbf24] scale-125 animate-ping'
              : isThresholdReached
              ? 'bg-emerald-400 shadow-[0_0_8px_#34d399] scale-125'
              : isSpeaking
              ? 'bg-sky-400 shadow-[0_0_6px_#38bdf8] scale-100'
              : 'bg-gray-500 opacity-30'
          }`}
          title={
            volumePercent > peakThreshold * 100
              ? 'ピーク音量検出'
              : isThresholdReached
              ? '発話音量（適正レベル検出中）'
              : '待機中'
          }
        />
      </div>

      {/* Volume Level Meter & dB indicator */}
      {showVolumeMeter && (
        <div className="flex flex-col justify-center min-w-[68px]">
          <div className="flex items-center justify-between text-[10px] font-mono leading-none mb-1">
            <span className="flex items-center gap-1 text-gray-300">
              {volumePercent > 5 ? (
                <Volume2
                  size={11}
                  className={
                    isThresholdReached
                      ? 'text-emerald-400 animate-pulse'
                      : isSpeaking
                      ? 'text-sky-400'
                      : 'text-gray-400'
                  }
                />
              ) : (
                <VolumeX size={11} className="text-gray-500" />
              )}
              <span className={isThresholdReached ? 'text-emerald-300 font-bold' : 'text-gray-300'}>
                {volumePercent}%
              </span>
            </span>
            <span
              className={`text-[9px] font-bold px-1 rounded transition-colors ${
                volumePercent > peakThreshold * 100
                  ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                  : isThresholdReached
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-xs'
                  : isSpeaking
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/20'
                  : 'text-gray-500'
              }`}
            >
              {volumePercent > peakThreshold * 100 ? 'PEAK' : isThresholdReached ? 'VOICE' : isSpeaking ? 'LOW' : 'IDLE'}
            </span>
          </div>

          {/* Mini Horizontal Peak Progress Bar */}
          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden flex">
            <div
              className={`h-full transition-all duration-75 rounded-full ${
                volumePercent > peakThreshold * 100
                  ? 'bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                  : isThresholdReached
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-300 shadow-[0_0_6px_rgba(52,211,153,0.5)]'
                  : 'bg-gradient-to-r from-blue-500 to-sky-400'
              }`}
              style={{ width: `${Math.max(4, Math.min(100, volumePercent))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
