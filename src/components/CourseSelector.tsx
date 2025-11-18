import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationDot, faGolfBallTee, faPencil, faCheck, faArrowLeft, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import type { GolfCourse, CourseMetadata } from '@/types';
import { searchNearbyGolfCourses, getUserLocation } from '@/lib/golf-course-api';

interface CourseSelectorProps {
  onCourseSelected: (courseName: string, metadata: CourseMetadata | null) => void;
  initialCourseName?: string;
}

type ViewState = 'initial' | 'searching' | 'results' | 'manual';

export default function CourseSelector({ onCourseSelected, initialCourseName = '' }: CourseSelectorProps) {
  const [view, setView] = useState<ViewState>('initial');
  const [courses, setCourses] = useState<GolfCourse[]>([]);
  const [manualCourseName, setManualCourseName] = useState(initialCourseName);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const handleFindNearby = async () => {
    setView('searching');
    setError(null);
    setPermissionDenied(false);

    try {
      // Get user's GPS location - this will trigger the browser prompt automatically
      const position = await getUserLocation();
      const { latitude, longitude } = position.coords;

      // Search for nearby courses
      const result = await searchNearbyGolfCourses({
        latitude,
        longitude,
        miles: 25,
      });

      if (result.courses.length === 0) {
        setError('No golf courses found within 25 miles. Please enter course name manually.');
        setView('manual');
      } else {
        setCourses(result.courses);
        setView('results');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search for courses';

      if (errorMessage === 'PERMISSION_DENIED') {
        setPermissionDenied(true);
      }

      setError(errorMessage);
      setView('manual');
    }
  };

  const handleSelectCourse = (course: GolfCourse) => {
    const displayName = course.courseName 
      ? `${course.clubName} - ${course.courseName}`
      : course.clubName;

    const metadata: CourseMetadata = {
      clubName: course.clubName,
      courseName: course.courseName,
      latitude: course.latitude,
      longitude: course.longitude,
      distance: course.distance,
      placeId: course.placeId,
      holes: course.holes,
      par: course.par,
      weekdayPrice: course.weekdayPrice,
      weekendPrice: course.weekendPrice,
      twilightPrice: course.twilightPrice,
    };

    onCourseSelected(displayName, metadata);
  };

  const handleManualEntry = () => {
    setView('manual');
    setError(null);
  };

  const handleManualConfirm = () => {
    if (manualCourseName.trim()) {
      onCourseSelected(manualCourseName.trim(), null);
    }
  };

  const handleBackToInitial = () => {
    setView('initial');
    setError(null);
    setPermissionDenied(false);
  };

  const handleBackToResults = () => {
    if (courses.length > 0) {
      setView('results');
      setError(null);
      setPermissionDenied(false);
    } else {
      setView('initial');
      setError(null);
      setPermissionDenied(false);
    }
  };

  // INITIAL VIEW
  if (view === 'initial') {
    return (
      <div className="course-selector">
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
          <FontAwesomeIcon icon={faGolfBallTee} style={{ marginRight: '0.5rem' }} />
          Select Golf Course
        </h3>

        {error && error !== 'PERMISSION_DENIED' && (
          <div style={{
            padding: '0.75rem',
            marginBottom: '1rem',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '2px solid #ef4444',
            borderRadius: 'var(--radius-md)',
            color: '#ef4444',
            fontSize: 'var(--font-sm)',
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleFindNearby}
          className="btn btn-primary"
          style={{
            width: '100%',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          <FontAwesomeIcon icon={faLocationDot} />
          Find Nearby Courses
        </button>

        <div style={{
          textAlign: 'center',
          margin: '1rem 0',
          color: 'var(--text-secondary)',
          fontSize: 'var(--font-sm)',
        }}>
          OR
        </div>

        <div style={{ marginBottom: '0.5rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: '500',
            color: 'var(--text-primary)',
          }}>
            Enter Course Name Manually:
          </label>
          <input
            type="text"
            placeholder="e.g., Pebble Beach Golf Links"
            value={manualCourseName}
            onChange={(e) => setManualCourseName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && manualCourseName.trim()) {
                handleManualConfirm();
              }
            }}
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: 'var(--font-base)',
              backgroundColor: 'rgba(221, 237, 210, 0.1)',
              border: '2px solid var(--border-primary)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              marginBottom: '0.5rem',
            }}
          />
          <button
            onClick={handleManualConfirm}
            disabled={!manualCourseName.trim()}
            className="btn btn-secondary"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <FontAwesomeIcon icon={faCheck} />
            Confirm
          </button>
        </div>
      </div>
    );
  }

  // SEARCHING VIEW
  if (view === 'searching') {
    return (
      <div className="course-selector" style={{ textAlign: 'center', padding: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
          <FontAwesomeIcon icon={faLocationDot} style={{ marginRight: '0.5rem' }} />
          Searching for nearby courses...
        </h3>
        <div style={{ fontSize: '3rem', margin: '1rem 0', color: 'var(--text-primary)' }}>
          <FontAwesomeIcon icon={faLocationDot} className="fa-pulse" />
        </div>
        <p style={{ color: 'var(--text-secondary)' }}>Using your location</p>
      </div>
    );
  }

  // RESULTS VIEW
  if (view === 'results') {
    return (
      <div className="course-selector">
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
          <FontAwesomeIcon icon={faLocationDot} style={{ marginRight: '0.5rem' }} />
          Found {courses.length} course{courses.length !== 1 ? 's' : ''} near you
        </h3>

        <div style={{
          maxHeight: '400px',
          overflowY: 'auto',
          marginBottom: '1rem',
          border: '2px solid var(--border-primary)',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'rgba(221, 237, 210, 0.05)',
        }}>
          {courses.map((course, index) => {
            const displayName = course.courseName
              ? `${course.clubName} - ${course.courseName}`
              : course.clubName;

            return (
              <div
                key={`${course.placeId || index}`}
                onClick={() => handleSelectCourse(course)}
                style={{
                  padding: '1rem',
                  borderBottom: index < courses.length - 1 ? '1px solid var(--border-primary)' : 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(221, 237, 210, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ fontWeight: '600', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
                  <FontAwesomeIcon icon={faGolfBallTee} style={{ marginRight: '0.5rem' }} />
                  {displayName}
                </div>
                <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                  <FontAwesomeIcon icon={faLocationDot} style={{ marginRight: '0.25rem' }} />
                  {course.distance?.toFixed(1)} miles away
                  {course.holes && ` • ${course.holes} holes`}
                  {course.par && ` • Par ${course.par}`}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleManualEntry}
          className="btn btn-secondary"
          style={{
            width: '100%',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          <FontAwesomeIcon icon={faPencil} />
          My course is not listed
        </button>

        <button
          onClick={handleBackToInitial}
          style={{
            width: '100%',
            padding: '0.5rem',
            fontSize: 'var(--font-sm)',
            backgroundColor: 'transparent',
            color: 'var(--text-primary)',
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          <FontAwesomeIcon icon={faArrowLeft} style={{ marginRight: '0.25rem' }} />
          Back to Search
        </button>
      </div>
    );
  }

  // MANUAL ENTRY VIEW
  if (view === 'manual') {
    return (
      <div className="course-selector">
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
          <FontAwesomeIcon icon={faPencil} style={{ marginRight: '0.5rem' }} />
          Enter Course Name Manually
        </h3>

        {error && permissionDenied && (
          <div style={{
            padding: '0.75rem',
            marginBottom: '1rem',
            backgroundColor: 'rgba(251, 191, 36, 0.1)',
            border: '2px solid #fbbf24',
            borderRadius: 'var(--radius-md)',
            color: '#fbbf24',
            fontSize: 'var(--font-sm)',
            lineHeight: '1.5',
          }}>
            <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: '0.5rem' }} />
            Location access is blocked. To use GPS search, enable location permissions in your browser settings.
          </div>
        )}

        {error && !permissionDenied && (
          <div style={{
            padding: '0.75rem',
            marginBottom: '1rem',
            backgroundColor: 'rgba(251, 191, 36, 0.1)',
            border: '2px solid #fbbf24',
            borderRadius: 'var(--radius-md)',
            color: '#fbbf24',
            fontSize: 'var(--font-sm)',
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '1rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: '500',
            color: 'var(--text-primary)',
          }}>
            Course Name:
          </label>
          <input
            type="text"
            placeholder="e.g., Pebble Beach Golf Links"
            value={manualCourseName}
            onChange={(e) => setManualCourseName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && manualCourseName.trim()) {
                handleManualConfirm();
              }
            }}
            autoFocus
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: 'var(--font-base)',
              backgroundColor: 'rgba(221, 237, 210, 0.1)',
              border: '2px solid var(--border-primary)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <button
          onClick={handleManualConfirm}
          disabled={!manualCourseName.trim()}
          className="btn btn-primary"
          style={{
            width: '100%',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          <FontAwesomeIcon icon={faCheck} />
          Confirm
        </button>

        <button
          onClick={handleBackToResults}
          style={{
            width: '100%',
            padding: '0.5rem',
            fontSize: 'var(--font-sm)',
            backgroundColor: 'transparent',
            color: 'var(--text-primary)',
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          <FontAwesomeIcon icon={faArrowLeft} style={{ marginRight: '0.25rem' }} />
          Back
        </button>
      </div>
    );
  }

  return null;
}

