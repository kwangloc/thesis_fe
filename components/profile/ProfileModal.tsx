import { useState, useEffect, useRef } from "react";
import { ProfileDisplay } from "./ProfileDisplay";
import { ProfileEdit } from "./ProfileEdit";
import { DoctorProfile } from "./Types";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: DoctorProfile | null;
  onProfileUpdate: (profile: DoctorProfile) => void;
}

export function ProfileModal({
  isOpen,
  onClose,
  profile,
  onProfileUpdate,
}: ProfileModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localProfile, setLocalProfile] = useState<DoctorProfile | null>(
    profile
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL_PROFILE ||
    "http://localhost:8000/api/profile";

  // Update local profile when prop changes
  useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const fetchProfileData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch profile data: ${response.status}`);
      }
      const data = await response.json();
      setLocalProfile(data);
      onProfileUpdate(data); // Update parent state too
    } catch (err) {
      setError("Error loading profile data. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async (updatedProfile: DoctorProfile) => {
    setIsSaving(true);
    try {
      const response = await fetch(`${apiBaseUrl}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedProfile),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      // Update both local and parent state
      setLocalProfile(updatedProfile);
      onProfileUpdate(updatedProfile);
      setIsEditing(false);

      // Show success notification
      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert(
        `Failed to save profile: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div
        ref={modalRef}
        className="relative bg-white rounded-lg max-w-2xl w-full mx-auto shadow-xl animate-fade-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <div className="text-red-500 mb-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{error}</h3>
            <button
              onClick={fetchProfileData}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors mt-4"
            >
              Try Again
            </button>
          </div>
        ) : localProfile ? (
          isEditing ? (
            <ProfileEdit
              profile={localProfile}
              onSave={handleSaveProfile}
              onCancel={() => setIsEditing(false)}
              isSaving={isSaving}
            />
          ) : (
            <ProfileDisplay
              profile={localProfile}
              onEdit={() => setIsEditing(true)}
              onClose={onClose}
            />
          )
        ) : (
          <div className="p-6 text-center">
            <p>No profile data available. Please try again later.</p>
            <button
              onClick={fetchProfileData}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors mt-4"
            >
              Load Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
