// Golf Course API Service - RapidAPI Integration
import type { GolfCourse } from '@/types';

const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'golf-course-finder.p.rapidapi.com';
const BASE_URL = 'https://golf-course-finder.p.rapidapi.com/api';

// Haversine formula - calculate distance between two GPS coordinates
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in miles
}

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
 */
export async function searchNearbyGolfCourses(
  params: SearchCoursesParams
): Promise<SearchCoursesResult> {
  const { latitude, longitude, miles = 25 } = params;

  if (!RAPIDAPI_KEY) {
    throw new Error('RapidAPI key not configured. Please add VITE_RAPIDAPI_KEY to .env file.');
  }

  console.log('[API] API Key loaded:', RAPIDAPI_KEY ? `${RAPIDAPI_KEY.substring(0, 10)}...` : 'MISSING');
  console.log('[API] API Key length:', RAPIDAPI_KEY?.length);

  const url = `${BASE_URL}/golf-clubs/?latitude=${latitude}&longitude=${longitude}&miles=${miles}`;
  console.log('[API] Request URL:', url);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    });

    console.log('[API] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Error response:', errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    console.log('[API] ========== RAW API RESPONSE ==========');
    console.log('[API] Response type:', typeof data);
    console.log('[API] Is array?', Array.isArray(data));
    console.log('[API] Number of courses:', Array.isArray(data) ? data.length : 'N/A');
    console.log('[API] Full response:', JSON.stringify(data, null, 2));

    if (Array.isArray(data) && data.length > 0) {
      console.log('[API] First course object:', data[0]);
      console.log('[API] First course keys:', Object.keys(data[0]));
      console.log('[API] First course clubName:', data[0].clubName);
      console.log('[API] First course name:', data[0].name);
    }
    console.log('[API] ========================================');

    // Transform API response to our GolfCourse type
    const courses: GolfCourse[] = (Array.isArray(data) ? data : []).map((course: any) => {
      // Calculate distance from user location
      const distance = calculateDistance(
        latitude,
        longitude,
        course.latitude,
        course.longitude
      );

      return {
        clubName: course.club_name || course.clubName || course.name || 'Unknown Club',
        courseName: course.course_name || course.courseName || '',
        latitude: course.latitude,
        longitude: course.longitude,
        placeId: course.place_id || course.placeId,
        holes: course.number_of_holes || course.holes,
        par: course.par,
        weekdayPrice: course.weekday_price || course.weekdayPrice,
        weekendPrice: course.weekend_price || course.weekendPrice,
        twilightPrice: course.twilight_price || course.twilightPrice,
        distance: parseFloat(distance.toFixed(1)),
      };
    });

    // Sort by distance (closest first)
    courses.sort((a, b) => (a.distance || 0) - (b.distance || 0));

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
    // Permissions API not supported, assume we need to prompt
    return 'prompt';
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state;
  } catch (error) {
    // If query fails, assume we need to prompt
    return 'prompt';
  }
}

/**
 * Get user's current GPS location
 * This will trigger the browser's native permission prompt if permission hasn't been granted yet
 */
export function getUserLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    console.log('[GPS] Checking geolocation support...');

    if (!navigator.geolocation) {
      console.error('[GPS] Geolocation not supported');
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    console.log('[GPS] Requesting current position...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('[GPS] Position obtained:', position.coords.latitude, position.coords.longitude);
        resolve(position);
      },
      (error) => {
        console.error('[GPS] Error:', error.code, error.message);
        let message = 'Unable to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            console.error('[GPS] Permission denied by user');
            message = 'PERMISSION_DENIED'; // Special code for UI to handle
            break;
          case error.POSITION_UNAVAILABLE:
            console.error('[GPS] Position unavailable');
            message = 'Location information unavailable. Please check your device settings.';
            break;
          case error.TIMEOUT:
            console.error('[GPS] Request timed out');
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

