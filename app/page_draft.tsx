"use client";

import { useEffect, useRef, useState } from "react";
import { AudioPlayer } from "@/components/audio-player";
import { TranscriptPanel } from "@/components/transcript-panel";
import { InsightsPanel } from "@/components/insights-panel";
import { TranscriptSegment, SummaryPoint } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import React from "react";
import { ProfileModal } from "@/components/profile/ProfileModal";
import { DoctorProfile } from "@/components/profile/types";

// import { DoctorProfile } from "@/components/profile/Types";

export default function Home() {
  // Upload state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Data state
  const [transcriptData, setTranscriptData] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<any>({});
  const [wordTimings, setWordTimings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
  const [isPlaying, setIsPlaying] = useState(false);

  const audioPlayerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile state
  // Add these state variables inside your Home component
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(
    null
  );
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL_PROFILE ||
    "http://localhost:8000/api/profile";

  // Add this effect to fetch the profile when the component mounts
  useEffect(() => {
    fetchDoctorProfile();
  }, []);

  const fetchDoctorProfile = async () => {
    if (isLoadingProfile) return;

    setIsLoadingProfile(true);
    try {
      // const response = await fetch(apiBaseUrl);
      const response = await fetch(apiBaseUrl, {
      method: "GET",
      headers: {
        "ngrok-skip-browser-warning": "1", // skip Ngrok warning page :contentReference[oaicite:1]{index=1}
        // alternatively, you can set a custom User-Agent header
        // "User-Agent": "MyApp/1.0"
      },
    });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }
      const data = await response.json();
      setDoctorProfile(data);
    } catch (error) {
      console.error("Error loading profile:", error);
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
  }, [audioUrl]);

  // Profile
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Add this function to handle opening the profile modal
  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Stop the event from propagating
    setIsProfileOpen(false); // Close the dropdown
    setIsProfileModalOpen(true); // Open the profile modal
  };

  // Success toast auto-dismiss
  // useEffect(() => {
  //   if (uploadStatus === "success") {
  //     const timer = setTimeout(() => {
  //       setUploadStatus("idle");
  //     }, 5000); // 5 seconds
  //     return () => clearTimeout(timer);
  //   }
  // }, [uploadStatus]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setAudioFile(file);

      // Create local URL for preview/playback
      const url = URL.createObjectURL(file);
      setAudioUrl(url);

      // Reset states
      setUploadStatus("idle");
      setUploadError(null);
      setTranscriptData([]);
      setSummaryData({});
      setWordTimings([]);
      setSummaryPoints([]);
    }
  };

  const handleProcessAudio = async () => {
    if (!audioFile) {
      setUploadError("Please select an audio file first");
      return;
    }

    try {
      setIsLoading(true);
      setUploadStatus("uploading");
      setUploadProgress(0);
      setUploadError(null);

      // Prepare the form data
      const formData = new FormData();
      formData.append("file", audioFile);

      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/";
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.error || "Upload failed");
      }

      const data = await response.json();

      // Match the keys in the backend's response
      setTranscriptData(data.transcript_labelled || []);
      setSummaryData(data.summary || {});
      setWordTimings(data.transcript_word || []);

      setUploadStatus("success");
    } catch (error) {
      console.error("Error processing audio:", error);
      setUploadStatus("error");
      setUploadError(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Clear the current audio and data
  const handleClearAudio = () => {
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Revoke object URL to prevent memory leaks
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    // Reset all states
    setAudioFile(null);
    setAudioUrl(null);
    setUploadStatus("idle");
    setUploadError(null);
    setUploadProgress(0);
    setTranscriptData([]);
    setSummaryData({});
    setWordTimings([]);
    setSummaryPoints([]);
    setCurrentTime(0);
    setSegmentRange(null);
    setHighlightedSegmentIds([]);
    setActivePointId(undefined);
    setIsPlaying(false);
  };

  // Transform summary data for UI consumption - keep this function as is
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
      // Define valid SOAP categories (handle both cases)
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

          // Normalize category to uppercase for consistency
          const normalizedCategory = category.toUpperCase();

          return items.map((item: any, index: number) => {
            const pointId = `${normalizedCategory}-${index}`;
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
              category: normalizedCategory,
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

  function getAudioType(filename: string): string {
    const extension = filename.split(".").pop()?.toLowerCase();
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

  // Generate audio data for components
  const audioData = {
    id: "consultation",
    title: audioFile?.name || "Uploaded Audio",
    url: audioUrl || "",
    type: audioFile ? getAudioType(audioFile.name) : "audio/wav",
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
    <div className="h-screen overflow-hidden bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-6 flex justify-between items-center flex-shrink-0 z-20">
        {/* Logo/Website Name */}
        <div className="flex items-center">
          <svg
            className="h-8 w-8 text-blue-600 mr-2"
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
          </svg>
          <h1 className="text-xl font-bold text-gray-800">Healthscribe</h1>
        </div>

        {/* Doctor Profile */}
        <div className="relative">
          <button
            onClick={toggleProfileDropdown}
            className="flex items-center space-x-3 hover:bg-gray-100 rounded-full py-1 pl-1 pr-3 transition-colors"
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
              <a
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
        </div>
      </header>

      <main className="h-full flex flex-col max-w-full mx-auto px-4">
        {/* Compact File Upload UI */}
        <div className="mb-3 bg-white rounded-lg shadow-sm flex-shrink-0">
          <div className="flex flex-wrap items-center p-3">
            <div className="flex items-center mr-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-blue-600 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span className="font-medium text-gray-700">
                Audio Recording:
              </span>
            </div>

            <div className="flex-grow flex flex-wrap items-center ml-3">
              <div className="flex-grow min-w-[200px] mr-3">
                <div className="flex items-center">
                  <label className="relative inline-block">
                    <input
                      id="audio-upload"
                      ref={fileInputRef}
                      type="file"
                      accept=".wav,audio/wav"
                      onChange={handleFileChange}
                      className="w-[0.1px] h-[0.1px] opacity-0 overflow-hidden absolute -z-10"
                    />
                    <span className="cursor-pointer text-base py-2 px-3 rounded-md bg-blue-50 text-blue-700 font-medium hover:bg-blue-100 inline-block">
                      Choose File
                    </span>
                  </label>

                  {audioFile && (
                    <span className="text-xs text-gray-500 ml-2 truncate">
                      {audioFile.name} (
                      {(audioFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  )}
                </div>
              </div>

              <div className="flex space-x-2 mt-2 sm:mt-0">
                <Button
                  onClick={handleProcessAudio}
                  disabled={
                    !audioFile || uploadStatus === "uploading" || isLoading
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white text-base py-2 h-auto"
                  size="sm"
                >
                  {uploadStatus === "uploading"
                    ? "Processing..."
                    : "Process Audio"}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleClearAudio}
                  disabled={!audioFile || uploadStatus === "uploading"}
                  className="text-base py-2 h-auto"
                  size="sm"
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>

          {/* Compact status section */}
          {(uploadStatus === "uploading" ||
            uploadStatus === "error" ||
            uploadStatus === "success") && (
            <div className="px-3 pb-2">
              {/* Progress indicator */}
              {uploadStatus === "uploading" && (
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mr-2 flex-grow">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {uploadProgress}%
                  </span>
                </div>
              )}

              {/* Error message */}
              {uploadStatus === "error" && uploadError && (
                <div className="p-1.5 bg-red-50 text-red-700 rounded-md text-xs">
                  Error: {uploadError}
                </div>
              )}

              {/* Enhanced success toast notification */}
              {uploadStatus === "success" && (
                <div className="fixed bottom-6 right-6 z-50 animate-bounce-in">
                  <div className="bg-green-200 shadow-2xl rounded-lg overflow-hidden max-w-md transform transition-all hover:scale-105">
                    <div className="bg-green-500 h-2 w-full"></div>
                    <div className="p-5 flex">
                      <div className="flex-shrink-0 mr-4 bg-green-100 rounded-full p-3">
                        <svg
                          className="h-8 w-8 text-green-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="flex-grow">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          Success!
                        </h3>
                        <p className="text-gray-700">
                          Audio processed successfully. Your SOAP note is ready!
                        </p>
                        <div className="mt-3 flex space-x-2">
                          <button
                            onClick={() => setUploadStatus("idle")}
                            className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
                          >
                            <span>Dismiss</span>
                            <svg
                              className="h-4 w-4 ml-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex-1 flex justify-center items-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Content when data is loaded */}
        {!isLoading && audioUrl && (
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
                isPlaying={isPlaying}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            </div>

            {/* Content panels - Only show if we have transcript data */}
            {transcriptData.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-hidden min-h-0">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-hidden">
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
            )}

            {/* No data yet message */}
            {audioUrl &&
              uploadStatus !== "success" &&
              transcriptData.length === 0 &&
              !isLoading && (
                <div className="flex-1 flex flex-col justify-center items-center p-8 text-center">
                  <div className="rounded-full bg-blue-50 p-4 mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-10 w-10 text-blue-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Audio Ready for Processing
                  </h3>
                  <p className="text-gray-600 max-w-md">
                    Click the &quot;Process Audio&quot; button to send your
                    recording for analysis. The system will transcribe the audio
                    and generate clinical insights.
                  </p>
                </div>
              )}
          </>
        )}

        {/* Initial state - no file uploaded yet */}
        {!audioUrl && !isLoading && (
          <div className="flex-1 flex flex-col justify-center items-center p-8 text-center">
            <div className="rounded-full bg-gray-100 p-6 mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-3">
              Upload Medical Audio Recording
            </h2>
            <p className="text-gray-600 max-w-md mb-8">
              Upload a WAV audio file of a medical consultation to generate a
              transcript and clinical insights automatically.
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg"
            >
              Select Audio File
            </Button>
          </div>
        )}
      </main>

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          profile={doctorProfile}
          onProfileUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
}