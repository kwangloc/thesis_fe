import { DoctorProfile } from './Type';

interface ProfileDisplayProps {
  profile: DoctorProfile;
  onEdit: () => void;
  onClose: () => void;
}

export function ProfileDisplay({ profile, onEdit, onClose }: ProfileDisplayProps) {
  return (
    <>
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
        <h2 className="text-2xl font-bold">{profile.name}</h2>
        <p className="text-blue-100">{profile.title}</p>
        <p className="text-blue-100 text-sm">{profile.location}</p>
        
        {/* Close button */}
        <button
          className="absolute right-4 top-4 text-white hover:text-blue-100"
          onClick={onClose}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Scrollable content area */}
      <div className="max-h-[70vh] overflow-y-auto p-6">
        <div className="flex flex-col md:flex-row">
          {/* Profile Image - Fixed size */}
          <div className="flex-shrink-0 mb-6 md:mb-0 md:mr-6 flex justify-center md:block">
            <div className="relative inline-block">
              <div className="bg-blue-100 rounded-full p-6 w-32 h-32 flex items-center justify-center">
                <svg
                  className="h-20 w-20 text-blue-700"
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
            </div>
          </div>

          {/* Contact Information Card */}
          <div className="flex-grow space-y-6">
            <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
                Contact Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-gray-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-700 break-all">{profile.contact.email}</span>
                </div>
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-gray-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-gray-700">{profile.contact.phone}</span>
                </div>
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-gray-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-gray-700">{profile.location}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Experience */}
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm mt-6">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center">
            <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Professional Experience
          </h3>
          <div className="space-y-4">
            {profile.experience.map((exp, index) => (
              <div key={index} className="border-l-2 border-blue-200 pl-4 py-1">
                <div className="font-medium text-gray-800">{exp.position}</div>
                <div className="text-sm text-gray-600">{exp.institution}</div>
                <div className="text-sm text-gray-500">{exp.duration}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Education */}
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm mt-6">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center">
            <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M12 14l9-5-9-5-9 5 9 5z" />
              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
            </svg>
            Education
          </h3>
          <div className="space-y-4">
            {profile.education.map((edu, index) => (
              <div key={index} className="border-l-2 border-blue-200 pl-4 py-1">
                <div className="font-medium text-gray-800">{edu.degree}</div>
                <div className="text-sm text-gray-600">{edu.institution}</div>
                <div className="text-sm text-gray-500">{edu.year}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Publications */}
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm mt-6">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center">
            <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Publications
          </h3>
          <div className="space-y-4">
            {profile.publications.map((pub, index) => (
              <div key={index} className="border-l-2 border-blue-200 pl-4 py-1">
                <div className="font-medium text-gray-800">{pub.title}</div>
                <div className="text-sm text-gray-600">{pub.journal}</div>
                <div className="text-sm text-gray-500">{pub.year}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Buttons at the bottom */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onEdit}
            className="px-5 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium"
          >
            Edit Profile
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}