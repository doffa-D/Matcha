import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get the base URL for images from environment variable
 */
const IMAGES_BASE_URL =
  import.meta.env.VITE_IMAGES_URL || "http://127.0.0.1:5000";

/**
 * Build full image URL from API path
 * Handles both full URLs and relative paths
 *
 * @param path - Image path from API (can be full URL or relative path)
 * @returns Full image URL using VITE_IMAGES_URL
 *
 * @example
 * // Full URL from API - extracts path and uses env base URL
 * getImageUrl("http://localhost:5000/static/uploads/user_1/image.png")
 * // Returns: "http://127.0.0.1:5000/static/uploads/user_1/image.png"
 *
 * // Relative path
 * getImageUrl("/static/uploads/user_1/image.png")
 * // Returns: "http://127.0.0.1:5000/static/uploads/user_1/image.png"
 */
export function getImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;

  // If it's already a full URL, extract the path portion
  if (path.startsWith("http://") || path.startsWith("https://")) {
    try {
      const url = new URL(path);
      // Use the pathname from the original URL with our base URL
      return `${IMAGES_BASE_URL}${url.pathname}`;
    } catch {
      // If URL parsing fails, return as-is
      return path;
    }
  }

  // Relative path - just prepend base URL
  const separator = path.startsWith("/") ? "" : "/";
  return `${IMAGES_BASE_URL}${separator}${path}`;
}
