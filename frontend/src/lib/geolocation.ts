/**
 * Geolocation utilities for GPS location detection
 * Provides functions to request GPS permission and get current position
 */

export interface GeoPosition {
  latitude: number;
  longitude: number;
}

/**
 * Request GPS permission and get current position
 * Uses high accuracy mode with 10 second timeout
 *
 * @returns Promise that resolves with latitude/longitude
 * @throws GeolocationPositionError if permission denied or unavailable
 *
 * @example
 * try {
 *   const position = await requestGPSPermission();
 *   console.log(position.latitude, position.longitude);
 * } catch (error) {
 *   if (error.code === 1) { // Permission denied
 *     // Show manual entry fallback
 *   }
 * }
 */
export const requestGPSPermission = (): Promise<GeoPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported by your browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  });
};

/**
 * Check current geolocation permission status
 *
 * @returns 'granted' | 'denied' | 'prompt'
 *
 * Note: Falls back to 'prompt' if Permissions API is not supported
 */
export const getLocationPermissionStatus =
  async (): Promise<PermissionState> => {
    if (!navigator.permissions) {
      return "prompt";
    }

    try {
      const result = await navigator.permissions.query({ name: "geolocation" });
      return result.state;
    } catch {
      return "prompt";
    }
  };

/**
 * Check if geolocation is supported by the browser
 */
export const isGeolocationSupported = (): boolean => {
  return "geolocation" in navigator;
};

/**
 * Get user-friendly error message from GeolocationPositionError
 */
export const getGeolocationErrorMessage = (
  error: GeolocationPositionError | Error,
): string => {
  if (error instanceof GeolocationPositionError) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return "Location access was denied. Please enable location in your browser settings or enter your location manually.";
      case error.POSITION_UNAVAILABLE:
        return "Your location could not be determined. Please try again or enter your location manually.";
      case error.TIMEOUT:
        return "Location request timed out. Please try again or enter your location manually.";
      default:
        return "An error occurred while detecting your location. Please try again or enter manually.";
    }
  }

  return (
    error.message ||
    "Could not detect location. Please try again or enter manually."
  );
};
