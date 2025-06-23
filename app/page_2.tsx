"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { AudioPlayer } from "@/components/audio-player";
import { TranscriptPanel } from "@/components/transcript-panel";
import { InsightsPanel } from "@/components/insights-panel";
import { AudioControls } from "@/components/audio-controls";
import { TranscriptSegment, SummaryPoint } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Home() {
  // File upload state
  const [transcriptData, setTranscriptData] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<any>({});
  const [summaryPoints, setSummaryPoints] = useState<any[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [wordTimings, setWordTimings] = useState<any[]>([]);
  
  // Player state
  const [currentTime, setCurrentTime] = useState(0);
  const [highlightedSegmentIds, setHighlightedSegmentIds] = useState<string[]>([]);
  const [activePointId, setActivePointId] = useState<string>();
  const [searchQuery, setSearchQuery] = useState("");
  const [segmentRange, setSegmentRange] = useState<{
    start: number;
    end: number;
  } | null>(null);

  const audioPlayerRef = useRef<HTMLDivElement>(null);

  // Update audio player height
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

  // File upload handlers
  const handleTranscriptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setTranscriptData(json);
      } catch (error) {
        console.error("Error parsing transcript JSON:", error);
        alert("Invalid JSON format in transcript file");
      }
    };
    reader.readAsText(file);
  };

  const handleSummaryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setSummaryData(json);
        // Transform summary data to the format expected by InsightsPanel
        transformSummaryData(json);
      } catch (error) {
        console.error("Error parsing summary JSON:", error);
        alert("Invalid JSON format in summary file");
      }
    };
    reader.readAsText(file);
  };

  const handleWordTimingsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setWordTimings(json);
      } catch (error) {
        console.error("Error parsing word timings JSON:", error);
        alert("Invalid JSON format in word timings file");
      }
    };
    reader.readAsText(file);
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
  };

  // Transform summary data for UI consumption
  const transformSummaryData = (data: any) => {
    if (!data || !transcriptData.length) return;
    
    // Flatten summary object to array of points with versioning
    const points = Object.entries(data).flatMap(([category, items]: [string, any]) =>
      items.map((item: any, index: number) => {
        const pointId = `${category}-${index}`;
        const originalVersionId = `${pointId}-v1`;
        
        return {
          id: pointId,
          category: category
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l: string) => l.toUpperCase()),
          text: item.info,
          relatedSegmentIds: item.utterance_ids
            .map((utteranceId: string) => {
              // Map utterance IDs to segment IDs
              const transcriptIndex = transcriptData.findIndex(
                (t) => t.utterance_id === utteranceId
              );
              return transcriptIndex !== -1 ? `segment-${transcriptIndex + 1}` : null;
            })
            .filter(Boolean),
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
    
    setSummaryPoints(points);
  };

  // Effect to transform summary data when transcript data changes
  useEffect(() => {
    if (summaryData && Object.keys(summaryData).length > 0 && transcriptData.length > 0) {
      transformSummaryData(summaryData);
    }
  }, [transcriptData, summaryData]);

  // Generate audio data for components
  const audioData = {
    id: "uploaded-consultation",
    title: "Uploaded Consultation",
    url: audioUrl || "/data/fever_stomach.mp3",
    duration: 0, // Will be set by audio element
    speakers: Array.from(
      new Set(transcriptData.length > 0 ? transcriptData.map((item) => item.speaker) : [])
    )
      .map((id) => {
        let role: "doctor" | "patient" | "unknown";
        if (id === "Doctor" || id === "SPEAKER_00") {
          role = "doctor";
        } else if (id === "Patient" || id === "SPEAKER_01") {
          role = "patient";
        } else {
          role = "unknown";
        }
        return {
          id,
          name: id,
          role,
        };
      }),
    transcript: transcriptData.length > 0 
      ? transcriptData.map((item, index) => ({
          id: `segment-${index + 1}`,
          speakerId: item.speaker,
          text: item.text,
          startTime: item.start,
          endTime: item.end,
        }))
      : [],
    summary: summaryPoints,
  };

  // Event handlers
  const handleSegmentClick = (segment: TranscriptSegment) => {
    setHighlightedSegmentIds([]);
    setActivePointId(undefined);
    setCurrentTime(segment.startTime);
    setSegmentRange({
      start: segment.startTime,
      end: segment.endTime,
    });
  };

  const handleSummaryPointClick = (point: SummaryPoint) => {
    if (point.relatedSegmentIds.length > 0) {
      setHighlightedSegmentIds(point.relatedSegmentIds);
      setActivePointId(point.id);

      const relatedSegments = audioData.transcript.filter((segment) =>
        point.relatedSegmentIds.includes(segment.id)
      );

      if (relatedSegments.length > 0) {
        const sortedSegments = relatedSegments.sort(
          (a, b) => a.startTime - b.startTime
        );
        const startTime = sortedSegments[0].startTime;
        const endTime = sortedSegments[sortedSegments.length - 1].endTime;

        setCurrentTime(startTime);
        setSegmentRange({ start: startTime, end: endTime });
      }
    }
  };

  const handleSummaryEdit = (pointId: string, newContent: string) => {
    setSummaryPoints((prevData) =>
      prevData.map((point) => {
        if (point.id === pointId) {
          const newVersionId = `${pointId}-v${point.versions.length + 1}`;
          const newVersions = [
            ...point.versions,
            {
              id: newVersionId,
              content: newContent,
              createdAt: new Date(),
              isOriginal: false,
            },
          ];
          return {
            ...point,
            text: newContent,
            versions: newVersions,
            currentVersionId: newVersionId,
          };
        }
        return point;
      })
    );
  };

  const hasData = audioUrl || transcriptData.length > 0;

  return (
    <div className="h-screen bg-gray-50">
      <main className="max-w-full mx-auto px-4">
        {/* File Upload UI */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow-sm">
          <h2 className="text-xl font-bold mb-3">Upload Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Audio File:</label>
              <input 
                type="file" 
                accept="audio/*" 
                onChange={handleAudioUpload}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Transcript JSON:</label>
              <input 
                type="file" 
                accept=".json" 
                onChange={handleTranscriptUpload}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Summary JSON:</label>
              <input 
                type="file" 
                accept=".json" 
                onChange={handleSummaryUpload}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Word Timings JSON:</label>
              <input 
                type="file" 
                accept=".json" 
                onChange={handleWordTimingsUpload}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>
        </div>

        {/* Audio Player (if audio is available) */}
        {audioUrl && (
          <div ref={audioPlayerRef} className="sticky top-0 z-10 bg-gray-50 pb-6">
            <AudioPlayer
              audioUrl={audioData.url}
              title={audioData.title}
              duration={audioData.duration}
              onTimeUpdate={setCurrentTime}
              onSeek={setCurrentTime}
              wordTimings={wordTimings.length > 0 ? wordTimings : []}
              segmentRange={segmentRange}
              onSegmentRangeUsed={() => setSegmentRange(null)}
            />
          </div>
        )}

        {/* Content panels (if data is available) */}
        {hasData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:h-[calc(100vh-var(--audio-player-height)-150px)]">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col h-[70vh] md:h-full">
            <h2 className="text-2xl font-bold mb-4">Transcript</h2>
            <ScrollArea className="flex-1 h-full overflow-auto pr-4">
              <TranscriptPanel
                transcript={audioData.transcript}
                speakers={audioData.speakers}
                currentTime={currentTime}
                highlightedSegmentIds={highlightedSegmentIds}
                onSegmentClick={handleSegmentClick}
                wordTimings={wordTimings.length > 0 ? wordTimings : []}
              />
            </ScrollArea>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col h-[70vh] md:h-full">
            <h2 className="text-2xl font-bold mb-4">Insights</h2>
            <ScrollArea className="flex-1 h-full overflow-auto pr-4">
              <InsightsPanel
                summary={audioData.summary}
                onSummaryPointClick={handleSummaryPointClick}
                onSummaryEdit={handleSummaryEdit}
                activePointId={activePointId}
              />
            </ScrollArea>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}