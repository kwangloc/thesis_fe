import { useState, useEffect, useRef } from 'react';
import { ProfileDisplay } from './ProfileDisplay';
import { ProfileEdit } from './ProfileEdit';
import { DoctorProfile } from './Type';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const modalRef = useRef<HTMLDivElement>(null);

  // Fetch profile data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchProfileData();
    }
  }, [isOpen]);

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
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const fetchProfileData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Load directly from the public directory
      const response = await fetch('/data/doctor_profile.json');
      if (!response.ok) {
        throw new Error('Failed to fetch profile data');
      }
      const data = await response.json();
      setProfile(data);
    } catch (err) {
      setError('Error loading profile data. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = (updatedProfile: DoctorProfile) => {
    // Since we don't have an API, we'll just update the local state
    setProfile(updatedProfile);
    setIsEditing(false);
    
    // Alert user that changes won't persist without an API
    alert('Profile updated in memory. Changes will be lost on page refresh because there is no API to save the data permanently.');
    
    // Download the updated profile as a JSON file
    const blob = new Blob([JSON.stringify(updatedProfile, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'doctor_profile.json';
    link.click();
    URL.revokeObjectURL(url);
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
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
        ) : profile ? (
          isEditing ? (
            <ProfileEdit
              profile={profile}
              onSave={handleSaveProfile}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <ProfileDisplay
              profile={profile}
              onEdit={() => setIsEditing(true)}
              onClose={onClose}
            />
          )
        ) : null}
      </div>
    </div>
  );
}