export interface Experience {
  position: string;
  institution: string;
  duration: string;
}

export interface Education {
  degree: string;
  institution: string;
  year: number;
}

export interface Publication {
  title: string;
  journal: string;
  year: number;
}

export interface Contact {
  email: string;
  phone: string;
}

export interface DoctorProfile {
  name: string;
  title: string;
  location: string;
  experience: Experience[];
  education: Education[];
  publications: Publication[];
  contact: Contact;
}