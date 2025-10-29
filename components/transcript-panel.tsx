"use client";

import React, { useState, useEffect, useRef } from "react";
import { Speaker, TranscriptSegment } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { RotateCcw, Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  setAutoScrollEnabled,
  setUserHasScrolled,
  toggleAutoScroll,
} from "@/lib/store/transcriptSlice";

interface TranscriptPanelProps {
  transcript: TranscriptSegment[];
  speakers: Speaker[];
  currentTime: number;
  highlightedSegmentId?: string;
  highlightedSegmentIds?: string[];
  onSegmentClick: (segment: TranscriptSegment) => void;
  wordTimings?: Array<{ word: string; start: number; end: number }>;
}

export function TranscriptPanel({
  transcript,
  speakers,
  currentTime,
  highlightedSegmentId,
  highlightedSegmentIds = [],
  onSegmentClick,
  wordTimings = [],
}: TranscriptPanelProps) {
  const dispatch = useAppDispatch();
  const { autoScrollEnabled, userHasScrolled } = useAppSelector(
    (state) => state.transcript
  );

  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const segmentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lastScrollTime = useRef<number>(0);
  const autoScrollInProgress = useRef<boolean>(false);
  const programmaticScrollTimeout = useRef<NodeJS.Timeout | null>(null);

  const filteredTranscript = transcript;

  // Helper function to mark programmatic scroll
  const markProgrammaticScroll = () => {
    autoScrollInProgress.current = true;
    lastScrollTime.current = Date.now();

    // Clear any existing timeout
    if (programmaticScrollTimeout.current) {
      clearTimeout(programmaticScrollTimeout.current);
    }

    // Set timeout to reset flag after scroll completes
    programmaticScrollTimeout.current = setTimeout(() => {
      autoScrollInProgress.current = false;
    }, 1000); // Increased timeout for safety
  };

  // Helper function to scroll within the transcript panel only
  const scrollToSegment = (segmentId: string) => {
    const segmentElement = segmentRefs.current[segmentId];
    const scrollArea = scrollAreaRef.current;

    if (!segmentElement || !scrollArea) return;

    const scrollViewport = scrollArea.querySelector(
      "[data-radix-scroll-area-viewport]"
    );
    if (!scrollViewport) return;

    markProgrammaticScroll();

    // Get the position of the segment relative to the scroll container
    const segmentRect = segmentElement.getBoundingClientRect();
    const scrollRect = scrollViewport.getBoundingClientRect();

    // Calculate the scroll position to center the segment
    const scrollTop = scrollViewport.scrollTop;
    const targetScrollTop =
      scrollTop +
      segmentRect.top -
      scrollRect.top -
      scrollRect.height / 2 +
      segmentRect.height / 2;

    // Smooth scroll within the ScrollArea only
    scrollViewport.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: "smooth",
    });
  };

  // Detect user manual scrolling
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    const handleScroll = () => {
      // Only treat as user scroll if we're not in the middle of programmatic scroll
      if (!autoScrollInProgress.current && autoScrollEnabled) {
        dispatch(setUserHasScrolled(true));
        dispatch(setAutoScrollEnabled(false));
      }
    };

    const scrollElement = scrollArea.querySelector(
      "[data-radix-scroll-area-viewport]"
    );
    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll, { passive: true });
      return () => {
        scrollElement.removeEventListener("scroll", handleScroll);
        // Clean up timeout on unmount
        if (programmaticScrollTimeout.current) {
          clearTimeout(programmaticScrollTimeout.current);
        }
      };
    }
  }, [autoScrollEnabled, dispatch]);

  // Find the active segment based on current time
  useEffect(() => {
    const currentSegment = transcript.find(
      (segment) =>
        currentTime >= segment.startTime && currentTime <= segment.endTime
    );

    if (currentSegment) {
      setActiveSegmentId(currentSegment.id);

      // Only auto-scroll if enabled and user hasn't manually scrolled
      if (autoScrollEnabled && !userHasScrolled) {
        scrollToSegment(currentSegment.id);
      }
    }
  }, [currentTime, transcript, autoScrollEnabled, userHasScrolled]);

  // Scroll to highlighted segment when it changes (always enabled for summary clicks)
  useEffect(() => {
    if (highlightedSegmentId) {
      scrollToSegment(highlightedSegmentId);
    }
  }, [highlightedSegmentId]);

  const handleToggleAutoScroll = () => {
    dispatch(toggleAutoScroll());

    // If enabling auto-scroll, immediately scroll to current segment
    if (!autoScrollEnabled) {
      const currentSegment = transcript.find(
        (segment) =>
          currentTime >= segment.startTime && currentTime <= segment.endTime
      );
      if (currentSegment) {
        scrollToSegment(currentSegment.id);
      }
    }
  };

  const handleGoToCurrentSegment = () => {
    const currentSegment = transcript.find(
      (segment) =>
        currentTime >= segment.startTime && currentTime <= segment.endTime
    );
    if (currentSegment) {
      scrollToSegment(currentSegment.id);
    }
  };

  const getSpeakerById = (id: string) => {
    return speakers.find((speaker) => speaker.id === id);
  };

  // Get current word being spoken
  const getCurrentWord = () => {
    if (!wordTimings) return null;
    return wordTimings.find(
      (word) => currentTime >= word.start && currentTime <= word.end
    );
  };

  // Highlight current word in text (only the specific occurrence in the current segment)
  const highlightCurrentWord = (text: string, segment: TranscriptSegment) => {
    const currentWord = getCurrentWord();
    if (!currentWord) return text;

    // Check if the current word belongs to this segment by time range
    // Allow for small timing overlaps by checking if the word overlaps with the segment
    const wordBelongsToSegment =
      (currentWord.start >= segment.startTime &&
        currentWord.start <= segment.endTime) ||
      (currentWord.end >= segment.startTime &&
        currentWord.end <= segment.endTime) ||
      (currentWord.start <= segment.startTime &&
        currentWord.end >= segment.endTime);

    if (!wordBelongsToSegment) return text;

    // Get all words that belong to this segment, sorted by start time
    const segmentWords = wordTimings
      .filter(
        (word) =>
          (word.start >= segment.startTime && word.start <= segment.endTime) ||
          (word.end >= segment.startTime && word.end <= segment.endTime) ||
          (word.start <= segment.startTime && word.end >= segment.endTime)
      )
      .sort((a, b) => a.start - b.start);

    // Find which occurrence of this word the current word is
    const cleanCurrentWord = currentWord.word
      .replace(/[^\w\s]/g, "")
      .toLowerCase();
    const sameWords = segmentWords.filter(
      (word) =>
        word.word.replace(/[^\w\s]/g, "").toLowerCase() === cleanCurrentWord
    );

    const currentWordIndex = sameWords.findIndex(
      (word) => word.start === currentWord.start && word.end === currentWord.end
    );

    if (currentWordIndex === -1) return text;

    // The occurrence number (1-based)
    const occurrenceNumber = currentWordIndex + 1;

    // Clean the word by removing punctuation and converting to lowercase for matching
    const cleanWord = currentWord.word.replace(/[^\w\s]/g, "").toLowerCase();
    if (!cleanWord) return text;

    // Create multiple regex patterns to catch different variations
    const patterns = [
      // Exact word match with word boundaries
      `\\b${currentWord.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      // Clean word match with word boundaries
      `\\b${cleanWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      // Clean word match without strict word boundaries (for contractions, etc.)
      cleanWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    ];

    let highlightedText = text;

    // Try each pattern until we find a match
    for (const pattern of patterns) {
      const wordRegex = new RegExp(pattern, "gi");
      const matches: RegExpExecArray[] = [];
      let match;

      // Collect all matches manually for compatibility
      while ((match = wordRegex.exec(text)) !== null) {
        matches.push(match);
        if (!wordRegex.global) break;
      }

      if (matches.length >= occurrenceNumber) {
        // Replace only the specific occurrence
        const targetMatch = matches[occurrenceNumber - 1];
        const beforeMatch = text.substring(0, targetMatch.index);
        const matchText = targetMatch[0];
        const afterMatch = text.substring(targetMatch.index + matchText.length);

        highlightedText =
          beforeMatch +
          `<span class="text-[#ee782ffd] rounded font-bold">${matchText}</span>` +
          afterMatch;
        break;
      }
    }

    return highlightedText;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center p-2 border-b border-gray-400 bg-orange-100">
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold">Transcript</h2>
          <span className="">(Click on each utterance to play)</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGoToCurrentSegment}
            className="text-xs"
            title="Go to current audio position"
          >
            <RotateCcw size={14} className="mr-1" />
            Current
          </Button>
          <Button
            variant={autoScrollEnabled ? "default" : "outline"}
            size="sm"
            onClick={handleToggleAutoScroll}
            className="text-xs"
            title={
              autoScrollEnabled ? "Disable auto-scroll" : "Enable auto-scroll"
            }
          >
            {autoScrollEnabled ? (
              <>
                <Unlock size={14} className="mr-1" />
                Auto
              </>
            ) : (
              <>
                <Lock size={14} className="mr-1" />
                Manual
              </>
            )}
          </Button>
        </div>
      </div>

      <ScrollArea ref={scrollAreaRef} className="flex-1">
        <div className="">
          {filteredTranscript.map((segment) => {
            const speaker = getSpeakerById(segment.speakerId);
            const isActive = activeSegmentId === segment.id;
            const isHighlighted =
              highlightedSegmentId === segment.id ||
              highlightedSegmentIds.includes(segment.id);
            return (
              <div
                key={segment.id}
                id={segment.id}
                ref={(el) => {
                  segmentRefs.current[segment.id] = el;
                }}
                className={cn(
                  "transition-all duration-200 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-md",
                  isActive && "bg-blue-100 rounded-md",
                  isHighlighted && "bg-[#ff6f1639] rounded-md"
                )}
                onClick={() => onSegmentClick(segment)}
              >
                <div className="">
                  <span
                    className={cn(
                    "font-semibold text-lg",
                    speaker?.role === "doctor"
                      ? "text-[#a53860]"
                      : speaker?.role === "patient"
                      ? "text-[#0077b6]"
                      : "text-gray-500"
                  )}
                  >
                    {speaker?.role === "doctor"
                      ? "Doctor"
                      : speaker?.role === "patient"
                      ? "Patient"
                      : "Unknown"}
                  </span>
                </div>
                <p
                  className="text-gray-800 text-base"
                  dangerouslySetInnerHTML={{
                    __html: highlightCurrentWord(segment.text, segment),
                  }}
                />
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
