"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { AudioPlayer } from "@/components/audio-player";
import { TranscriptPanel } from "@/components/transcript-panel";
import { InsightsPanel } from "@/components/insights-panel";
import { AudioControls } from "@/components/audio-controls";
import { TranscriptSegment, SummaryPoint } from "@/types";

// Import data files
import { feverStomachTranscript } from "@/data/fever_stomach_transcript";
import { feverStomachSummary } from "@/data/fever_stomach_summary";
import { feverStomachWord } from "@/data/fever_stomach_word";

export default function Home() {
  const [currentTime, setCurrentTime] = useState(0);
  const [highlightedSegmentIds, setHighlightedSegmentIds] = useState<string[]>(
    []
  );
  const [activePointId, setActivePointId] = useState<string>();
  const [searchQuery, setSearchQuery] = useState("");
  const [segmentRange, setSegmentRange] = useState<{
    start: number;
    end: number;
  } | null>(null);

  const audioPlayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => {
      if (audioPlayerRef.current) {
        const audioPlayerHeight = audioPlayerRef.current.offsetHeight;
        document.documentElement.style.setProperty(
          "--audio-player-height",
          `${audioPlayerHeight}px`
        );
      }
    }, 300);
  }, []);

  // State for managing summary edits
  const [summaryData, setSummaryData] = useState(() => {
    // Transform data to expected formats with versioning
    return Object.entries(feverStomachSummary).flatMap(([category, items]) =>
      items.map((item, index) => {
        const pointId = `${category}-${index}`;
        const originalVersionId = `${pointId}-v1`;
        return {
          id: pointId,
          category: category
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()),
          text: item.info,
          relatedSegmentIds: item.utterance_ids
            .map((utteranceId) => {
              const transcriptIndex = feverStomachTranscript.findIndex(
                (t) => t.utterance_id === utteranceId
              );
              return `segment-${transcriptIndex + 1}`;
            })
            .filter((id) => id !== "segment-0"), // Filter out invalid mappings
          versions: [
            {
              id: originalVersionId,
              content: item.info,
              createdAt: new Date(),
              isOriginal: true,
            },
          ],
          currentVersionId: originalVersionId,
        };
      })
    );
  });

  const audioData = {
    id: "consultation-fever-stomach",
    title: "Fever and Stomach Pain Consultation",
    url: "/data/fever_stomach.mp3",
    duration: 0, // Will be set automatically from audio file
    // speakers: [
    //   { id: "Doctor", name: "Dr. Smith", role: "doctor" },
    //   { id: "Patient", name: "Mr. McKay", role: "patient" },
    // ],
    speakers: Array.from(
      new Set(feverStomachTranscript.map((item) => item.speaker))
    )
      .map((id) => {
        let role: "doctor" | "patient";
        if (id === "Doctor") {
          role = "doctor";
        } else if (id === "Patient") {
          role = "patient";
        } else {
          // Default to "patient" or handle as needed
          role = "patient";
        }
        return {
          id,
          name: id,
          role,
        };
      }),

    transcript: feverStomachTranscript.map((item, index) => ({
      id: `segment-${index + 1}`,
      speakerId: item.speaker,
      text: item.text,
      startTime: item.start,
      endTime: item.end,
    })),
    summary: summaryData,
  };

  const wordTimings = feverStomachWord;

  const handleSegmentClick = (segment: TranscriptSegment) => {
    // Clear any existing highlights from summary clicks
    setHighlightedSegmentIds([]);
    setActivePointId(undefined);

    // Set current time and trigger audio jump
    setCurrentTime(segment.startTime);

    // Store the segment range for the audio player to use (play just this segment)
    setSegmentRange({
      start: segment.startTime,
      end: segment.endTime,
    });
  };

  const handleSummaryPointClick = (point: SummaryPoint) => {
    if (point.relatedSegmentIds.length > 0) {
      // Highlight all related segments
      setHighlightedSegmentIds(point.relatedSegmentIds);
      setActivePointId(point.id);

      // Find all related segments
      const relatedSegments = audioData.transcript.filter((segment) =>
        point.relatedSegmentIds.includes(segment.id)
      );

      if (relatedSegments.length > 0) {
        // Get start time from first segment and end time from last segment
        const sortedSegments = relatedSegments.sort(
          (a, b) => a.startTime - b.startTime
        );
        const startTime = sortedSegments[0].startTime;
        const endTime = sortedSegments[sortedSegments.length - 1].endTime;

        // Set current time and trigger audio jump
        setCurrentTime(startTime);

        // Store the segment range for the audio player to use
        setSegmentRange({ start: startTime, end: endTime });
      }
    }
  };

  const handleSummaryEdit = (pointId: string, newContent: string) => {
    setSummaryData((prevData) =>
      prevData.map((point) => {
        if (point.id === pointId) {
          // Create new version
          const newVersionId = `${pointId}-v${point.versions.length + 1}`;
          const newVersion = {
            id: newVersionId,
            content: newContent,
            createdAt: new Date(),
            isOriginal: false,
          };

          return {
            ...point,
            text: newContent, // Update the main text field
            versions: [...point.versions, newVersion],
            currentVersionId: newVersionId,
          };
        }
        return point;
      })
    );
  };

  return (
    <div className="h-screen bg-gray-50">
      <main className="max-w-full mx-auto px-4">
        {/* <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{audioData.title}</h1>
          <Button variant="outline">Change Audio</Button>
        </div> */}

        <div ref={audioPlayerRef} className="sticky top-0 z-10 bg-gray-50 pb-6">
          <AudioPlayer
            audioUrl={audioData.url}
            title={audioData.title}
            duration={audioData.duration}
            onTimeUpdate={setCurrentTime}
            onSeek={setCurrentTime}
            wordTimings={wordTimings}
            segmentRange={segmentRange}
            onSegmentRangeUsed={() => setSegmentRange(null)}
          />
        </div>

        {/* <div className="mb-6">
          <AudioControls onSearch={setSearchQuery} />
        </div> */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:h-[calc(100vh-var(--audio-player-height))]">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col overflow-hidden">
            <TranscriptPanel
              transcript={audioData.transcript}
              speakers={audioData.speakers}
              currentTime={currentTime}
              highlightedSegmentIds={highlightedSegmentIds}
              onSegmentClick={handleSegmentClick}
              wordTimings={wordTimings}
            />
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col overflow-hidden">
            <InsightsPanel
              summary={audioData.summary}
              onSummaryPointClick={handleSummaryPointClick}
              onSummaryEdit={handleSummaryEdit}
              activePointId={activePointId}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
