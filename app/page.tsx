"use client";

import { useEffect, useRef, useState } from "react";
import { AudioPlayer } from "@/components/audio-player";
import { TranscriptPanel } from "@/components/transcript-panel";
import { InsightsPanel } from "@/components/insights-panel";
import { TranscriptSegment, SummaryPoint } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Define conversation data structure with file paths
interface ConversationFiles {
  name: string;
  transcriptPath: string;
  wordTranscriptPath: string;
  summaryPath: string;
  audioPath: string;
}

// Available conversations with their file paths
const AVAILABLE_CONVERSATIONS: ConversationFiles[] = [
  {
    name: "Fever Stomach",
    transcriptPath: "/data/transcript/fever_stomach_transcript.json",
    wordTranscriptPath: "/data/transcript_word/fever_stomach_word.json",
    summaryPath: "/data/summary/fever_stomach_summary.json",
    audioPath: "/data/audio/fever_stomach.mp3"
  },
  {
    name: "Sick",
    transcriptPath: "/data/transcript/sick_transcript.json",
    wordTranscriptPath: "/data/transcript_word/sick_word.json",
    summaryPath: "/data/summary/sick_summary.json",
    audioPath: "/data/audio/sick.mp3"
  },
];

export default function Home() {
  // State for selected conversation
  const [selectedConversation, setSelectedConversation] = useState<string>(AVAILABLE_CONVERSATIONS[0].name);
  
  // Data state
  const [transcriptData, setTranscriptData] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<any>({});
  const [wordTimings, setWordTimings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Player state
  const [currentTime, setCurrentTime] = useState(0);
  const [highlightedSegmentIds, setHighlightedSegmentIds] = useState<string[]>([]);
  const [activePointId, setActivePointId] = useState<string>();
  const [segmentRange, setSegmentRange] = useState<{
    start: number;
    end: number;
  } | null>(null);

  // Transformed summary data
  const [summaryPoints, setSummaryPoints] = useState<any[]>([]);

  const audioPlayerRef = useRef<HTMLDivElement>(null);

  // Get the selected conversation details
  const getSelectedConversation = () => {
    return AVAILABLE_CONVERSATIONS.find(conv => conv.name === selectedConversation) || AVAILABLE_CONVERSATIONS[0];
  };

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

  // Load data when conversation changes
  useEffect(() => {
    const loadConversationData = async () => {
      setIsLoading(true);
      
      const conversation = getSelectedConversation();
      
      try {
        // Load transcript
        const transcriptResponse = await fetch(conversation.transcriptPath);
        if (!transcriptResponse.ok) throw new Error(`Failed to load transcript from ${conversation.transcriptPath}`);
        const transcriptJson = await transcriptResponse.json();
        setTranscriptData(Array.isArray(transcriptJson) ? transcriptJson : []);
        
        // Load summary
        const summaryResponse = await fetch(conversation.summaryPath);
        if (!summaryResponse.ok) throw new Error(`Failed to load summary from ${conversation.summaryPath}`);
        const summaryJson = await summaryResponse.json();
        setSummaryData(summaryJson);
        
        // Load word timings
        const wordTimingsResponse = await fetch(conversation.wordTranscriptPath);
        if (!wordTimingsResponse.ok) throw new Error(`Failed to load word timings from ${conversation.wordTranscriptPath}`);
        const wordTimingsJson = await wordTimingsResponse.json();
        setWordTimings(Array.isArray(wordTimingsJson) ? wordTimingsJson : []);
      } catch (error) {
        console.error("Error loading conversation data:", error);
        // Reset data on error
        setTranscriptData([]);
        setSummaryData({});
        setWordTimings([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadConversationData();
  }, [selectedConversation]);

  // Transform summary data for UI consumption
  useEffect(() => {
    if (!summaryData || !Object.keys(summaryData).length || !transcriptData.length) {
      setSummaryPoints([]);
      return;
    }
    
    try {
    // Safely transform summary data
    const points = Object.entries(summaryData).flatMap(([category, items]: [string, any]) => {
      // Check if items is an array
      if (!Array.isArray(items)) {
        console.warn(`Category "${category}" does not contain an array. Skipping.`);
        return [];
      }
      
      return items.map((item: any, index: number) => {
        const pointId = `${category}-${index}`;
        const originalVersionId = `${pointId}-v1`;
        
        // Make sure utterance_ids exists and is an array
        const utteranceIds = Array.isArray(item.utterance_ids) ? item.utterance_ids : [];
        
        return {
          id: pointId,
          category: category
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l: string) => l.toUpperCase()),
          text: item.info || "",
          // *** FIXED MAPPING LOGIC HERE ***
          relatedSegmentIds: utteranceIds
            .map((utteranceId: string) => {
              // Find the transcript segment index by matching utterance_id
              const segmentIndex = transcriptData.findIndex(
                segment => segment.utterance_id === utteranceId
              );
              
              // If found, return the segment ID format used in the app
              return segmentIndex !== -1 ? `segment-${segmentIndex + 1}` : null;
            })
            .filter(Boolean),
          versions: [
            {
              id: originalVersionId,
              content: item.info || "",
              createdAt: new Date(),
              isOriginal: true,
            },
          ],
          currentVersionId: originalVersionId,
        };
      });
    });
    
    setSummaryPoints(points);
  } catch (error) {
    console.error("Error transforming summary data:", error);
    setSummaryPoints([]);
  }
}, [transcriptData, summaryData]);

  // Generate audio data for components
  const selectedConversationDetails = getSelectedConversation();
  const audioData = {
    id: "consultation",
    title: selectedConversation,
    url: selectedConversationDetails.audioPath,
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

  return (
  <div className="h-screen overflow-hidden bg-gray-50">
    <main className="h-full flex flex-col max-w-full mx-auto px-4">
      {/* Conversation Selection UI */}
      <div className="mb-4 p-4 bg-white rounded-lg shadow-sm flex-shrink-0 flex items-center">
        <h2 className="text-xl font-bold m-0 mr-4">Select Conversation:</h2>
        <div className="w-64">
          <Select 
            value={selectedConversation} 
            onValueChange={setSelectedConversation}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select conversation" />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_CONVERSATIONS.map(conv => (
                <SelectItem key={conv.name} value={conv.name}>
                  {conv.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex-1 flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Content when data is loaded */}
      {!isLoading && (
        <>
          {/* Audio Player */}
          <div ref={audioPlayerRef} className="sticky top-0 z-10 bg-gray-50 pb-2 flex-shrink-0">
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

          {/* Content panels - This now fills the remaining height */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-hidden min-h-0">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-hidden">
              {/* <h2 className="text-2xl font-bold mb-2 flex-shrink-0">Transcript</h2> */}
              <ScrollArea className="flex-1 min-h-0 pr-4">
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

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-hidden">
              {/* <h2 className="text-2xl font-bold mb-2 flex-shrink-0">Insights</h2> */}
              <ScrollArea className="flex-1 min-h-0 pr-4">
                <InsightsPanel
                  summary={audioData.summary}
                  onSummaryPointClick={handleSummaryPointClick}
                  onSummaryEdit={handleSummaryEdit}
                  activePointId={activePointId}
                />
              </ScrollArea>
            </div>
          </div>
        </>
      )}
    </main>
  </div>
);
}