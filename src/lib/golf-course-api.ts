// Golf Course API Service - Server-side proxy to Google Places API
import type { GolfCourse } from '@/types';

export interface SearchCoursesParams {
  latitude: number;
  longitude: number;
  miles?: number; // Search radius (default: 25)
}

export interface SearchCoursesResult {
  courses: GolfCourse[];
  userLocation: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Search for golf courses near a GPS location
 * Calls our own PHP backend which proxies to Google Places API
 */
export async function searchNearbyGolfCourses(
  params: SearchCoursesParams
): Promise<SearchCoursesResult> {
  const { latitude, longitude, miles = 25 } = params;

  // Convert miles to meters for the API
  const radiusMeters = Math.round(miles * 1609.34);

  const queryParams = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    radius: radiusMeters.toString(),
  });

  const url = `./api/rounds/search-courses.php?${queryParams}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Course search failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Course search failed');
    }

    // Transform to GolfCourse type (server already returns the right shape)
    const courses: GolfCourse[] = (data.courses || []).map((course: any) => ({
      clubName: course.clubName || 'Unknown Course',
      courseName: course.courseName || '',
      latitude: course.latitude,
      longitude: course.longitude,
      placeId: course.placeId,
      holes: course.holes,
      par: course.par,
      distance: course.distance,
    }));

    return {
      courses,
      userLocation: { latitude, longitude },
    };
  } catch (error) {
    console.error('Golf course search failed:', error);
    throw error;
  }
}

/**
 * Check if location permission is granted, denied, or needs to be requested
 */
export async function checkLocationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  if (!navigator.permissions) {
    return 'prompt';
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state;
  } catch (error) {
    return 'prompt';
  }
}

/**
 * Get user's current GPS location
 * This will trigger the browser's native permission prompt if permission hasn't been granted yet
 */
export function getUserLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve(position);
      },
      (error) => {
        let message = 'Unable to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'PERMISSION_DENIED';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable. Please check your device settings.';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out. Please try again.';
            break;
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}
