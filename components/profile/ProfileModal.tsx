import { useState, useEffect, useRef } from 'react';
import { ProfileDisplay } from './ProfileDisplay';
import { ProfileEdit } from './ProfileEdit';
import { DoctorProfile } from './Type';

// interface ProfileModalProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

type ProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  // allow calling component to receive updates
  onUpdate?: (updatedProfile: DoctorProfile) => void;
  // add optional profile prop so the parent can pass data
  profile?: DoctorProfile | null;
  // ...existing props if any ...
};

// export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  onUpdate,
  profile
}) => {

  const [isEditing, setIsEditing] = useState(false);
  // local editable copy of the profile (parent may pass `profile` prop)
  const [localProfile, setLocalProfile] = useState<DoctorProfile | null>(profile ?? null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const modalRef = useRef<HTMLDivElement>(null);

  // Fetch profile data when modal opens or when the incoming prop changes
  useEffect(() => {
    if (isOpen) {
      // If parent already provided a profile prop, use that as the source of truth
      if (profile) {
        setLocalProfile(profile);
        setIsLoading(false);
      } else {
        fetchProfileData();
      }
    }
    // keep this effect in sync when `profile` prop changes
  }, [isOpen, profile]);

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
      setLocalProfile(data);
    } catch (err) {
      setError('Error loading profile data. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = (updatedProfile: DoctorProfile) => {
    // Since we don't have an API, we'll just update the local state
    setLocalProfile(updatedProfile);
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
    // Notify parent if it wants the updated profile
    if (onUpdate) {
      try {
        onUpdate(updatedProfile);
      } catch (e) {
        // swallow errors from parent callback
        console.error('onUpdate callback threw an error', e);
      }
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
        ) : localProfile ? (
          isEditing ? (
            <ProfileEdit
              profile={localProfile}
              onSave={handleSaveProfile}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <ProfileDisplay
              profile={localProfile}
              onEdit={() => setIsEditing(true)}
              onClose={onClose}
            />
          )
        ) : null}
      </div>
    </div>
  );
}