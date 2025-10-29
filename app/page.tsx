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

import { DoctorProfile } from "@/components/profile/Type";
import { ProfileModal } from "@/components/profile/ProfileModal"

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
    transcriptPath: "/data/transcript/labelled_fever_stomach.json",
    wordTranscriptPath: "/data/transcript_word/tokens_fever_stomach.json",
    // summaryPath: "/data/summary/summary_fever_stomach.json",
    summaryPath: "/data/summary/edit_fever_stomach_summary.json",
    // audioPath: "/data/audio/fever_stomach.wav",
    audioPath: "/data/audio_allowed/fever_stomach.wav",
  },
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
    audioPath: "/data/audio/encounter_chest_pain.wav",
  },
  {
    name: "Encounter Fever",
    transcriptPath: "/data/transcript/labelled_encounter_fever.json",
    wordTranscriptPath: "/data/transcript_word/tokens_encounter_fever.json",
    summaryPath: "/data/summary/summary_encounter_fever.json",
    audioPath: "/data/audio/encounter_fever.wav",
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

  // Profile state
    // Add these state variables inside your Home component
    const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(
      null
    );
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);
    // const apiBaseUrl =
    //   process.env.NEXT_PUBLIC_API_URL_PROFILE ||
    //   "http://localhost:8000/api/profile";

    // Default to the static file in public/data when no API URL is provided.
    const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL_PROFILE || "/data/doctor_profile.json";
      
    // Add this effect to fetch the profile when the component mounts
    useEffect(() => {
      fetchDoctorProfile();
    }, []);
  
    const fetchDoctorProfile = async () => {
      if (isLoadingProfile) return;
  
      setIsLoadingProfile(true);
      try {
      //   const response = await fetch(apiBaseUrl, {
      //   method: "GET",
      //   headers: {
      //     "ngrok-skip-browser-warning": "1", // skip Ngrok warning page :contentReference[oaicite:1]{index=1}
      //     // alternatively, you can set a custom User-Agent header
      //     // "User-Agent": "MyApp/1.0"
      //   },
      // });
        
      //   if (!response.ok) {
      //     throw new Error(`Failed to fetch profile: ${response.status}`);
      //   }
      //   const data = await response.json();
      //   setDoctorProfile(data);

        let response;

        // If an API URL is explicitly provided, try it first.
        if (process.env.NEXT_PUBLIC_API_URL_PROFILE) {
          response = await fetch(process.env.NEXT_PUBLIC_API_URL_PROFILE, {
            method: "GET",
          });
          if (!response.ok) {
            throw new Error(`API fetch failed: ${response.status}`);
          }
        } else {
          // No external API configured — load the static JSON from public/
          response = await fetch("/data/doctor_profile.json");
          if (!response.ok) {
            throw new Error(`Static profile fetch failed: ${response.status}`);
          }
        }

        const data = await response.json();
        setDoctorProfile(data);
      } catch (error) {
        // console.error("Error loading profile:", error);
        console.error("Error loading profile; attempting fallback to public JSON:", error);
        // Try fallback to public JSON in case API failed
        try {
          const fallback = await fetch("/data/doctor_profile.json");
          if (fallback.ok) {
            const fallbackData = await fallback.json();
            setDoctorProfile(fallbackData);
          } else {
            console.error("Fallback fetch failed:", fallback.status);
            setDoctorProfile(null);
          }
        } catch (fallbackErr) {
          console.error("Fallback fetch error:", fallbackErr);
          setDoctorProfile(null);
        }
      } finally {
        setIsLoadingProfile(false);
      }
    };
  
    const handleProfileUpdate = (updatedProfile: DoctorProfile) => {
      setDoctorProfile(updatedProfile);
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

  // Profile
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Stop the event from propagating
    setIsProfileOpen(false); // Close the dropdown
    setIsProfileModalOpen(true); // Open the profile modal
  };

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

  // DECORATE
    // Add state for dropdown
    const [isProfileOpen, setIsProfileOpen] = useState(false);
  
    // Toggle dropdown visibility
    const toggleProfileDropdown = () => {
      setIsProfileOpen(!isProfileOpen);
    };
  
    // Close dropdown when clicking outside
    const dropdownRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          isProfileOpen &&
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsProfileOpen(false);
        }
      };
  
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isProfileOpen]);
  
    // Create a ref for the profile modal
    const modalRef = useRef<HTMLDivElement>(null);
  
    // Handle profile modal close
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          isProfileModalOpen &&
          modalRef.current &&
          !modalRef.current.contains(event.target as Node)
        ) {
          setIsProfileModalOpen(false);
        }
      };
  
      if (isProfileModalOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      }
  
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isProfileModalOpen, modalRef]);

  return (
    <div className="h-screen overflow-hidden bg-gray-70">
      {/* Header */}
      <header className=" bg-blue-300 border-b border-gray-200 py-1 px-6 flex justify-between items-center flex-shrink-0 z-20">
        {/* Logo/Website Name */}
        <div className="flex items-center">
          {/* <svg
            className="h-8 w-8 text-blue-800 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg> */}
          <svg fill="#1e3a8a" height="25px" width="25px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488.9 488.9"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path d="M432.25,130.1L325.05,7.3c-4.2-5.2-9.4-7.3-15.6-7.3H72.25c-11.4,0-20.8,9.4-20.8,20.8v447.3c0,11.4,9.4,20.8,20.8,20.8 h345.4c11.4,0,19.8-9.4,19.8-19.8V143.6C437.45,138.4,435.35,134.2,432.25,130.1z M330.25,75l55.6,63.4h-55.6V75z M288.65,40.6 v117.6c0,11.4,9.4,20.8,20.8,20.8h87.4v91.5h-64.5c-8.3,0-15.6,5.2-18.7,12.5l-7.3,15.6l-12.5-17.7c-3.1-6.2-9.4-9.4-16.6-9.4h-52 c-8.3,0-15.6,5.2-18.7,13.5l-2.1,4.2l-14.6-73.9c-1.8-12.7-23.5-28-38.5-5.2l-36.4,76h-22.9V40.6H288.65z M93.05,448.4h-1V327.7 h35.4c8.3,0,15.6-4.2,18.7-11.4l15.6-32.3l16.6,85.3c9.6,25.9,35.4,18.2,39.5,2.1l21.8-59.3h27l26,39.5c15,18.7,33.6,6.2,35.4-2.1 l16.6-37.5h52v136.3H93.05V448.4z"></path> </g> </g></svg>
          <h1 className="ml-1 text-xl font-bold text-blue-900">Healthscribe</h1>
        </div>

        {/* Doctor Profile */}
        <div className="relative">
          <button
            onClick={toggleProfileDropdown}
            className="flex items-center space-x-3 bg-white hover:bg-red-100 rounded-full py-1 pl-1 pr-3 transition-colors"
          >
            <div className="bg-blue-100 rounded-full p-1">
              <svg
                className="h-7 w-7 text-blue-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <div className="text-left">
              <span className="text-sm font-medium text-gray-700">
                {doctorProfile ? doctorProfile.name : "Loading..."}
              </span>
              <span className="block text-xs text-gray-500">
                {doctorProfile ? doctorProfile.title : ""}
              </span>
            </div>
            <svg
              className={`h-4 w-4 text-gray-500 transition-transform ${
                isProfileOpen ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {isProfileOpen && (
            <div
              ref={dropdownRef}
              className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-200"
            >
              {/* <a
                href="#"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={handleProfileClick}
              >
                <div className="flex items-center">
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Profile
                </div>
              </a> */}
              <button
                type="button"
                className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={handleProfileClick}
              >
                <div className="flex items-center">
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Profile
                </div>
              </button>              

              <a
                href="#"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <div className="flex items-center">
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Settings
                </div>
              </a>
              <a
                href="#"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <div className="flex items-center">
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Appointments
                </div>
              </a>
              <a
                href="#"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <div className="flex items-center">
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  New Note
                </div>
              </a>
              <div className="border-t border-gray-200 my-1"></div>
              <a
                href="#"
                className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                <div className="flex items-center">
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Sign out
                </div>
              </a>
            </div>
          )}
        {/* Render profile modal */}
          {isProfileModalOpen && (
            <ProfileModal
              profile={doctorProfile}
              isOpen={isProfileModalOpen}
              onClose={() => setIsProfileModalOpen(false)}
              onUpdate={handleProfileUpdate}
            />
          )}  
        </div>
      </header>
      <main className="h-full flex flex-col max-w-full mx-auto px-4">
        {/* Conversation Selection UI */}
        <div className="my-2 p-1 bg-white rounded-lg shadow-sm flex-shrink-0 flex items-center">
          <h2 className="text-lg font-bold m-0 mr-4">Select conversation:</h2>
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
              <div className="bg-white rounded-lg shadow-sm border border-gray-400 flex flex-col min-h-0 overflow-hidden">
                {/* <h2 className="text-2xl font-bold mb-2 flex-shrink-0">Transcript</h2> */}
                {/* <ScrollArea
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
                </ScrollArea> */}
                <TranscriptPanel
                    transcript={audioData.transcript}
                    speakers={audioData.speakers}
                    currentTime={currentTime}
                    highlightedSegmentIds={highlightedSegmentIds}
                    onSegmentClick={handleSegmentClick}
                    wordTimings={wordTimings.length > 0 ? wordTimings : []}
                  />
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-400 flex flex-col min-h-0 overflow-hidden">
                {/* <h2 className="text-2xl font-bold mb-2 flex-shrink-0">Insights</h2> */}
                <InsightsPanel
                  summary={audioData.summary}
                  onSummaryPointClick={handleSummaryPointClick}
                  onSummaryEdit={handleSummaryEdit}
                  activePointId={activePointId}
                />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
