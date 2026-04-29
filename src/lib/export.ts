// Karl's GIR - CSV Export (TypeScript)
// Extracted from shared-utils.js

import type { Hole } from '@/types';
import { calculateRoundStats } from './stats';

export function exportToCSV(holes: Hole[], roundName = 'Round'): void {
  const csv = holes.map(h => {
    const toPar = h.score - h.par;
    const toParStr = toPar === 0 ? 'E' : toPar > 0 ? `+${toPar}` : `${toPar}`;
    const scrambled = h.gir === 'n' && h.score <= h.par;
    
    return [
      h.holeNumber,
      h.par,
      h.score,
      toParStr,
      h.gir === 'y' ? 'Yes' : 'No',
      h.putts,
      h.fairway ? (h.fairway === 'y' ? 'Yes' : 'No') : 'N/A',
      h.proximity || '',
      h.penalty || 'None',
      scrambled ? 'Yes' : 'No',
    ].join(',');
  }).join('\n');

  const header = 'Hole,Par,Score,To Par,GIR,Putts,Fairway,Proximity (yds),Penalty,Scrambled\n';

  // Calculate stats
  const stats = calculateRoundStats(holes);
  const totalToPar = stats.toPar;
  const toParStr = totalToPar === 0 ? 'E' : totalToPar > 0 ? `+${totalToPar}` : `${totalToPar}`;

  const summary = `\n\nROUND SUMMARY\n` +
    `Holes Played,${stats.totalHoles}\n` +
    `Total Score,${stats.totalScore}\n` +
    `Total Par,${stats.totalPar}\n` +
    `To Par,${toParStr}\n` +
    `GIR,${stats.girsHit}/${stats.totalHoles} (${stats.girPercentage?.toFixed(1) || '0.0'}%)\n` +
    `Avg Proximity,${Number(stats.avgProximity || 0).toFixed(1)} feet\n` +
    `Fairways,${stats.fairwaysHit}/${stats.eligibleFairways} (${stats.fairwayPercentage?.toFixed(1) || '0.0'}%)\n` +
    `Total Putts,${stats.totalPutts} (${stats.avgPutts?.toFixed(2) || '0.00'} avg)\n` +
    `Scrambling,${stats.scrambling}/${stats.totalHoles - stats.girsHit} (${Number(stats.scramblingPercentage || 0).toFixed(1)}%)\n` +
    `Penalties,${stats.penalties}\n` +
    `Date,${new Date().toISOString().split('T')[0]}`;

  // Create and download
  const blob = new Blob([header + csv + summary], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;

  const sanitizedRoundName = roundName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const holeCount = holes.length >= 18 ? 18 : 9;
  const dateStr = new Date().toISOString().split('T')[0];
  a.download = `${sanitizedRoundName}_${holeCount}holes_${dateStr}.csv`;

  a.click();
  window.URL.revokeObjectURL(url);
}

export function exportAllRoundsToCSV(rounds: any[]): void {
  // Sort rounds chronologically (oldest first or newest first - usually newest is first in the array already)
  
  const header = 'Date,Course,Hole,Par,Score,To Par,GIR,Putts,Fairway,Proximity (yds),Penalty,Scrambled\n';
  
  let csv = '';
  
  rounds.forEach(round => {
    const course = `"${(round.courseName || 'Unknown Course').replace(/"/g, '""')}"`;
    const date = round.date || '';
    
    if (!round.holes || !Array.isArray(round.holes)) return;
    
    round.holes.forEach((h: Hole) => {
      const toPar = h.score - h.par;
      const toParStr = toPar === 0 ? 'E' : toPar > 0 ? `+${toPar}` : `${toPar}`;
      const scrambled = h.gir === 'n' && h.score <= h.par;
      
      const row = [
        date,
        course,
        h.holeNumber,
        h.par,
        h.score,
        toParStr,
        h.gir === 'y' ? 'Yes' : 'No',
        h.putts,
        h.fairway ? (h.fairway === 'y' ? 'Yes' : 'No') : 'N/A',
        h.proximity || '',
        h.penalty || 'None',
        scrambled ? 'Yes' : 'No',
      ];
      
      csv += row.join(',') + '\n';
    });
  });

  // Create and download
  const blob = new Blob([header + csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;

  const dateStr = new Date().toISOString().split('T')[0];
  a.download = `karls-gir-all-rounds-${dateStr}.csv`;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export function exportRoundToCSV({ courseName, holes }: { courseName: string; holes: Hole[] | readonly any[] }): void {
  exportToCSV(holes as Hole[], courseName);
}
