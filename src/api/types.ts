// Shapes recovered from the original app's bundle. Every field the original
// does not guarantee is optional; screens must tolerate missing data.

export interface User {
  id: string | number;
  name: string;
  email?: string;
  role?: string;
  isDefaultPassword?: boolean;
  registrationNo?: string;
  degree?: string | { name?: string };
  batch?: string | { name?: string };
  section?: string | { name?: string; label?: string };
  departmentName?: string;
  currentSemester?: string | { name?: string; season?: string; year?: number | string };
  totalCreditHours?: number;
  totalContactHours?: number;
  createdAt?: string;
}

export interface Course {
  name: string;
  courseCode?: string;
  abbreviation?: string | null;
  creditHours?: number;
  contactHours?: number;
  isLab?: boolean;
}

export interface Instructor {
  name?: string;
  profilePic?: string | null;
  designation?: string | null;
}

export interface Section {
  id: string | number;
  sectionLabel?: string;
  label?: string;
  shift?: string;
  course: Course;
  instructor?: Instructor | null;
}

export interface Enrollment {
  id?: string | number;
  enrollmentId?: string | number;
  enrollmentStatus: 'enrolled' | 'pending' | 'rejected' | string;
  section: Section;
}

export interface AssessmentResult {
  assessmentId: string | number;
  title: string;
  type?: string;
  weightage?: number;
  totalMarksObtained?: number | null;
  maxTotalMarks?: number;
  percentage?: number | string | null;
  status?: string;
}

export interface Performance {
  assessments?: AssessmentResult[];
  overallPercentage?: number | string;
  totalMarksObtained?: number;
  totalMaxMarks?: number | string;
  finalGrade?: string | null;
}

export interface TimetableEntry {
  id: string | number;
  type?: 'class' | 'break' | string;
  startTime: string;
  endTime: string;
  location?: string | null;
  course?: Course;
  instructor?: Instructor | null;
  sectionLabel?: string;
  courseInstanceSectionId?: string | number;
}

export type Timetable = Partial<Record<
  'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday',
  TimetableEntry[]
>>;

export interface NoticeFile {
  id?: string | number;
  url: string;
  mimeType?: string;
  name?: string;
}

export interface Notice {
  id: string | number;
  title: string;
  description?: string;
  creatorName?: string;
  createdAt?: string;
  files?: NoticeFile[];
}

export interface NoticePage {
  notices: Notice[];
  hasMore?: boolean;
}

export interface TranscriptCourse {
  courseName: string;
  courseCode?: string;
  sectionLabel?: string;
  shift?: string;
  grade?: string | null;
  creditHours?: number;
}

export interface TranscriptSemester {
  semesterId: string | number;
  semester?: string;
  season?: string;
  year?: number | string;
  creditHours?: number;
  gpa?: number | string | null;
  courses: TranscriptCourse[];
}

export interface Transcript {
  semesters: TranscriptSemester[];
  cgpa?: number | string | null;
  totalCreditHours?: number;
}
