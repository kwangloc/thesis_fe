"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Waveform } from "@/components/ui/waveform";
import { formatTime } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// interface AudioPlayerProps {
//   audioUrl: string;
//   audioType?: string; // Add this prop
//   title: string;
//   duration: number;
//   onTimeUpdate?: (currentTime: number) => void;
//   onPlay?: () => void;
//   onPause?: () => void;
//   onSeek?: (time: number) => void;
//   wordTimings?: Array<{ word: string; start: number; end: number }>;
//   segmentRange?: { start: number; end: number } | null;
//   onSegmentRangeUsed?: () => void;
// }

interface AudioPlayerProps {
  audioUrl: string;
  audioType: string;
  title: string;
  duration: number;
  onTimeUpdate: (time: number) => void;
  onSeek: (time: number) => void;
  wordTimings?: any[];
  segmentRange?: { start: number; end: number } | null;
  onSegmentRangeUsed?: () => void;
  isPlaying?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
}

export function AudioPlayer({
  audioUrl,
  audioType = 'audio/mpeg', // Default to MP3
  title,
  duration,
  onTimeUpdate,
  onPlay,
  onPause,
  onSeek,
  wordTimings,
  segmentRange,
  onSegmentRangeUsed,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [actualDuration, setActualDuration] = useState(duration);
  const [volume, setVolume] = useState(() => {
    if (typeof window !== "undefined") {
      const savedVolume = localStorage.getItem("healthscribe-volume");
      return savedVolume ? parseFloat(savedVolume) : 0.8;
    }
    return 0.8;
  });
  const [playbackRate, setPlaybackRate] = useState(() => {
    if (typeof window !== "undefined") {
      const savedRate = localStorage.getItem("healthscribe-playback-rate");
      return savedRate ? parseFloat(savedRate) : 1.0;
    }
    return 1.0;
  });
  const [isLoading, setIsLoading] = useState(false);

  const progress = actualDuration > 0 ? currentTime / actualDuration : 0;

  useEffect(() => {
    // When audio URL changes:
    // 1. Pause any current playback by updating state
    setIsPlaying(false);

    // 2. Reset internal state
    setCurrentTime(0);

    // The audio element or waveform will load the new source
    // when it detects the URL prop has changed
  }, [audioUrl]);

  // Set actual duration from props when component mounts (only if duration is provided)
  useEffect(() => {
    if (duration > 0) {
      setActualDuration(duration);
    }
  }, [duration]);

  // Persist volume to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("healthscribe-volume", volume.toString());
    }
  }, [volume]);

  // Persist playback rate to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "healthscribe-playback-rate",
        playbackRate.toString()
      );
    }
  }, [playbackRate]);

  // Handle duration update when waveform is ready
  const handleWaveformReady = () => {
    setIsLoading(false);
  };

  // Handle when actual duration is detected from audio file
  const handleDurationChange = (newDuration: number) => {
    setActualDuration(newDuration);
  };

  // Handle time updates from Waveform component
  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
    onTimeUpdate?.(time);
  };

  // Handle when playback ends
  const handlePlayEnd = () => {
    setIsPlaying(false);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (isPlaying) {
      onPause?.();
    } else {
      onPlay?.();
    }
  };

  const handleSeek = (newValue: number[]) => {
    const newTime = newValue[0];
    setCurrentTime(newTime);
    onSeek?.(newTime);
  };

  const skipBackward = () => {
    const newTime = Math.max(0, currentTime - 10);
    setCurrentTime(newTime);
    onSeek?.(newTime);
  };

  const skipForward = () => {
    const newTime = Math.min(actualDuration, currentTime + 10);
    setCurrentTime(newTime);
    onSeek?.(newTime);
  };

  const getCurrentWord = () => {
    if (!wordTimings) return null;
    return wordTimings.find(
      (word) => currentTime >= word.start && currentTime <= word.end
    );
  };

  const getMedicalTerms = () => {
    // Simple medical term detection - in production this would use more sophisticated NLP
    const medicalKeywords = [
      "temperature",
      "fever",
      "medicine",
      "doctor",
      "symptoms",
      "nauseous",
      "vomited",
      "diarrhea",
      "poisoning",
      "degrees",
    ];
    return (
      wordTimings?.filter((word) =>
        medicalKeywords.some((term) =>
          word.word.toLowerCase().includes(term.toLowerCase())
        )
      ) || []
    );
  };

  const currentWord = getCurrentWord();
  const medicalTerms = getMedicalTerms();
  const isMedicalTerm =
    currentWord &&
    medicalTerms.some(
      (term) => term.word.toLowerCase() === currentWord.word.toLowerCase()
    );

  return (
    <div className="w-full bg-white p-6 py-4 rounded-lg shadow-sm border border-gray-100">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="text-sm text-blue-600 mt-1 min-h-[1.25rem]">
              {currentWord ? (
                <>Currently speaking: &ldquo;{currentWord.word}&rdquo;</>
              ) : (
                <span className="text-transparent">
                  Currently speaking: &ldquo;placeholder&rdquo;
                </span>
              )}
            </p>
          </div>
          {wordTimings && (
            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
              <strong>Word-level timing available:</strong> {wordTimings.length}{" "}
              words tracked
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="relative w-full">
            <Waveform
              progress={progress}
              duration={actualDuration}
              audioUrl={audioUrl}
              audioType={audioType}
              onTimeUpdate={handleTimeUpdate}
              onReady={handleWaveformReady}
              onDurationChange={handleDurationChange}
              onSeek={(time) => {
                setCurrentTime(time);
                onSeek?.(time);
              }}
              onPlay={() => {
                setIsPlaying(true);
                onPlay?.();
              }}
              onPause={() => {
                setIsPlaying(false);
                onPause?.();
              }}
              isPlaying={isPlaying}
              height={64}
              segmentRange={segmentRange}
              onSegmentRangeUsed={onSegmentRangeUsed}
              volume={volume}
              playbackRate={playbackRate}
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={skipBackward}
              aria-label="Skip backward 10 seconds"
              disabled={isLoading}
            >
              <SkipBack size={16} />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={togglePlayPause}
              aria-label={isPlaying ? "Pause" : "Play"}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause size={16} />
              ) : (
                <Play size={16} />
              )}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={skipForward}
              aria-label="Skip forward 10 seconds"
              disabled={isLoading}
            >
              <SkipForward size={16} />
            </Button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings size={16} className="mr-2" />
                {playbackRate}x
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                <DropdownMenuItem
                  key={rate}
                  onClick={() => setPlaybackRate(rate)}
                  className={playbackRate === rate ? "bg-blue-50" : ""}
                >
                  {rate}x Speed
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center space-x-2">
            <Volume2 size={16} className="text-gray-500" />
            <Slider
              className="w-24"
              defaultValue={[volume * 100]}
              max={100}
              step={1}
              onValueChange={(value) => setVolume(value[0] / 100)}
            />
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {formatTime(currentTime)} / {formatTime(actualDuration)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
