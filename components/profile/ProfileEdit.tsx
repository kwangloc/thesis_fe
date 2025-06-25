import { useState } from 'react';
import { DoctorProfile, Experience, Education, Publication, Contact } from './Types';

interface ProfileEditProps {
  profile: DoctorProfile;
  onSave: (updatedProfile: DoctorProfile) => void;
  onCancel: () => void;
}

export function ProfileEdit({ profile, onSave, onCancel }: ProfileEditProps) {
  const [formData, setFormData] = useState<DoctorProfile>({ ...profile });
  const [isSaving, setIsSaving] = useState(false);

  const handleBasicChange = (field: keyof Omit<DoctorProfile, 'experience' | 'education' | 'publications' | 'contact'>, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleContactChange = (field: keyof Contact, value: string) => {
    setFormData({
      ...formData,
      contact: {
        ...formData.contact,
        [field]: value
      }
    });
  };

  const handleExperienceChange = (index: number, field: keyof Experience, value: string) => {
    const updatedExperience = [...formData.experience];
    updatedExperience[index] = {
      ...updatedExperience[index],
      [field]: value
    };
    setFormData({
      ...formData,
      experience: updatedExperience
    });
  };

  const handleEducationChange = (index: number, field: keyof Education, value: string | number) => {
    const updatedEducation = [...formData.education];
    updatedEducation[index] = {
      ...updatedEducation[index],
      [field]: field === 'year' ? Number(value) : value
    };
    setFormData({
      ...formData,
      education: updatedEducation
    });
  };

  const handlePublicationChange = (index: number, field: keyof Publication, value: string | number) => {
    const updatedPublications = [...formData.publications];
    updatedPublications[index] = {
      ...updatedPublications[index],
      [field]: field === 'year' ? Number(value) : value
    };
    setFormData({
      ...formData,
      publications: updatedPublications
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulate an API call
    setTimeout(() => {
      onSave(formData);
      setIsSaving(false);
    }, 500);
  };

  return (
    <>
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
        <h2 className="text-2xl font-bold">Edit Profile</h2>
        <p className="text-blue-100">Update your information</p>
        
        {/* Close button */}
        <button
          className="absolute right-4 top-4 text-white hover:text-blue-100"
          onClick={onCancel}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Scrollable form area */}
      <div className="max-h-[70vh] overflow-y-auto p-6">
        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleBasicChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title/Specialty</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleBasicChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleBasicChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.contact.email}
                  onChange={(e) => handleContactChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={formData.contact.phone}
                  onChange={(e) => handleContactChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Experience */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Professional Experience</h3>
            {formData.experience.map((exp, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-md mb-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                    <input
                      type="text"
                      value={exp.position}
                      onChange={(e) => handleExperienceChange(index, 'position', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
                    <input
                      type="text"
                      value={exp.institution}
                      onChange={(e) => handleExperienceChange(index, 'institution', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                    <input
                      type="text"
                      value={exp.duration}
                      onChange={(e) => handleExperienceChange(index, 'duration', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Education */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Education</h3>
            {formData.education.map((edu, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-md mb-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => handleEducationChange(index, 'institution', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <input
                      type="number"
                      value={edu.year}
                      onChange={(e) => handleEducationChange(index, 'year', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Publications */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Publications</h3>
            {formData.publications.map((pub, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-md mb-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={pub.title}
                      onChange={(e) => handlePublicationChange(index, 'title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Journal</label>
                    <input
                      type="text"
                      value={pub.journal}
                      onChange={(e) => handlePublicationChange(index, 'journal', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <input
                      type="number"
                      value={pub.year}
                      onChange={(e) => handlePublicationChange(index, 'year', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Form buttons */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}