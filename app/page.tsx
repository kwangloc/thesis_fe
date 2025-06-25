"use client";

import { useEffect, useRef, useState } from "react";
import { AudioPlayer } from "@/components/audio-player";
import { TranscriptPanel } from "@/components/transcript-panel";
import { InsightsPanel } from "@/components/insights-panel";
import { TranscriptSegment, SummaryPoint } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function Home() {
  // Upload state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Data state
  const [transcriptData, setTranscriptData] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<any>({});
  const [wordTimings, setWordTimings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
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
  const [isPlaying, setIsPlaying] = useState(false);

  const audioPlayerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setUploadStatus('idle');
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
    setUploadStatus('uploading');
    setUploadProgress(0);
    setUploadError(null);

    // Prepare the form data
    const formData = new FormData();
    formData.append('file', audioFile); 

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/';
    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData
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

    setUploadStatus('success');
  } catch (error) {
    console.error("Error processing audio:", error);
    setUploadStatus('error');
    setUploadError(error instanceof Error ? error.message : "Unknown error occurred");
  } finally {
    setIsLoading(false);
  }
};


  // Clear the current audio and data
  const handleClearAudio = () => {
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Revoke object URL to prevent memory leaks
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    
    // Reset all states
    setAudioFile(null);
    setAudioUrl(null);
    setUploadStatus('idle');
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
    if (!summaryData || !Object.keys(summaryData).length || !transcriptData.length) {
      setSummaryPoints([]);
      return;
    }
    
    try {
      // Define valid SOAP categories (handle both cases)
      const validCategories = ['S', 'O', 'A', 'P', 's', 'o', 'a', 'p'];
      
      // Safely transform summary data
      const points = Object.entries(summaryData)
        .filter(([category]) => validCategories.includes(category))
        .flatMap(([category, items]: [string, any]) => {
          // Check if items is an array
          if (!Array.isArray(items)) {
            console.warn(`Category "${category}" does not contain an array. Skipping.`);
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
              : (utteranceId ? [utteranceId] : []);
            
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
                      const utteranceText = summaryData.utterances?.[utId] || "";
                      if (utteranceText && transcriptData[i].text.includes(utteranceText.split(":")[1]?.trim() || "")) {
                        return `segment-${i + 1}`;
                      }
                    }
                    
                    // If we can't find a match, use a simple mapping (U1->segment-1, U2->segment-2)
                    const num = parseInt(utId.substring(1), 10);
                    return num ? `segment-${num}` : null;
                  }
                  
                  // For other formats, try direct mapping
                  const segmentIndex = transcriptData.findIndex(
                    segment => segment.utterance_id === utId
                  );
                  return segmentIndex !== -1 ? `segment-${segmentIndex + 1}` : null;
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
      console.log("Summary data structure:", JSON.stringify(summaryData, null, 2));
      setSummaryPoints([]);
    }
  }, [transcriptData, summaryData]);

  function getAudioType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'mp3':
        return 'audio/mpeg';
      case 'wav':
        return 'audio/wav';
      case 'ogg':
        return 'audio/ogg';
      case 'm4a':
        return 'audio/mp4';
      default:
        return 'audio/mpeg'; // Default fallback
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
      new Set(transcriptData.length > 0 ? transcriptData.map((item) => item.speaker) : [])
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
      .filter((speaker): speaker is { id: any; name: any; role: "doctor" | "patient" } => speaker !== null),
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
        {/* File Upload UI */}
        <div className="mb-4 p-4 bg-white rounded-lg shadow-sm flex-shrink-0">
          <h2 className="text-xl font-bold mb-4">Upload Medical Audio Recording</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <Label htmlFor="audio-upload" className="block text-sm font-medium mb-2">
                Select Audio File (WAV format)
              </Label>
              <input
                id="audio-upload"
                ref={fileInputRef}
                type="file"
                accept=".wav,audio/wav"
                onChange={handleFileChange}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {audioFile && (
                <p className="mt-1 text-sm text-gray-500">
                  Selected: {audioFile.name} ({(audioFile.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              )}
            </div>
            
            <div className="flex space-x-2">
              <Button 
                onClick={handleProcessAudio} 
                disabled={!audioFile || uploadStatus === 'uploading' || isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {uploadStatus === 'uploading' ? 'Processing...' : 'Process Audio'}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleClearAudio}
                disabled={!audioFile || uploadStatus === 'uploading'}
              >
                Clear
              </Button>
            </div>
          </div>
          
          {/* Progress indicator */}
          {uploadStatus === 'uploading' && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-1">Uploading and processing: {uploadProgress}%</p>
            </div>
          )}
          
          {/* Error message */}
          {uploadStatus === 'error' && uploadError && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
              <p className="text-sm font-medium">Error: {uploadError}</p>
            </div>
          )}
          
          {/* Success message */}
          {uploadStatus === 'success' && (
            <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md">
              <p className="text-sm font-medium">Audio processed successfully!</p>
            </div>
          )}
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex-1 flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Content when data is loaded */}
        {!isLoading && audioUrl && (
          <>
            {/* Audio Player */}
            <div ref={audioPlayerRef} className="sticky top-0 z-10 bg-gray-50 pb-2 flex-shrink-0">
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
            {audioUrl && uploadStatus !== 'success' && transcriptData.length === 0 && !isLoading && (
              <div className="flex-1 flex flex-col justify-center items-center p-8 text-center">
                <div className="rounded-full bg-blue-50 p-4 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Audio Ready for Processing</h3>
                <p className="text-gray-600 max-w-md">
                  Click the &quot;Process Audio&quot; button to send your recording for analysis. 
                  The system will transcribe the audio and generate clinical insights.
                </p>
              </div>
            )}
          </>
        )}

        {/* Initial state - no file uploaded yet */}
        {!audioUrl && !isLoading && (
          <div className="flex-1 flex flex-col justify-center items-center p-8 text-center">
            <div className="rounded-full bg-gray-100 p-6 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-3">Upload Medical Audio Recording</h2>
            <p className="text-gray-600 max-w-md mb-8">
              Upload a WAV audio file of a medical consultation to generate a transcript and clinical insights automatically.
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
    </div>
  );
}