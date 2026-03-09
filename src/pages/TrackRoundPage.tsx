import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faPencil, faTrash, faDownload } from '@fortawesome/free-solid-svg-icons';
import { roundsAPI } from '@/lib/api';
import { exportRoundToCSV } from '@/lib/csv-export';
import type { Hole as APIHole, CourseMetadata } from '@/types';
import IconNav from '../components/IconNav';
import Modal, { useModal } from '../components/Modal';
import { useAuth } from '@/hooks/useAuth';
import Analytics from '@/lib/analytics';
import CourseSelector from '../components/CourseSelector';

// Local hole type with detailed fairway tracking
interface LocalHole {
  holeNumber: number;
  par: 3 | 4 | 5;
  score: number;
  gir: 'y' | 'n';
  putts: number;
  puttDistances: number[];
  fairway?: 'l' | 'c' | 'r' | 'na' | 'rough'; // left, center, right, not applicable, rough/trees
  shotsToGreen?: number;
  penalty?: string;
  proximity?: number;
}

// Convert local hole format to API format
const convertToAPIHole = (localHole: LocalHole): APIHole => {
  // Convert detailed fairway tracking to API format
  let apiFairway: 'y' | 'n' | null;
  if (localHole.par === 3) {
    apiFairway = null; // Par 3s don't have fairways
  } else if (!localHole.fairway) {
    apiFairway = 'n'; // Default to missed if not set
  } else if (localHole.fairway === 'na' || localHole.fairway === 'rough') {
    apiFairway = 'n'; // Hazard or Rough = missed fairway
  } else if (localHole.fairway === 'c' || localHole.fairway === 'l' || localHole.fairway === 'r') {
    apiFairway = 'y'; // Left, Center, or Right = hit fairway
  } else {
    apiFairway = 'n'; // Unknown/missing = missed fairway
  }

  return {
    holeNumber: localHole.holeNumber,
    par: localHole.par,
    score: localHole.score,
    gir: localHole.gir, // Keep as 'y'/'n' string
    putts: localHole.putts,
    puttDistances: localHole.puttDistances,
    fairway: apiFairway, // Keep as 'y'/'n'/null string
    shotsToGreen: localHole.shotsToGreen,
    penalty: null, // Penalty is stored in score, not sent separately
    proximity: localHole.proximity,
  };
};

export default function TrackRoundPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn } = useAuth();
  const queryClient = useQueryClient();
  const [holes, setHoles] = useState<LocalHole[]>([]);
  const [currentHole, setCurrentHole] = useState(1);
  const [courseName, setCourseName] = useState('');
  const [courseMetadata, setCourseMetadata] = useState<CourseMetadata | null>(null);
  const [roundStarted, setRoundStarted] = useState(false);
  const [coursePar, setCoursePar] = useState<number | null>(null);
  const [serverIncompleteRound, setServerIncompleteRound] = useState<any>(null);
  const [editingRoundNumber, setEditingRoundNumber] = useState<number | null>(null);

  // Modal states
  const discardModal = useModal();
  const saveNineModal = useModal();
  const endRoundIncompleteModal = useModal();
  const endRoundCompleteModal = useModal();
  const accountPromptModal = useModal(); // New: prompt guest to create account
  const validationErrorModal = useModal(); // Validation error modal
  const [modalMessage, setModalMessage] = useState<string | React.ReactNode>('');
  const [modalAction, setModalAction] = useState<() => Promise<void> | void>(() => { });
  const [validationError, setValidationError] = useState('');


  // View holes modal
  const viewHolesModal = useModal();
  const [editingHole, setEditingHole] = useState<number | null>(null); // Hole number being edited
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevent double-submission

  // Form state for current hole
  const [par, setPar] = useState<number | null>(null);
  const [gir, setGir] = useState<'y' | 'n' | null>(null);
  const [putts, setPutts] = useState<number | null>(null);
  const [puttDistances, setPuttDistances] = useState<number[]>([]);
  const [fairway, setFairway] = useState<'l' | 'c' | 'r' | 'na' | 'rough' | null>(null);
  const [shotsToGreen, setShotsToGreen] = useState<number | null>(null);
  const [penalty, setPenalty] = useState('');
  const [teePenalty, setTeePenalty] = useState(''); // Tee-shot hazard penalty (Par 4/5 only)
  const [proximity, setProximity] = useState<number | null>(null);

  const [activeCard, setActiveCard] = useState<number>(1); // 1: Par, 2: Tee, 3: Approach, 4: Result, 5: Green
  const [isStatsExpanded, setIsStatsExpanded] = useState<boolean>(false);

  // Check server for incomplete rounds on mount (only when logged in)
  const { data: incompleteData, refetch: refetchIncomplete } = useQuery({
    queryKey: ['incompleteRounds'],
    queryFn: () => roundsAPI.getIncompleteRounds(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: isLoggedIn, // Only query when user is logged in
    retry: 1,
    refetchOnMount: true, // Always refetch when component mounts
  });

  // Refetch incomplete rounds when user logs in
  useEffect(() => {
    if (isLoggedIn && refetchIncomplete) {
      refetchIncomplete();
    }
  }, [isLoggedIn, refetchIncomplete]);

  // NOTE: Auto-loading incomplete rounds is now DISABLED
  // Incomplete rounds should ONLY be loaded when user clicks "Continue Round" from Dashboard
  // This effect only stores the server incomplete round reference for later use
  useEffect(() => {
    if (!isLoggedIn) return;

    const serverRounds = incompleteData?.success ? incompleteData.incompleteRounds : null;
    const firstServer = serverRounds && serverRounds.length > 0 ? serverRounds[0] : null;
    if (firstServer) setServerIncompleteRound(firstServer);
  }, [location.state, incompleteData, isLoggedIn]);

  // Handle editing a completed round from Dashboard
  useEffect(() => {
    const state = location.state as { editRound?: boolean; roundData?: any; roundNumber?: number } | null;
    if (!state?.editRound || !state.roundData) return;

    // Clear the navigation state to prevent re-loading on refresh
    navigate(location.pathname, { replace: true, state: {} });

    const rd = state.roundData;
    setEditingRoundNumber(state.roundNumber ?? null);
    setCourseName(rd.courseName || '');
    setCourseMetadata(rd.courseMetadata || null);
    if (rd.coursePar) setCoursePar(rd.coursePar);

    // Convert API holes back to LocalHole format
    const loadedHoles: LocalHole[] = (rd.holes || []).map((h: any) => ({
      holeNumber: h.holeNumber,
      par: h.par,
      score: h.score,
      gir: h.gir || 'n',
      putts: h.putts || 0,
      puttDistances: h.puttDistances || [],
      fairway: h.fairway === 'y' ? 'c' : h.fairway === 'n' ? 'rough' : h.fairway || undefined,
      shotsToGreen: h.shotsToGreen,
      penalty: h.penalty || '',
      proximity: h.proximity || 0,
    }));

    setHoles(loadedHoles);
    setCurrentHole(loadedHoles.length + 1);
    setRoundStarted(true);

    // Open view holes modal so user can pick which hole to edit
    setTimeout(() => viewHolesModal.open(), 100);
  }, []);

  // Auto-recover round from localStorage on page refresh / accidental swipe
  // This ensures in-progress rounds survive a page reload
  useEffect(() => {
    // Don't override if round is already loaded
    if (holes.length > 0 || roundStarted) return;

    const localRoundRaw = localStorage.getItem('karlsGIR_currentRound');
    if (!localRoundRaw) return;

    try {
      const localData = JSON.parse(localRoundRaw);
      if (localData && localData.roundStarted) {
        // Restore completed holes (if any)
        if (localData.holes && localData.holes.length > 0) {
          setHoles(localData.holes);
          setCurrentHole(localData.holes.length + 1);
        }
        setCourseName(localData.courseName || '');
        setCourseMetadata(localData.courseMetadata || null);
        if (localData.coursePar) setCoursePar(localData.coursePar);
        setRoundStarted(true);

        // Restore in-progress form state (half-entered hole)
        if (localData.formState) {
          const f = localData.formState;
          if (f.par !== undefined) setPar(f.par);
          if (f.gir !== undefined) setGir(f.gir);
          if (f.putts !== undefined) setPutts(f.putts);
          if (f.puttDistances) setPuttDistances(f.puttDistances);
          if (f.fairway !== undefined) setFairway(f.fairway);
          if (f.shotsToGreen !== undefined) setShotsToGreen(f.shotsToGreen);
          if (f.penalty !== undefined) setPenalty(f.penalty);
          if (f.proximity !== undefined) setProximity(f.proximity);
        }
      }
    } catch (e) {
      console.error('Error recovering round from localStorage:', e);
    }
  }, []); // Empty deps = runs once on mount

  // Load incomplete round ONLY when navigated from Dashboard with continueRound flag
  useEffect(() => {
    const state = location.state as { continueRound?: boolean } | null;
    if (!state?.continueRound) return; // Only load if explicitly requested

    // Clear the navigation state to prevent re-loading on refresh
    navigate(location.pathname, { replace: true, state: {} });

    const localRoundRaw = localStorage.getItem('karlsGIR_currentRound');
    let localData: any = null;
    if (localRoundRaw) {
      try {
        localData = JSON.parse(localRoundRaw);
      } catch (e) {
        console.error('Error parsing localStorage:', e);
      }
    }

    // For logged-in users, check both localStorage and server
    if (isLoggedIn) {
      const serverRounds = incompleteData?.success ? incompleteData.incompleteRounds : null;
      const firstServer = serverRounds && serverRounds.length > 0 ? serverRounds[0] : null;

      if (firstServer && firstServer.holes && firstServer.holes.length > 0) {
        const serverHoleCount = firstServer.holes.length;
        const localHoleCount = localData?.holes?.length || 0;
        const sameCourse = localData && localData.courseName === firstServer.courseName;

        // Prefer localStorage if it's more recent (e.g., after a delete operation)
        const localLastUpdated = localData?.lastUpdated ? new Date(localData.lastUpdated).getTime() : 0;
        const isLocalRecent = localData && localData.lastUpdated && localLastUpdated > Date.now() - 10000;
        const localHasFewerHoles = sameCourse && localHoleCount < serverHoleCount && localHoleCount > 0;

        const preferLocal = isLocalRecent || localHasFewerHoles;

        if (preferLocal && localData && localData.holes && localData.holes.length > 0) {
          // Use localStorage
          setHoles(localData.holes);
          setCurrentHole(localData.holes.length + 1);
          setCourseName(localData.courseName || '');
          setRoundStarted(true);
          return;
        } else {
          // Use server data
          const serverHoles: any[] = firstServer.holes.map((h: any) => ({
            holeNumber: h.holeNumber,
            par: h.par,
            score: h.score,
            gir: h.gir,
            putts: h.putts,
            puttDistances: h.puttDistances || [],
            fairway: h.fairway === 'y' ? 'c' : h.fairway === 'n' ? 'rough' : undefined,
            shotsToGreen: h.shotsToGreen,
            penalty: h.penalty || '',
            proximity: h.proximity,
          }));
          setHoles(serverHoles);
          setCurrentHole(serverHoles.length + 1);
          setCourseName(firstServer.courseName || '');
          setRoundStarted(true);
          localStorage.setItem('karlsGIR_currentRound', JSON.stringify({
            holes: serverHoles,
            courseName: firstServer.courseName,
            roundStarted: true,
            lastUpdated: new Date().toISOString(),
          }));
          return;
        }
      }
    }

    // For guest users or if no server data, use localStorage
    if (localData && localData.holes && localData.holes.length > 0) {
      setHoles(localData.holes);
      setCurrentHole(localData.holes.length + 1);
      setCourseName(localData.courseName || '');
      setRoundStarted(true);
    }
  }, [location, navigate, isLoggedIn, incompleteData]);

  // Persist to localStorage whenever state changes (both guest & logged-in for continuity)
  // Includes form state so half-entered holes survive refresh
  useEffect(() => {
    if (holes.length > 0 || roundStarted) {
      localStorage.setItem('karlsGIR_currentRound', JSON.stringify({
        holes,
        courseName,
        courseMetadata,
        coursePar,
        roundStarted,
        formState: {
          par,
          gir,
          putts,
          puttDistances,
          fairway,
          shotsToGreen,
          penalty,
          proximity,
        },
        lastUpdated: new Date().toISOString(),
      }));
    }
  }, [holes, courseName, courseMetadata, coursePar, roundStarted, par, gir, putts, puttDistances, fairway, shotsToGreen, penalty, proximity]);

  // Helper function to show alert modal


  // Auto-sync putt distances array when putts count changes
  useEffect(() => {
    if (putts !== null) {
      const newDistances = Array(putts).fill(0).map((_, i) => puttDistances[i] || 0);
      setPuttDistances(newDistances);
    }
  }, [putts]);

  const handleCourseSelected = (name: string, metadata: CourseMetadata | null) => {
    setCourseName(name);
    setCourseMetadata(metadata);
    setRoundStarted(true);

    // Track round start event
    const roundType = isLoggedIn ? 'registered' : 'live';
    const userHash = isLoggedIn ? localStorage.getItem('userHash') : null;
    Analytics.trackRoundEvent('start', roundType, userHash, 0, false);
  };

  const loadHoleForEditing = (holeNumber: number) => {
    const hole = holes.find(h => h.holeNumber === holeNumber);
    if (!hole) {
      return;
    }

    // Load hole data into form
    // IMPORTANT: Set editingHole to the actual hole number being edited, not currentHole
    setEditingHole(holeNumber);
    // Set par FIRST so form fields render correctly based on par value
    setPar(hole.par);
    setGir(hole.gir);
    setPutts(hole.putts);
    setPuttDistances(hole.puttDistances);
    setFairway(hole.fairway || null);
    setShotsToGreen(hole.shotsToGreen || null);
    setPenalty(hole.penalty || '');
    setProximity(hole.proximity || null);
    // Don't change currentHole - it should stay as the next hole to be entered

    // Close modal and scroll to form
    viewHolesModal.close();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteHole = async (holeNumber: number) => {
    // Close viewHolesModal first to avoid z-index conflicts
    viewHolesModal.close();

    // Use modal for delete confirmation instead of browser confirm
    setModalMessage(`Delete hole ${holeNumber}? This cannot be undone.`);
    setModalAction(() => async () => {
      await performDeleteHole(holeNumber);
    });

    // Small delay to ensure viewHolesModal is fully closed
    setTimeout(() => {
      discardModal.open();
    }, 50);
  };

  const performDeleteHole = async (holeNumber: number) => {

    // Remove hole and renumber subsequent holes
    const newHoles = holes
      .filter(h => h.holeNumber !== holeNumber)
      .map(h => h.holeNumber > holeNumber ? { ...h, holeNumber: h.holeNumber - 1 } : h);

    // If this was the last hole, clear the round but keep roundStarted=true
    // so the modal doesn't disappear
    if (newHoles.length === 0) {
      // Clear localStorage
      localStorage.removeItem('karlsGIR_currentRound');

      // Reset state but KEEP roundStarted=true so UI doesn't switch
      setHoles([]);
      setCurrentHole(1);
      // DON'T reset roundStarted - it will cause the component to re-render
      // and switch to the "Start Round" view, closing the modal

      // If logged in, delete the incomplete round from server
      if (isLoggedIn) {
        try {
          await roundsAPI.deleteIncompleteRound();
          queryClient.invalidateQueries({ queryKey: ['incompleteRounds'] });
        } catch (error) {
          console.error('Error deleting incomplete round from server:', error);
          // Don't show error - round is already cleared locally
        }
      }

      return; // Exit early
    }

    // Update state immediately
    setHoles(newHoles);
    setCurrentHole(newHoles.length + 1);

    // Update localStorage immediately (before server save)
    localStorage.setItem('karlsGIR_currentRound', JSON.stringify({
      holes: newHoles,
      courseName,
      courseMetadata,
      roundStarted,
      lastUpdated: new Date().toISOString(),
    }));

    // If logged in, save to server
    if (isLoggedIn) {
      try {
        const apiData: any = {
          courseName: courseName.trim(),
          courseMetadata: courseMetadata,
          holes: newHoles.map(convertToAPIHole),
        };
        // API returns 'index' not 'roundIndex'
        if (serverIncompleteRound?.index !== undefined) {
          apiData.mergeIntoRoundId = serverIncompleteRound.index;
        }
        const result = await roundsAPI.saveRound(apiData);

        // Invalidate incomplete rounds query to refresh the list
        if (result.success) {
          queryClient.invalidateQueries({ queryKey: ['incompleteRounds'] });
          // Refetch to get updated data from server
          await queryClient.refetchQueries({ queryKey: ['incompleteRounds'] });
        } else {
          throw new Error('Server save failed');
        }
      } catch (error: any) {
        console.error('Error saving after delete:', error);
        const errorMsg = error?.response?.data?.message || error?.message || 'Unknown error';
        console.error('Server error details:', errorMsg);
        setValidationError(`⚠️ Could not save to server. Data saved locally. Error: ${errorMsg}`);
        validationErrorModal.open();
      }
    }
  };

  const handleSubmitHole = async () => {
    // Prevent double-submission
    if (isSubmitting) {
      return;
    }
    setIsSubmitting(true);

    try {
      // Validation - check fields in order and show specific error
      if (par === null) {
        setValidationError('Please select a par');
        validationErrorModal.open();
        setIsSubmitting(false);
        return;
      }

      // For Par 4 and 5, check fairway first
      if (par === 4 || par === 5) {
        if (fairway === null) {
          setValidationError('Please select fairway result');
          validationErrorModal.open();
          setIsSubmitting(false);
          return;
        }
        // For par 4/5, penalty is optional (can have fairway without penalty)
        // No validation needed here - penalty is separate from fairway
      }

      // Determine if GIR should be 'n' (either explicitly set or auto-set for penalty +2/+3)
      const isGirNo = gir === 'n' || (penalty === '2' || penalty === '3');

      // GIR validation - only required if not auto-set by penalty +2/+3
      if (gir === null && !(penalty === '2' || penalty === '3')) {
        setValidationError('Please select GIR result');
        validationErrorModal.open();
        setIsSubmitting(false);
        return;
      }

      // Shots to Green validation (required if GIR is 'n' - either explicitly or auto-set)
      if (isGirNo && shotsToGreen === null) {
        setValidationError('Please enter shots to green');
        validationErrorModal.open();
        setIsSubmitting(false);
        return;
      }


      if (putts === null || putts === 0) {
        setValidationError('Please enter number of putts');
        validationErrorModal.open();
        setIsSubmitting(false);
        return;
      }
      if (puttDistances.length !== putts || puttDistances.some(d => d === 0)) {
        setValidationError('Please enter all putt distances');
        validationErrorModal.open();
        setIsSubmitting(false);
        return;
      }

      // Create hole object
      // Score calculation:
      // - GIR = Yes: Tee shot reached green, so score = (par - 2) + putts + penalties
      //   Example Par 3: (3 - 2) + 2 putts = 3 (par)
      // - GIR = No: Tee shot (1) + additional shots to green + putts + penalties
      //   Example Par 3: 1 (tee) + 1 (second shot) + 2 putts = 4
      const teePenaltyNum = parseInt(teePenalty || '0');
      let score: number;
      if (gir === 'y') {
        // GIR: Tee shot reached green (par - 2 shots) + putts + any tee penalty
        score = (par - 2) + putts + teePenaltyNum + parseInt(penalty || '0');
      } else {
        // No GIR: Tee shot (1) + additional shots to green + putts + tee penalty + approach penalty
        const additionalShots = shotsToGreen || 0;
        score = 1 + additionalShots + putts + teePenaltyNum + parseInt(penalty || '0');
      }

      // Use editingHole if editing, otherwise use currentHole for new holes
      // IMPORTANT: Capture editingHole value at the start to avoid closure issues
      const isEditing = editingHole !== null;
      const holeNumber = isEditing ? editingHole! : currentHole;

      const hole: LocalHole = {
        holeNumber: holeNumber,
        par: par as 3 | 4 | 5, // Assert par is one of the valid values
        score,
        gir: gir || 'n', // Default to 'n' if null (e.g., hazard +2/+3)
        putts,
        puttDistances,
        fairway: par === 3 ? 'na' : fairway!,
        shotsToGreen: shotsToGreen || undefined,
        penalty: teePenaltyNum > 0 || parseInt(penalty || '0') > 0
          ? String(teePenaltyNum + parseInt(penalty || '0'))
          : undefined,
        proximity: proximity || undefined,
      };

      // Store whether we're editing before clearing the state
      const wasEditing = editingHole !== null;
      const editingHoleNumber = editingHole; // Store the hole number we're editing

      let newHoles: LocalHole[];
      if (wasEditing && editingHoleNumber !== null) {
        // Update existing hole - find and replace the specific hole
        const holeIndex = holes.findIndex(h => h.holeNumber === editingHoleNumber);
        if (holeIndex !== -1) {
          // Replace the hole at the found index
          newHoles = [...holes];
          newHoles[holeIndex] = hole;
        } else {
          // Hole not found (shouldn't happen), but fallback to map
          newHoles = holes.map(h => h.holeNumber === editingHoleNumber ? hole : h);
        }
        setEditingHole(null); // Clear editing state
      } else {
        // Add new hole
        newHoles = [...holes, hole];
      }
      setHoles(newHoles);

      // Save to API immediately (only if logged in)
      if (isLoggedIn) {
        try {
          const roundData: any = {
            courseName: courseName.trim(), // Ensure course name is trimmed
            courseMetadata: courseMetadata,
            holes: newHoles.map(convertToAPIHole),
          };
          // Add merge round ID if we're continuing an existing round
          // API returns 'index' not 'roundIndex'
          if (serverIncompleteRound?.index !== undefined) {
            roundData.mergeIntoRoundId = serverIncompleteRound.index;
          }

          const result = await roundsAPI.saveRound(roundData);

          // Invalidate incomplete rounds query to refresh the list
          if (result.success) {
            queryClient.invalidateQueries({ queryKey: ['incompleteRounds'] });
          }
        } catch (error: any) {
          console.error('[Save] Failed to save hole to server:', error);

          // Handle account not found error - user needs to log out and back in
          if (error?.code === 'ACCOUNT_NOT_FOUND' || error?.code === 'ACCOUNT_INVALID') {
            setValidationError('⚠️ Your session is invalid. Please log out and log back in.');
            validationErrorModal.open();
          } else {
            // Continue anyway - localStorage will persist the data
            setValidationError('⚠️ Could not save to server. Data saved locally.');
            validationErrorModal.open();
          }
        }
      } else {
        // Guest mode - data only in localStorage

        // Show account creation prompt after 9+ holes for guests
        if (newHoles.length === 9 && !wasEditing) {
          accountPromptModal.open();
        }
      }

      // Move to next hole (only if not editing)
      if (!wasEditing) {
        setCurrentHole(currentHole + 1);
      }

      // Reset form (only if not editing - when editing, form should stay cleared)
      // This prevents accidental double-submission
      setPar(null);
      setGir(null);
      setPutts(null);
      setPuttDistances([]);
      setFairway(null);
      setShotsToGreen(null);
      setPenalty('');
      setTeePenalty('');
      setProximity(null);
      setActiveCard(1);

      // If we were editing, also ensure editingHole is cleared (redundant but safe)
      if (wasEditing) {
        setEditingHole(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateStats = () => {
    if (holes.length === 0) {
      return {
        totalHoles: 0,
        totalStrokes: 0,
        girPct: 0,
        fairwayPct: '0.0',
        fairwayDisplay: 'N/A',
        fairwaysHit: 0,
        eligibleFairways: 0,
        scramblingPct: 0,
        avgApproach: 'N/A',
        approachCategories: {
          '0-50': { range: '0-50', attempts: 0, hits: 0, girPct: '0.0' },
          '50-100': { range: '50-100', attempts: 0, hits: 0, girPct: '0.0' },
          '100-150': { range: '100-150', attempts: 0, hits: 0, girPct: '0.0' },
          '150+': { range: '150+', attempts: 0, hits: 0, girPct: '0.0' },
        },
      };
    }

    const girs = holes.filter(h => h.gir === 'y').length;
    // Fairway calculation: Only par 4/5 holes are eligible for fairway stats
    // 'l' (left), 'c' (center), 'r' (right) all count as hits
    // 'na' (hazard), 'rough' (rough/trees), or undefined count as misses
    const par45Holes = holes.filter(h => h.par && (h.par === 4 || h.par === 5));
    const par45HolesCount = par45Holes.length;
    // Count fairways hit: left, center, or right all count as hits
    const fairwaysHit = par45Holes.filter(h => h.fairway && ['l', 'c', 'r'].includes(h.fairway)).length;
    const totalPutts = holes.reduce((sum, h) => sum + h.putts, 0);
    const totalStrokes = holes.reduce((sum, h) => sum + h.score, 0);
    const missedGirs = holes.filter(h => h.gir !== 'y');
    const scrambles = missedGirs.filter(h => h.par - (h.shotsToGreen || 0) === 1).length;

    // Calculate fairway percentage
    // If no par 4/5 holes yet, show "N/A" or 0.0%
    // Otherwise: (fairways hit / eligible fairways) * 100
    let fairwayPct: string;
    let fairwayDisplay: string;
    if (par45HolesCount === 0) {
      fairwayPct = '0.0';
      fairwayDisplay = 'N/A';
    } else {
      const pct = (fairwaysHit / par45HolesCount) * 100;
      fairwayPct = pct.toFixed(1);
      fairwayDisplay = `${fairwaysHit}/${par45HolesCount}`;
    }

    // Calculate approach categories
    const approachCategories: Record<string, { range: string; attempts: number; hits: number; girPct: string }> = {
      '0-50': { range: '0-50', attempts: 0, hits: 0, girPct: '0.0' },
      '50-100': { range: '50-100', attempts: 0, hits: 0, girPct: '0.0' },
      '100-150': { range: '100-150', attempts: 0, hits: 0, girPct: '0.0' },
      '150+': { range: '150+', attempts: 0, hits: 0, girPct: '0.0' },
    };

    holes.forEach((h) => {
      if (h.proximity && h.proximity > 0) {
        const isHit = h.gir === 'y';
        if (h.proximity <= 50) {
          approachCategories['0-50'].attempts++;
          if (isHit) approachCategories['0-50'].hits++;
        } else if (h.proximity <= 100) {
          approachCategories['50-100'].attempts++;
          if (isHit) approachCategories['50-100'].hits++;
        } else if (h.proximity <= 150) {
          approachCategories['100-150'].attempts++;
          if (isHit) approachCategories['100-150'].hits++;
        } else {
          approachCategories['150+'].attempts++;
          if (isHit) approachCategories['150+'].hits++;
        }
      }
    });

    Object.keys(approachCategories).forEach((key) => {
      const cat = approachCategories[key];
      if (cat.attempts > 0) {
        cat.girPct = ((cat.hits / cat.attempts) * 100).toFixed(1);
      }
    });

    return {
      totalHoles: holes.length,
      totalStrokes: totalStrokes,
      girPct: ((girs / holes.length) * 100).toFixed(1),
      fairwayPct: fairwayPct,
      fairwayDisplay: fairwayDisplay, // e.g., "3/6" for 3 hits out of 6 eligible
      fairwaysHit: fairwaysHit,
      eligibleFairways: par45HolesCount,
      avgPutts: (totalPutts / holes.length).toFixed(1),
      scramblingPct: missedGirs.length > 0 ? ((scrambles / missedGirs.length) * 100).toFixed(1) : '0.0',
      avgApproach: (() => {
        const approachHoles = holes.filter(h => h.proximity && h.proximity > 0);
        if (approachHoles.length === 0) return 'N/A';
        const avg = approachHoles.reduce((sum, h) => sum + (h.proximity || 0), 0) / approachHoles.length;
        return `${Math.round(avg)}`;
      })(),
      approachCategories,
    };
  };

  const stats = calculateStats();

  // Helper function to get the number of complete nines
  const getCompleteNines = (holeCount: number): number => {
    return Math.floor(holeCount / 9);
  };

  // Ensure round is marked started once holes are present (after async loads)
  useEffect(() => {
    if (holes.length > 0 && !roundStarted) {
      setRoundStarted(true);
    }
  }, [holes, roundStarted]);

  // Show course selector if round not started
  // NOTE: Incomplete rounds are now ONLY shown on Dashboard, not here
  if (!roundStarted) {
    return (
      <>
        <IconNav />
        <div style={{ paddingTop: '76px', padding: '76px 0.25rem 2rem', maxWidth: '900px', margin: '0 auto' }}>
          <div className="container">
            {/* Always show course selector - incomplete rounds are handled on Dashboard */}
            <div className="card">
              <CourseSelector
                onCourseSelected={handleCourseSelected}
                initialCourseName={courseName}
              />
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <IconNav />
      <div style={{ paddingTop: '76px', padding: '76px 1rem 2rem' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          {/* Guest Mode Indicator */}
          {!isLoggedIn && (
            <div style={{
              marginBottom: '1.5rem',
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(221, 237, 210, 0.15)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                <strong>Guest Mode</strong> - Data saved locally on this device only
              </p>
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-primary)', opacity: 0.8 }}>
                Create an account to save your rounds permanently
              </p>
            </div>
          )}

          {/* Header */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h1 style={{ marginBottom: '0.5rem' }}>Track Round</h1>
            <p style={{ opacity: 0.8 }}>
              {courseName} - {editingHole !== null ? `Editing Hole ${editingHole}` : `Hole ${currentHole}`}
            </p>
          </div>

          {/* Course Par Selector */}
          {roundStarted && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', opacity: 0.7, whiteSpace: 'nowrap' }}>Course Par:</span>
                {[68, 69, 70, 71, 72].map((cp) => (
                  <button
                    key={cp}
                    onClick={() => setCoursePar(coursePar === cp ? null : cp)}
                    style={{
                      padding: '0.25rem 0.6rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      borderRadius: '8px',
                      border: '1px solid var(--border-primary)',
                      backgroundColor: coursePar === cp ? 'var(--color-interactive)' : 'transparent',
                      color: coursePar === cp ? '#000' : 'var(--text-primary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      minWidth: '36px',
                      textAlign: 'center' as const,
                    }}
                  >
                    {cp}
                  </button>
                ))}
                {coursePar && holes.length > 0 && (() => {
                  const overUnder = holes.reduce((acc, h) => acc + (h.score - h.par), 0);
                  const color = overUnder > 0 ? '#ff6b6b' : overUnder < 0 ? '#51cf66' : '#51cf66';
                  const label = overUnder > 0 ? `+${overUnder}` : overUnder < 0 ? `${overUnder}` : 'E';
                  return (
                    <span style={{ fontSize: '1rem', fontWeight: '700', color, marginLeft: '0.25rem', alignSelf: 'center' }}>
                      {label}
                    </span>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Hole Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem', padding: '0 0.5rem' }}>
            <h2 style={{ margin: 0 }}>Hole {editingHole !== null ? editingHole : currentHole}</h2>
            {par !== null && (
              <span style={{ fontSize: '0.9rem', opacity: 0.8, color: 'var(--text-primary)' }}>
                {(() => {
                  let runningScore = 1; // Tee shot always counts as 1
                  if (gir === 'y') {
                    // GIR: on green in par - 2 shots
                    runningScore = par - 2;
                  } else if (gir === 'n' && shotsToGreen) {
                    // Missed GIR: tee + additional shots
                    runningScore = 1 + shotsToGreen;
                  }
                  if (putts) runningScore += putts;
                  if (teePenalty) runningScore += parseInt(teePenalty) || 0;
                  if (penalty) runningScore += parseInt(penalty) || 0;

                  // Only show "1 Stroke" initially, then update as more data comes in
                  if (!gir && !putts && !teePenalty) return `(1 Stroke)`;
                  return `(${runningScore} Stroke${runningScore !== 1 ? 's' : ''})`;
                })()}
              </span>
            )}
          </div>

          {/* CARD 1: Par Selection */}
          {activeCard !== 1 && par !== null ? (
            <div className="collapsed-summary" onClick={() => setActiveCard(1)}>
              <span className="collapsed-summary-label">Hole Par:</span>
              <span><span className="collapsed-summary-value">{par}</span><span className="collapsed-summary-edit">Edit</span></span>
            </div>
          ) : activeCard === 1 && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Par (Tee Shot)</label>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: par !== null ? '1rem' : '0' }}>
                {[3, 4, 5].map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setPar(p);
                      if (p === 3) {
                        setFairway(null);
                        setTeePenalty('');
                        setActiveCard(3); // Skip to Approach (Card 3)
                      } else {
                        setActiveCard(2); // Auto-advance to Tee Shot (Card 2)
                      }
                    }}
                    className="btn btn-secondary"
                    style={{
                      flex: 1,
                      backgroundColor: par === p ? 'var(--color-interactive)' : 'transparent',
                      color: par === p ? '#000' : 'var(--color-interactive)',
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CARD 2: Tee Shot (Fairway / Hazard) */}
          {/* Only relevant for Par 4/5. Par 3 skips to Card 3. */}
          {par !== null && par !== 3 && (
            activeCard !== 2 && (fairway !== null || teePenalty !== '') ? (
              <div className="collapsed-summary" onClick={() => setActiveCard(2)}>
                <span className="collapsed-summary-label">Tee Shot:</span>
                <span>
                  <span className="collapsed-summary-value">
                    {fairway === 'c' || fairway === 'l' || fairway === 'r' ? 'Fairway' : 
                     fairway === 'rough' ? 'Rough/Trees' : 
                     fairway === 'na' ? `Hazard ${teePenalty ? '(+'+teePenalty+')' : ''}` : ''}
                  </span>
                  <span className="collapsed-summary-edit">Edit</span>
                </span>
              </div>
            ) : activeCard === 2 && (
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Tee Shot Result</label>
                
                <div style={{ marginBottom: '0.75rem' }}>
                  <button
                    onClick={() => {
                      // We save 'c' just as a generic fairway hit since L/R are removed
                      setFairway('c');
                      setPenalty('');
                      setTeePenalty('');
                      setGir(null);
                      setActiveCard(3); // Auto-advance
                    }}
                    className="btn btn-secondary"
                    style={{
                      width: '100%',
                      backgroundColor: ['c', 'l', 'r'].includes(fairway || '') ? 'var(--color-interactive)' : 'transparent',
                      color: ['c', 'l', 'r'].includes(fairway || '') ? '#000' : 'var(--color-interactive)',
                      padding: '1rem',
                      fontWeight: 'bold'
                    }}
                  >
                    Hit Fairway
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                  {[
                    { value: 'rough', label: 'Rough/Trees' },
                    { value: 'na', label: 'Hazard' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setFairway(option.value as 'rough' | 'na');
                        setPenalty('');
                        setTeePenalty('');
                        setGir(null);
                        if (option.value === 'rough') {
                           setActiveCard(3); // Rough auto-advances
                        }
                        // Hazard stays on Card 2 to reveal Tee Shot Penalty
                      }}
                      className="btn btn-secondary"
                      style={{
                        backgroundColor: fairway === option.value ? 'var(--color-interactive)' : 'transparent',
                        color: fairway === option.value ? '#000' : 'var(--color-interactive)',
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {fairway === 'na' && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Tee Shot Penalty</label>
                    <div style={{ marginBottom: '0.75rem', fontSize: '0.875rem', opacity: 0.8 }}>
                      OB (+1), Water (+1), Unplayable (+2), or Lost Ball (+1)
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                      {[1, 2, 3].map((strokes) => {
                        const isSelected = teePenalty === strokes.toString();
                        return (
                          <button
                            key={strokes}
                            onClick={() => {
                              const newTeePenalty = isSelected ? '' : strokes.toString();
                              setTeePenalty(newTeePenalty);
                              const girDenied = (par === 4 && strokes >= 1) || (par === 5 && strokes >= 2);
                              if (newTeePenalty && girDenied) {
                                setGir('n');
                              } else {
                                setGir(null);
                              }
                            }}
                            className="btn btn-secondary"
                            style={{
                              flex: 1,
                              backgroundColor: isSelected ? 'var(--color-interactive)' : 'transparent',
                              color: isSelected ? '#000' : 'var(--color-interactive)',
                            }}
                          >
                            +{strokes}
                          </button>
                        );
                      })}
                    </div>
                    {teePenalty !== '' && (
                      <button 
                        className="btn btn-primary" 
                        style={{ width: '100%' }}
                        onClick={() => setActiveCard(3)}
                      >
                        Next
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          )}

          {/* CARD 3: Approach Distance (Setup) */}
          {/* Unlocked if Par is set, and (if par 4/5) fairway is resolved (fairway known, and if hazard, penalty known) */}
          {par !== null && (par === 3 || fairway !== null) && (par === 3 || fairway !== 'na' || teePenalty !== '') && (
            activeCard !== 3 && proximity !== null ? (
              <div className="collapsed-summary" onClick={() => setActiveCard(3)}>
                <span className="collapsed-summary-label">Approach Distance:</span>
                <span><span className="collapsed-summary-value">{proximity} yds</span><span className="collapsed-summary-edit">Edit</span></span>
              </div>
            ) : activeCard === 3 && (
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>
                  Approach Distance <span style={{ fontWeight: 'normal', opacity: 0.6, fontSize: '0.8rem', marginLeft: '0.5rem' }}>(yards, optional)</span>
                </label>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', opacity: 0.7, marginBottom: '0.75rem', fontStyle: 'italic' }}>
                  Distance of the shot intended to hit the green
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="e.g. 150"
                    value={proximity ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setProximity(val === '' ? null : parseInt(val));
                    }}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '2px solid var(--border-primary)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: 'var(--font-base)',
                    }}
                  />
                  <button 
                    className="btn btn-primary"
                    onClick={() => setActiveCard(4)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )
          )}

          {/* CARD 4: Result (GIR, Approach Penalty, Shots to Green) */}
          {par !== null && (par === 3 || fairway !== null) && activeCard >= 4 && (
            activeCard !== 4 && gir !== null ? (
              <div className="collapsed-summary" onClick={() => setActiveCard(4)}>
                <span className="collapsed-summary-label">GIR:</span>
                <span>
                  <span className="collapsed-summary-value">
                    {gir === 'y' ? 'Hit' : `Missed (${shotsToGreen || '?'} shots)`}
                    {penalty ? ` (+${penalty})` : ''}
                  </span>
                  <span className="collapsed-summary-edit">Edit</span>
                </span>
              </div>
            ) : activeCard === 4 && (
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                {/* GIR Buttons (Skip showing if auto-denied by tee penalty) */}
                {!(fairway === 'na' && teePenalty !== '' && ((par === 4 && parseInt(teePenalty) >= 1) || (par === 5 && parseInt(teePenalty) >= 2))) && (
                  <div style={{ marginBottom: gir === 'n' ? '1.5rem' : '0' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Green in Regulation (GIR)</label>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      {[ { value: 'y', label: 'Hit' }, { value: 'n', label: 'Missed' } ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setGir(option.value as 'y' | 'n');
                            if (option.value === 'y') {
                               setActiveCard(5); // Auto jump to putts
                            }
                          }}
                          className="btn btn-secondary"
                          style={{
                            flex: 1,
                            backgroundColor: gir === option.value ? 'var(--color-interactive)' : 'transparent',
                            color: gir === option.value ? '#000' : 'var(--color-interactive)',
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* If GIR is No (either manually chosen or auto-denied) */}
                {(gir === 'n' || (fairway === 'na' && teePenalty !== '' && ((par === 4 && parseInt(teePenalty) >= 1) || (par === 5 && parseInt(teePenalty) >= 2)))) && (
                  <>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Additional Penalties?</label>
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        {['None', '1', '2', '3'].map((opt) => {
                          const strokes = opt === 'None' ? '' : opt;
                          const isSelected = penalty === strokes;
                          return (
                            <button
                              key={opt}
                              onClick={() => setPenalty(isSelected ? '' : strokes)}
                              className="btn btn-secondary"
                              style={{
                                flex: 1,
                                fontSize: '0.85rem',
                                padding: '0.5rem',
                                backgroundColor: isSelected ? 'var(--color-interactive)' : 'transparent',
                                color: isSelected ? '#000' : 'var(--color-interactive)',
                              }}
                            >
                              {opt === 'None' ? 'None' : `+${opt}`}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Approach Shot(s)
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={par === 3 ? 1 : par === 4 ? 2 : 3}
                          value={shotsToGreen ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setShotsToGreen(val === '' ? null : parseInt(val));
                          }}
                          style={{
                            flex: 1,
                            padding: '0.75rem',
                            backgroundColor: 'var(--bg-secondary)',
                            border: '2px solid var(--border-primary)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--text-primary)',
                            fontSize: 'var(--font-base)',
                          }}
                        />
                        <button 
                          className="btn btn-primary"
                          onClick={() => setActiveCard(5)}
                          disabled={!shotsToGreen}
                          style={{ opacity: shotsToGreen ? 1 : 0.5 }}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )
          )}

          {/* CARD 5: The Green (Putting & Finish) */}
          {par !== null && activeCard === 5 && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Number of Putts</label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {[1, 2, 3].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPutts(p)}
                      className="btn btn-secondary"
                      style={{
                        flex: 1,
                        backgroundColor: putts === p ? 'var(--color-interactive)' : 'transparent',
                        color: putts === p ? '#000' : 'var(--color-interactive)',
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {putts !== null && putts > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Putt Distances (feet)</label>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {puttDistances.map((_, index) => (
                      <div key={index} style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', opacity: 0.8 }}>
                          {index === 0 ? '1st' : index === 1 ? '2nd' : '3rd'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={puttDistances[index] || ''}
                          onChange={(e) => {
                            const newDistances = [...puttDistances];
                            newDistances[index] = parseFloat(e.target.value) || 0;
                            setPuttDistances(newDistances);
                          }}
                          placeholder="ft"
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            backgroundColor: 'rgba(221, 237, 210, 0.3)',
                            border: '2px solid var(--border-primary)',
                            borderRadius: '8px',
                            color: '#DDEDD2',
                            fontSize: '1rem',
                            fontWeight: '500',
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSubmitHole();
                  }}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  {editingHole !== null ? `Update Hole ${editingHole}` : `Submit Hole ${currentHole}`}
                </button>
                {editingHole !== null && (
                  <button
                    onClick={() => {
                      setEditingHole(null);
                      setPar(null);
                      setGir(null);
                      setPutts(null);
                      setPuttDistances([]);
                      setFairway(null);
                      setShotsToGreen(null);
                      setPenalty('');
                      setTeePenalty('');
                      setProximity(null);
                      setActiveCard(1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="btn btn-secondary"
                    style={{ width: '100%' }}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Stats Panel (Moved to Bottom) */}
          {holes.length > 0 && (
            <div className="card" style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem' }}>
              <div 
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setIsStatsExpanded(!isStatsExpanded)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Current Round Stats</h2>
                  <span style={{ 
                    fontSize: '0.875rem', 
                    opacity: 0.6, 
                    transition: 'transform 0.2s', 
                    display: 'inline-block', 
                    transform: isStatsExpanded ? 'rotate(180deg)' : 'rotate(0deg)' 
                  }}>▼</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    viewHolesModal.open();
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                >
                  <FontAwesomeIcon icon={faCheckCircle} style={{ marginRight: '0.4rem' }} />
                  View
                </button>
              </div>
              
              {isStatsExpanded && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                  gap: '1rem',
                  marginTop: '1.5rem',
                  borderTop: '1px solid var(--border-primary)',
                  paddingTop: '1.5rem'
                }}>
                  <div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{stats.totalHoles}</div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Holes</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{stats.totalStrokes}</div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Strokes</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{stats.girPct}%</div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>GIR</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>
                      {stats.fairwayDisplay !== 'N/A' ? `${stats.fairwayPct}%` : 'N/A'}
                    </div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
                      Fairway {stats.fairwayDisplay !== 'N/A' && `(${stats.fairwayDisplay})`}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{stats.avgPutts}</div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Avg Putts</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{stats.scramblingPct}%</div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Scrambling</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{stats.avgApproach === 'N/A' ? 'N/A' : `${stats.avgApproach}yd`}</div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Approach</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* End/Pause Round Button */}
          {holes.length > 0 && (
            <>
              <button
                onClick={() => {
                  const completeNines = getCompleteNines(holes.length);
                  const incompleteHoles = holes.length % 9;

                  if (holes.length < 9) {
                    // Less than 9 holes - discard round (no server save, just clear localStorage)
                    setModalMessage(`Discard this round? You have ${holes.length} hole${holes.length !== 1 ? 's' : ''} entered. Minimum 9 holes required to save stats.`);
                    setModalAction(() => async () => {
                      // Just clear localStorage and navigate - no server save for < 9 holes
                      localStorage.removeItem('karlsGIR_currentRound');
                      navigate('/dashboard');
                    });
                    discardModal.open();
                  } else if (incompleteHoles > 0) {
                    // Incomplete nine - only record complete nines
                    setModalMessage(`You've completed ${completeNines * 9} holes. The remaining ${incompleteHoles} hole${incompleteHoles !== 1 ? 's' : ''} will be deleted. Continue?`);
                    setModalAction(() => async () => {
                      // Save only the complete nines to API
                      const holesToSave = holes.slice(0, completeNines * 9).map(convertToAPIHole);
                      try {
                        await roundsAPI.saveRound({
                          courseName,
                          courseMetadata,
                          holes: holesToSave as any,
                          completed: true, // Mark round as completed so it won't show in "Resume Round"
                        } as any);

                        // Track round save event
                        const roundType = isLoggedIn ? 'registered' : 'live';
                        const userHash = isLoggedIn ? localStorage.getItem('userHash') : null;
                        Analytics.trackRoundEvent('save', roundType, userHash, holesToSave.length, true);

                        // Invalidate stats query so dashboard refreshes
                        queryClient.invalidateQueries({ queryKey: ['stats'] });
                        queryClient.invalidateQueries({ queryKey: ['incompleteRounds'] });
                      } catch (error) {
                        console.error('Failed to save round:', error);
                        setValidationError('Failed to save round. Please try again.');
                        validationErrorModal.open();
                        return;
                      }
                      localStorage.removeItem('karlsGIR_currentRound');
                      navigate('/dashboard');
                    });
                    endRoundIncompleteModal.open();
                  } else {
                    // Complete round (9/18/36/54/72)
                    setModalMessage(
                      <div>
                        <div style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>
                          End round and save {holes.length} holes?
                        </div>
                        {Object.values(stats.approachCategories || {}).some(c => c.attempts > 0) && (
                          <div style={{ textAlign: 'left', backgroundColor: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '0.75rem', fontSize: '1rem', color: 'var(--text-primary)' }}>
                              Approach Distance Stats
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
                              {Object.values(stats.approachCategories || {}).map((cat) => (
                                <div key={cat.range} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{cat.range} yds</span>
                                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{cat.hits}/{cat.attempts} GIR</span>
                                    <span style={{ fontWeight: 'bold', minWidth: '3.5rem', textAlign: 'right', color: cat.attempts > 0 ? 'var(--color-interactive)' : 'inherit', opacity: cat.attempts > 0 ? 1 : 0.5 }}>
                                      {cat.attempts > 0 ? `${cat.girPct}%` : 'N/A'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                    setModalAction(() => async () => {
                      // Save all holes to API
                      const holesToSave = holes.map(convertToAPIHole);
                      try {
                        await roundsAPI.saveRound({
                          courseName,
                          courseMetadata,
                          holes: holesToSave as any,
                          completed: true,
                          ...(editingRoundNumber != null ? { replaceRoundNumber: editingRoundNumber } : {}),
                        } as any);

                        // Track round save event
                        const roundType = isLoggedIn ? 'registered' : 'live';
                        const userHash = isLoggedIn ? localStorage.getItem('userHash') : null;
                        Analytics.trackRoundEvent('save', roundType, userHash, holesToSave.length, true);

                        // Invalidate stats query so dashboard refreshes
                        queryClient.invalidateQueries({ queryKey: ['stats'] });
                        queryClient.invalidateQueries({ queryKey: ['incompleteRounds'] });
                      } catch (error) {
                        console.error('Failed to save round:', error);
                        setValidationError('Failed to save round. Please try again.');
                        validationErrorModal.open();
                        return;
                      }
                      localStorage.removeItem('karlsGIR_currentRound');
                      navigate('/dashboard');
                    });
                    endRoundCompleteModal.open();
                  }
                }}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  marginTop: '1.5rem',
                }}
              >
                {holes.length < 9 ? `Discard Round (${holes.length} hole${holes.length !== 1 ? 's' : ''})` : `End Round (${holes.length} holes)`}
              </button>

              {/* Pause Round Button - only for >= 9 holes */}
              {holes.length >= 9 && (
                <button
                  onClick={() => {
                    setModalMessage(`Pause round with ${holes.length} holes? You can continue this round later from the dashboard.`);
                    setModalAction(() => async () => {
                      // Save round WITHOUT completed flag so it can be resumed
                      const holesToSave = holes.map(convertToAPIHole);
                      try {
                        await roundsAPI.saveRound({
                          courseName,
                          courseMetadata,
                          holes: holesToSave as any,
                          ...(editingRoundNumber != null ? { replaceRoundNumber: editingRoundNumber } : {}),
                        } as any);

                        // Invalidate queries so dashboard shows the paused round
                        queryClient.invalidateQueries({ queryKey: ['stats'] });
                        queryClient.invalidateQueries({ queryKey: ['incompleteRounds'] });
                      } catch (error) {
                        console.error('Failed to pause round:', error);
                        setValidationError('Failed to pause round. Please try again.');
                        validationErrorModal.open();
                        return;
                      }
                      // Clear localStorage and navigate to dashboard
                      localStorage.removeItem('karlsGIR_currentRound');
                      navigate('/dashboard');
                    });
                    saveNineModal.open();
                  }}
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    marginTop: '0.75rem',
                  }}
                >
                  Pause Round ({holes.length} holes)
                </button>
              )}

              {/* CSV Export for Guests */}
              {!isLoggedIn && (
                <button
                  onClick={() => {
                    exportRoundToCSV({ courseName, holes });
                  }}
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    marginTop: '0.75rem',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <FontAwesomeIcon icon={faDownload} />
                  Download Round as CSV
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {/* Validation Error Modal */}
      {validationErrorModal.isOpen && (
        <Modal
          isOpen={validationErrorModal.isOpen}
          onClose={validationErrorModal.close}
          title="Validation Error"
          message={validationError || 'Please complete all required fields'}
          type="warning"
          confirmText="OK"
          showCancel={false}
        />
      )}

      <Modal
        isOpen={discardModal.isOpen}
        onClose={() => {
          discardModal.close();
        }}
        onConfirm={async () => {
          // Use modalAction for all cases (delete hole or discard round)
          await modalAction();
        }}
        title={typeof modalMessage === 'string' && modalMessage.includes('Delete hole') ? "Delete Hole?" : "Discard Round?"}
        message={modalMessage || "This will delete your incomplete round. Are you sure?"}
        type="confirm"
        confirmText={typeof modalMessage === 'string' && modalMessage.includes('Delete hole') ? "Delete" : "Discard"}
        cancelText="Cancel"
      />

      <Modal
        isOpen={saveNineModal.isOpen}
        onClose={saveNineModal.close}
        onConfirm={modalAction}
        title="Pause Round?"
        message={modalMessage}
        type="confirm"
        confirmText="Pause Round"
        cancelText="Cancel"
      />

      <Modal
        isOpen={endRoundIncompleteModal.isOpen}
        onClose={endRoundIncompleteModal.close}
        onConfirm={modalAction}
        title="Save Incomplete Round?"
        message={modalMessage}
        type="confirm"
        confirmText="Save & Finish"
        cancelText="Cancel"
      />

      <Modal
        isOpen={endRoundCompleteModal.isOpen}
        onClose={endRoundCompleteModal.close}
        onConfirm={modalAction}
        title="Save Round?"
        message={modalMessage}
        type="success"
        confirmText="Save Round"
        cancelText="Cancel"
      />

      {/* View Holes Modal */}
      {viewHolesModal.isOpen && (
        <div
          onClick={() => viewHolesModal.close()}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            zIndex: 9998,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Solid Black Background */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: '#000000',
                borderRadius: '8px',
                zIndex: 0,
              }}
            />

            {/* Modal Content */}
            <div
              className="card"
              style={{
                position: 'relative',
                zIndex: 1,
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>
                Totals: Holes ({holes.length}) | Strokes ({holes.reduce((sum, h) => sum + h.score, 0)})
              </h2>

              {/* Scrollable Holes List */}
              <div
                style={{
                  overflowY: 'auto',
                  flex: 1,
                  marginBottom: '1rem',
                }}
              >
                {holes.map((hole) => (
                  <div
                    key={hole.holeNumber}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1rem',
                      marginBottom: '0.5rem',
                      backgroundColor: 'rgba(221, 237, 210, 0.1)',
                      borderRadius: '8px',
                      border: '1px solid rgba(221, 237, 210, 0.3)',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                        Hole {hole.holeNumber} - Strokes {hole.score}
                      </div>
                      <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
                        Par {hole.par} • GIR: {hole.gir === 'y' ? 'Yes' : 'No'} • Putts: {hole.putts}
                        {hole.par !== 3 && (
                          <span>
                            {' • '}
                            {hole.fairway && hole.fairway !== 'rough' && (
                              `Fairway: ${hole.fairway === 'c' ? 'Center' : hole.fairway === 'l' ? 'Left' : hole.fairway === 'r' ? 'Right' : ''}`
                            )}
                            {hole.fairway === 'rough' && 'Fairway: Rough/Trees'}
                            {hole.penalty && ` • Hazard +${hole.penalty}`}
                          </span>
                        )}
                        {hole.shotsToGreen && ` • Shots to Green: ${hole.shotsToGreen}`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          loadHoleForEditing(hole.holeNumber);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--color-interactive)',
                          cursor: 'pointer',
                          padding: '0.5rem',
                          fontSize: '1.25rem',
                        }}
                        aria-label="Edit hole"
                      >
                        <FontAwesomeIcon icon={faPencil} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteHole(hole.holeNumber);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '0.5rem',
                          fontSize: '1.25rem',
                        }}
                        aria-label="Delete hole"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Close Button */}
              <button
                onClick={() => viewHolesModal.close()}
                className="btn btn-secondary"
                style={{ width: '100%' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Creation Prompt Modal (Guests only, after 9 holes) */}
      {accountPromptModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={accountPromptModal.close}
        >
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: '12px',
              maxWidth: '500px',
              width: '100%',
              padding: '2rem',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: '1rem', color: 'var(--color-interactive)' }}>
              🎉 Nice Round!
            </h2>

            <p style={{ fontSize: '1.125rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              You've completed 9 holes! Create a free account to:
            </p>

            <div style={{
              textAlign: 'left',
              marginBottom: '2rem',
              backgroundColor: 'rgba(221, 237, 210, 0.1)',
              padding: '1rem',
              borderRadius: '8px'
            }}>
              <div style={{ marginBottom: '0.75rem' }}>✓ Save your rounds across devices</div>
              <div style={{ marginBottom: '0.75rem' }}>✓ Track your stats over time</div>
              <div>✓ Never lose your data</div>
            </div>

            <button
              onClick={() => {
                accountPromptModal.close();
                navigate('/login?register=true');
              }}
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: '0.75rem' }}
            >
              Create Account
            </button>

            <button
              onClick={() => {
                // Export round data as CSV
                exportRoundToCSV({ courseName, holes });
                accountPromptModal.close();
              }}
              className="btn btn-secondary"
              style={{
                width: '100%',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              <FontAwesomeIcon icon={faDownload} />
              Download CSV Instead
            </button>

            <button
              onClick={accountPromptModal.close}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                padding: '0.5rem',
                width: '100%'
              }}
            >
              Maybe Later
            </button>
          </div>
        </div>
      )}
    </>
  );
}










