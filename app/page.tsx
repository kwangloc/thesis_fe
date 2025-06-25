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
  SelectValue,
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
    name: "Abdominal Pain History",
    transcriptPath: "/data/transcript/labelled_abdominal_pain_history.json",
    wordTranscriptPath:
      "/data/transcript_word/tokens_abdominal_pain_history.json",
    summaryPath: "/data/summary/summary_abdominal_pain_history.json",
    audioPath: "/data/audio/abdominal_pain_history.wav",
  },
  {
    name: "Encounter Chest Pain",
    transcriptPath: "/data/transcript/labelled_encounter_chest_pain.json",
    wordTranscriptPath:
      "/data/transcript_word/tokens_encounter_chest_pain.json",
    summaryPath: "/data/summary/summary_encounter_chest_pain.json",
    audioPath: "/data/audio/encounter_chest_pain.mp3",
  },
  {
    name: "Encounter Fever",
    transcriptPath: "/data/transcript/labelled_encounter_fever.json",
    wordTranscriptPath: "/data/transcript_word/tokens_encounter_fever.json",
    summaryPath: "/data/summary/summary_encounter_fever.json",
    audioPath: "/data/audio/encounter_fever.mp3",
  },
  {
    name: "Fever Stomach",
    transcriptPath: "/data/transcript/labelled_fever_stomach.json",
    wordTranscriptPath: "/data/transcript_word/tokens_fever_stomach.json",
    // summaryPath: "/data/summary/summary_fever_stomach.json",
    summaryPath: "/data/summary/edit_fever_stomach_summary.json",
    audioPath: "/data/audio/fever_stomach.mp3",
  },
  {
    name: "Sexual Health History",
    transcriptPath: "/data/transcript/labelled_sexual_health_history.json",
    wordTranscriptPath:
      "/data/transcript_word/tokens_sexual_health_history.json",
    summaryPath: "/data/summary/summary_sexual_health_history.json",
    audioPath: "/data/audio/sexual_health_history.wav",
  },
  {
    name: "Type 2 Diabetes",
    transcriptPath: "/data/transcript/labelled_type_2_diabetes.json",
    wordTranscriptPath: "/data/transcript_word/tokens_type_2_diabetes.json",
    summaryPath: "/data/summary/summary_type_2_diabetes.json",
    audioPath: "/data/audio/type_2_diabetes.wav",
  },
];

export default function Home() {
  // State for selected conversation
  const [selectedConversation, setSelectedConversation] = useState<string>(
    AVAILABLE_CONVERSATIONS[0].name
  );

  // Data state
  const [transcriptData, setTranscriptData] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<any>({});
  const [wordTimings, setWordTimings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Player state
  const [currentTime, setCurrentTime] = useState(0);
  const [highlightedSegmentIds, setHighlightedSegmentIds] = useState<string[]>(
    []
  );
  const [activePointId, setActivePointId] = useState<string>();
  const [segmentRange, setSegmentRange] = useState<{
    start: number;
    end: number;
  } | null>(null);

  // Transformed summary data
  const [summaryPoints, setSummaryPoints] = useState<any[]>([]);

  const audioPlayerRef = useRef<HTMLDivElement>(null);
  const transcriptScrollRef = useRef<HTMLDivElement>(null);
  // Add this function to scroll to a specific segment
  const scrollToSegment = (segmentId: string) => {
    if (!transcriptScrollRef.current) return;

    // Find the segment element
    const segmentElement = document.getElementById(segmentId);
    if (!segmentElement) return;

    // Scroll the element into view with smooth behavior
    segmentElement.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  // Get the selected conversation details
  const getSelectedConversation = () => {
    return (
      AVAILABLE_CONVERSATIONS.find(
        (conv) => conv.name === selectedConversation
      ) || AVAILABLE_CONVERSATIONS[0]
    );
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

  // Add this state to track playback
  const [isPlaying, setIsPlaying] = useState(false);

  // Load data when conversation changes
  useEffect(() => {
    const loadConversationData = async () => {
      setIsPlaying(false);

      // Reset playback state when conversation changes
      setCurrentTime(0);
      setSegmentRange(null);
      setHighlightedSegmentIds([]);
      setActivePointId(undefined);

      // Show loading state
      setIsLoading(true);

      const conversation = getSelectedConversation();

      try {
        // Load transcript
        const transcriptResponse = await fetch(conversation.transcriptPath);
        if (!transcriptResponse.ok)
          throw new Error(
            `Failed to load transcript from ${conversation.transcriptPath}`
          );
        const transcriptJson = await transcriptResponse.json();
        setTranscriptData(Array.isArray(transcriptJson) ? transcriptJson : []);

        // Load summary
        const summaryResponse = await fetch(conversation.summaryPath);
        if (!summaryResponse.ok)
          throw new Error(
            `Failed to load summary from ${conversation.summaryPath}`
          );
        const summaryJson = await summaryResponse.json();
        setSummaryData(summaryJson);

        // Load word timings
        const wordTimingsResponse = await fetch(
          conversation.wordTranscriptPath
        );
        if (!wordTimingsResponse.ok)
          throw new Error(
            `Failed to load word timings from ${conversation.wordTranscriptPath}`
          );
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
    if (
      !summaryData ||
      !Object.keys(summaryData).length ||
      !transcriptData.length
    ) {
      setSummaryPoints([]);
      return;
    }

    try {
      // Define valid SOAP categories
      // const validCategories = ['S', 'O', 'A', 'P'];
      const validCategories = ["S", "O", "A", "P", "s", "o", "a", "p"];

      // Safely transform summary data
      const points = Object.entries(summaryData)
        .filter(([category]) => validCategories.includes(category))
        .flatMap(([category, items]: [string, any]) => {
          // Check if items is an array
          if (!Array.isArray(items)) {
            console.warn(
              `Category "${category}" does not contain an array. Skipping.`
            );
            return [];
          }

          return items.map((item: any, index: number) => {
            const pointId = `${category}-${index}`;
            const originalVersionId = `${pointId}-v1`;

            // Extract the right properties from the summary item
            const text = item.sentence_text || item.info || "";
            const utteranceId = item.utterance_id || "";

            // Make utterance_id into an array if it's a single string
            const utteranceIds = Array.isArray(item.utterance_ids)
              ? item.utterance_ids
              : utteranceId
              ? [utteranceId]
              : [];

            return {
              id: pointId,
              category: category,
              text: text,
              relatedSegmentIds: utteranceIds
                .map((utId: string) => {
                  // If utterance ID is in U1, U2 format, we need to find the corresponding transcript segment
                  if (utId.startsWith("U")) {
                    // Find the transcript segment by matching the utterance in the transcript
                    for (let i = 0; i < transcriptData.length; i++) {
                      // If the transcript has utterance_id field, use that
                      if (transcriptData[i].utterance_id === utId) {
                        return `segment-${i + 1}`;
                      }

                      // Otherwise match by content or index (adjust as needed)
                      const utteranceText =
                        summaryData.utterances?.[utId] || "";
                      if (
                        utteranceText &&
                        transcriptData[i].text.includes(
                          utteranceText.split(":")[1]?.trim() || ""
                        )
                      ) {
                        return `segment-${i + 1}`;
                      }
                    }

                    // If we can't find a match, use a simple mapping (U1->segment-1, U2->segment-2)
                    const num = parseInt(utId.substring(1), 10);
                    return num ? `segment-${num}` : null;
                  }

                  // For other formats, try direct mapping
                  const segmentIndex = transcriptData.findIndex(
                    (segment) => segment.utterance_id === utId
                  );
                  return segmentIndex !== -1
                    ? `segment-${segmentIndex + 1}`
                    : null;
                })
                .filter(Boolean),
              versions: [
                {
                  id: originalVersionId,
                  content: text,
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
      console.log(
        "Summary data structure:",
        JSON.stringify(summaryData, null, 2)
      );
      setSummaryPoints([]);
    }
  }, [transcriptData, summaryData]);

  // Generate audio data for components
  const selectedConversationDetails = getSelectedConversation();

  function getAudioType(filepath: string): string {
    const extension = filepath.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "mp3":
        return "audio/mpeg";
      case "wav":
        return "audio/wav";
      case "ogg":
        return "audio/ogg";
      case "m4a":
        return "audio/mp4";
      default:
        return "audio/mpeg"; // Default fallback
    }
  }

  const audioData = {
    id: "consultation",
    title: selectedConversation,
    url: selectedConversationDetails.audioPath,
    type: getAudioType(selectedConversationDetails.audioPath),
    duration: 0, // Will be set by audio element
    speakers: Array.from(
      new Set(
        transcriptData.length > 0
          ? transcriptData.map((item) => item.speaker)
          : []
      )
    )
      .map((id) => {
        let role: "doctor" | "patient" | undefined;
        if (id === "Doctor" || id === "SPEAKER_00") {
          role = "doctor";
        } else if (id === "Patient" || id === "SPEAKER_01") {
          role = "patient";
        }
        // Only return speakers with a valid role
        if (role) {
          return {
            id,
            name: id,
            role,
          };
        }
        return null;
      })
      .filter(
        (
          speaker
        ): speaker is { id: any; name: any; role: "doctor" | "patient" } =>
          speaker !== null
      ),
    transcript:
      transcriptData.length > 0
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

        // Add this: Scroll to the first related segment
        setTimeout(() => {
          scrollToSegment(point.relatedSegmentIds[0]);
        }, 100); // Small delay to ensure highlighting happens first
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
                {AVAILABLE_CONVERSATIONS.map((conv) => (
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
            <div
              ref={audioPlayerRef}
              className="sticky top-0 z-10 bg-gray-50 pb-2 flex-shrink-0"
            >
              <AudioPlayer
                audioUrl={audioData.url}
                audioType={audioData.type}
                title={audioData.title}
                duration={audioData.duration}
                onTimeUpdate={setCurrentTime}
                onSeek={setCurrentTime}
                wordTimings={wordTimings.length > 0 ? wordTimings : []}
                segmentRange={segmentRange}
                onSegmentRangeUsed={() => setSegmentRange(null)}
                isPlaying={isPlaying} // Add this prop
                onPlay={() => setIsPlaying(true)} // Add this handler
                onPause={() => setIsPlaying(false)} // Add this handler
              />
            </div>

            {/* Content panels - This now fills the remaining height */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-hidden min-h-0">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-hidden">
                {/* <h2 className="text-2xl font-bold mb-2 flex-shrink-0">Transcript</h2> */}
                <ScrollArea
                  className="flex-1 min-h-0 pr-4"
                  ref={transcriptScrollRef}
                >
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
