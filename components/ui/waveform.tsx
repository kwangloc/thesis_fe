"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useWavesurfer } from "@wavesurfer/react";
import WaveSurfer from "wavesurfer.js";
import { cn } from "@/lib/utils";

interface WaveformProps {
  className?: string;
  progress?: number; // 0 to 1
  audioUrl?: string; // Audio URL for Wavesurfer
  audioType?: string; //
  duration?: number; // Duration in seconds for time markers
  onTimeUpdate?: (currentTime: number) => void;
  onReady?: () => void;
  onDurationChange?: (duration: number) => void;
  onSeek?: (time: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  isPlaying?: boolean;
  height?: number;
  segmentRange?: { start: number; end: number } | null;
  onSegmentRangeUsed?: () => void;
  volume?: number; // 0 to 1
  playbackRate?: number; // 0.5 to 2.0
}

export function Waveform({
  className,
  progress = 0,
  audioUrl,
  audioType = 'audio/mp3',
  duration,
  onTimeUpdate,
  onReady,
  onDurationChange,
  onSeek,
  onPlay,
  onPause,
  isPlaying = false,
  height = 64,
  segmentRange,
  onSegmentRangeUsed,
  volume = 0.8,
  playbackRate = 1.0,
}: WaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isWavesurferReady, setIsWavesurferReady] = useState(false);

  const { wavesurfer, isReady, currentTime } = useWavesurfer({
    container: containerRef,
    height,
    waveColor: "#B1B1B1",
    progressColor: "#EE772F",
    cursorColor: "#F6B094",
    barWidth: 2,
    barRadius: 2,
    barGap: 1,
    fillParent: true,
    normalize: true,
    url: audioUrl,
    // media: { type: audioType }, // Removed invalid property
    backend: "WebAudio",
    peaks: undefined, // Let Wavesurfer generate peaks automatically
    interact: true,
    hideScrollbar: true,
    autoCenter: true,
    sampleRate: 8000,
  });
  // For newer WaveSurfer with hooks
  useEffect(() => {
    // This effect runs when the audioUrl changes
    return () => {
      // This cleanup function runs before the next effect or when component unmounts
      if (wavesurfer) {
        wavesurfer.pause();
        // The new instance will be created automatically by the hook
      }
    };
  }, [audioUrl]);

  // Handle when Wavesurfer is ready
  useEffect(() => {
    if (isReady && wavesurfer) {
      setIsWavesurferReady(true);

      // Get actual duration from audio file
      const actualDuration = wavesurfer.getDuration();
      if (actualDuration > 0) {
        onDurationChange?.(actualDuration);
      }

      onReady?.();
    }
  }, [isReady, wavesurfer, onReady, onDurationChange]);

  // Handle time updates
  useEffect(() => {
    if (!wavesurfer) return;

    const handleTimeUpdate = () => {
      const time = wavesurfer.getCurrentTime();
      onTimeUpdate?.(time);
    };

    wavesurfer.on("timeupdate", handleTimeUpdate);

    return () => {
      wavesurfer.un("timeupdate", handleTimeUpdate);
    };
  }, [wavesurfer, onTimeUpdate]);

  // Handle play/pause events
  useEffect(() => {
    if (!wavesurfer) return;

    const handlePlay = () => {
      onPlay?.();
    };

    const handlePause = () => {
      onPause?.();
    };

    wavesurfer.on("play", handlePlay);
    wavesurfer.on("pause", handlePause);

    return () => {
      wavesurfer.un("play", handlePlay);
      wavesurfer.un("pause", handlePause);
    };
  }, [wavesurfer, onPlay, onPause]);

  // Handle seeking
  useEffect(() => {
    if (!wavesurfer) return;

    const handleSeek = (time: number) => {
      onSeek?.(time);
    };

    wavesurfer.on("seeking", handleSeek);

    return () => {
      wavesurfer.un("seeking", handleSeek);
    };
  }, [wavesurfer, onSeek]);

  // Sync playing state
  useEffect(() => {
    if (!wavesurfer || !isWavesurferReady) return;

    if (isPlaying && !wavesurfer.isPlaying()) {
      wavesurfer.play().catch(console.error);
    } else if (!isPlaying && wavesurfer.isPlaying()) {
      wavesurfer.pause();
    }
  }, [isPlaying, wavesurfer, isWavesurferReady]);

  // Sync progress when controlled externally
  useEffect(() => {
    if (!wavesurfer || !isWavesurferReady || !duration) return;

    const expectedTime = progress * duration;
    const currentWavesurferTime = wavesurfer.getCurrentTime();

    // Only seek if there's a significant difference to avoid feedback loops
    if (Math.abs(expectedTime - currentWavesurferTime) > 0.5) {
      wavesurfer.seekTo(progress);
    }
  }, [progress, duration, wavesurfer, isWavesurferReady]);

  // Handle segment range playback
  useEffect(() => {
    if (!wavesurfer || !isWavesurferReady || !segmentRange) return;

    // Play the specific segment range and notify parent
    wavesurfer
      .play(segmentRange.start, segmentRange.end + 0.2)
      .catch(console.error);
    onPlay?.(); // Notify parent that playback has started

    // Clear the segment range after using it
    onSegmentRangeUsed?.();
  }, [segmentRange, wavesurfer, isWavesurferReady, onSegmentRangeUsed, onPlay]);

  // Handle volume changes
  useEffect(() => {
    if (!wavesurfer || !isWavesurferReady) return;

    wavesurfer.setVolume(volume);
  }, [volume, wavesurfer, isWavesurferReady]);

  // Handle playback rate changes
  useEffect(() => {
    if (!wavesurfer || !isWavesurferReady) return;

    wavesurfer.setPlaybackRate(playbackRate);
  }, [playbackRate, wavesurfer, isWavesurferReady]);

  // Handle click events for seeking
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!wavesurfer || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;

      wavesurfer.seekTo(percent);
    },
    [wavesurfer]
  );

  // Fallback to simple progress bar if no audio URL
  if (!audioUrl) {
    return (
      <div
        className={cn(
          "w-full bg-gray-200 rounded overflow-hidden cursor-pointer",
          className
        )}
        style={{ height }}
        onClick={handleClick}
      >
        <div
          className="h-full bg-blue-500 transition-all duration-200"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full transition-opacity hover:opacity-90 cursor-pointer",
        className
      )}
      onClick={handleClick}
    >
      <div ref={containerRef} className="w-full" style={{ height }} />

      {/* Loading indicator */}
      {!isWavesurferReady && (
        <div className="flex items-center justify-center bg-gray-50 rounded">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="ml-2 text-sm text-gray-600">
            Loading waveform...
          </span>
        </div>
      )}
    </div>
  );
}
