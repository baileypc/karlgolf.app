// Karl's GIR - CSV Export Utility
// Export round data as downloadable CSV file

interface HoleData {
  holeNumber: number;
  par: number;
  score: number;
  gir: string;
  putts: number;
  puttDistances?: number[];
  fairway?: string | null;
  shotsToGreen?: number;
  penalty?: string;
  proximity?: number;
}

interface RoundData {
  courseName: string;
  holes: HoleData[];
}

/**
 * Convert round data to CSV format and trigger download
 */
export const exportRoundToCSV = (roundData: RoundData): void => {
  const { courseName, holes } = roundData;
  
  // CSV Headers
  const headers = [
    'Hole',
    'Par',
    'Score',
    'GIR',
    'Putts',
    'Putt Distances',
    'Fairway',
    'Penalty',
    'Shots to Green',
    'Proximity (ft)'
  ];
  
  // Convert holes to CSV rows
  const rows = holes.map(hole => [
    hole.holeNumber,
    hole.par,
    hole.score,
    hole.gir?.toUpperCase() || 'N',
    hole.putts,
    hole.puttDistances?.join(';') || '',
    formatFairway(hole.fairway || null),
    hole.penalty || '0',
    hole.shotsToGreen || '',
    hole.proximity || ''
  ]);
  
  // Combine headers and rows
  const csvContent = [
    `Course: ${courseName}`,
    `Date: ${new Date().toLocaleDateString()}`,
    `Total Holes: ${holes.length}`,
    '', // Empty line
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  // Generate filename with course name and date
  const sanitizedCourseName = courseName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `karlsgir_${sanitizedCourseName}_${dateStr}.csv`;
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Format fairway value for CSV
 */
const formatFairway = (fairway: string | null): string => {
  if (!fairway || fairway === 'na') return 'N/A';
  if (fairway === 'l') return 'Left';
  if (fairway === 'c') return 'Center';
  if (fairway === 'r') return 'Right';
  return fairway;
};
