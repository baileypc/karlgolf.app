// Karl's GIR - TypeScript Type Definitions
// Based on existing PHP backend data structure

export interface Hole {
  holeNumber: number;
  par: 3 | 4 | 5;
  score: number;
  gir: 'y' | 'n';
  putts: number;
  puttDistances: number[];
  fairway: 'y' | 'n' | null; // null for par 3s
  teeShotResult?: 'ob' | 'lost' | 'water' | 'left' | 'right' | 'other' | '';
  shotsToGreen?: number;
  approachDistance?: number;
  penalty?: 'ob' | 'water' | 'lost' | 'wrong' | 'other' | null;
}

export interface RoundStats {
  totalHoles: number;
  totalScore: number;
  totalPar: number;
  toPar: number;
  girsHit: number;
  girPercentage: number;
  totalGirs: number;
  avgProximity: number;
  fairwaysHit: number;
  eligibleFairways: number;
  fairwayPercentage: number;
  totalPutts: number;
  avgPutts: number;
  scrambling: number;
  scramblingPercentage: number;
  penalties: number;
}

// Golf course metadata from RapidAPI
export interface CourseMetadata {
  clubName?: string;
  courseName?: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
  placeId?: string;
  holes?: number;
  par?: number;
  weekdayPrice?: string;
  weekendPrice?: string;
  twilightPrice?: string;
}

// Golf course from RapidAPI response
export interface GolfCourse {
  clubName: string;
  courseName: string;
  latitude: number;
  longitude: number;
  placeId?: string;
  holes?: number;
  par?: number;
  weekdayPrice?: string;
  weekendPrice?: string;
  twilightPrice?: string;
  distance?: number; // Calculated distance from user
}

export interface Round {
  roundId: string;
  courseName: string;
  courseMetadata?: CourseMetadata | null; // Optional GPS/API data
  date: string;
  holes: Hole[];
  stats: RoundStats;
  isComplete: boolean;
  holesCompleted: number;
}

export interface CourseData {
  rounds: Round[];
}

export interface UserRounds {
  totalRounds: number;
  rounds: any[]; // Legacy flat list
  groups: any[]; // Grouped rounds (recent 10)
  cumulative: any; // Cumulative stats
}

export interface User {
  email: string;
  isLoggedIn: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
}

export interface RoundSaveResponse {
  success: boolean;
  message: string;
  roundId?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}
