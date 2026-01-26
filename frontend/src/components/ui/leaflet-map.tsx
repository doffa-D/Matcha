import { useEffect, useRef, useState } from "react";
import { getImageUrl } from "@/lib/utils";

// export const MAP_LIBRARIES = {
//   css: ["https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"],
//   js: ["https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"],
// };
export const MAP_LIBRARIES = {
  css: [
    "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
    "https://cdn.maptiler.com/maptiler-sdk-js/v3.6.1/maptiler-sdk.css"
  ],
  js: [
    "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
    "https://cdn.maptiler.com/maptiler-sdk-js/v3.6.1/maptiler-sdk.umd.min.js",
    "https://cdn.maptiler.com/leaflet-maptilersdk/v4.1.0/leaflet-maptilersdk.umd.min.js"
  ],
};

// Map configuration
const MAP_CONFIG = {
  mapTilerApiKey: import.meta.env.VITE_MAPTILER_API_KEY || "",
  mapTilerStyle: "019894d2-4612-742d-b5b0-581d3e7557cb",
};

// Declare global types for Leaflet (loaded dynamically)
// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace L {
  function map(element: HTMLElement, options?: unknown): L.Map;
  function tileLayer(url: string, options?: unknown): L.TileLayer;
  function marker(latlng: [number, number], options?: unknown): L.Marker;
  function latLngBounds(latlngs: [number, number][]): L.LatLngBounds;
  function divIcon(options: unknown): L.Icon;

  namespace maptiler {
    class maptilerLayer {
      constructor(options: { apiKey: string; style: string });
      addTo(map: L.Map): L.maptiler.maptilerLayer;
    }
  }

  interface Map {
    remove(): void;
    invalidateSize(): void;
    fitBounds(bounds: L.LatLngBounds, options?: unknown): void;
  }
  interface TileLayer {
    addTo(map: L.Map): void;
  }
  interface Marker {
    addTo(map: L.Map): L.Marker;
    bindPopup(content: string): L.Marker;
    on(event: string, handler: () => void): L.Marker;
    remove(): void;
  }
  interface LatLngBounds {}
  interface Icon {}
}

declare global {
  interface Window {
    L: typeof L;
  }
}

export interface MapUser {
  id: number;
  username: string;
  first_name: string;
  latitude: number | null;
  longitude: number | null;
  profile_image: string | null;
  is_online: boolean;
}

interface LeafletMapProps {
  className?: string;
  center?: [number, number];
  zoom?: number;
  users?: MapUser[];
  onUserClick?: (userId: number) => void;
}

let librariesLoaded = false;
let librariesLoading: Promise<void> | null = null;

const loadLibraries = (): Promise<void> => {
  if (librariesLoaded) return Promise.resolve();
  if (librariesLoading) return librariesLoading;

  librariesLoading = new Promise((resolve, reject) => {
    // Load CSS
    MAP_LIBRARIES.css.forEach((href) => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        document.head.appendChild(link);
      }
    });

    // Load JS sequentially
    const loadScript = (src: string): Promise<void> => {
      return new Promise((res, rej) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          res();
          return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => res();
        script.onerror = () => rej(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
      });
    };

    (async () => {
      for (const src of MAP_LIBRARIES.js) {
        await loadScript(src);
      }
      librariesLoaded = true;
      resolve();
    })().catch(reject);
  });

  return librariesLoading;
};

// Generate fallback avatar using DiceBear (same as profile-card)
const getFallbackAvatar = (userId: number) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

// Get avatar URL - uses user's profile image or falls back to DiceBear avatar
const getAvatarUrl = (profileImage: string | null, userId: number) => {
  if (profileImage) {
    return getImageUrl(profileImage) || getFallbackAvatar(userId);
  }
  return getFallbackAvatar(userId);
};

// Create custom marker icon
const createUserIcon = (
  L: typeof window.L,
  profileImage: string | null,
  isOnline: boolean,
  userId: number,
) => {
  const imageUrl = getAvatarUrl(profileImage, userId);

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 3px solid ${isOnline ? "#22c55e" : "#9ca3af"};
        background: url('${imageUrl}') center/cover;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
};

export const LeafletMap = ({
  className = "",
  center = [48.8566, 2.3522], // Paris
  zoom = 4,
  users = [],
  onUserClick,
}: LeafletMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    loadLibraries()
      .then(() => setIsReady(true))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!isReady || !containerRef.current || mapRef.current) return;

    const L = window.L;

    // Create map
    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: true,
    });

    // Create MapTiler layer
    new L.maptiler.maptilerLayer({
      apiKey: MAP_CONFIG.mapTilerApiKey,
      style: MAP_CONFIG.mapTilerStyle,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [isReady, center, zoom]);

  // Update markers when users change
  useEffect(() => {
    if (!isReady || !mapRef.current) return;

    const L = window.L;
    const map = mapRef.current;

    // Remove existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    const validUsers = users.filter(
      (u) => u.latitude !== null && u.longitude !== null,
    );

    validUsers.forEach((user) => {
      const icon = createUserIcon(L, user.profile_image, user.is_online, user.id);
      const marker = L.marker([user.latitude!, user.longitude!], { icon })
        .addTo(map)
        .bindPopup(
          `<div style="text-align:center;min-width:100px;">
            <strong>${user.first_name}</strong><br/>
            <small>@${user.username}</small>
          </div>`,
        );

      if (onUserClick) {
        marker.on("click", () => onUserClick(user.id));
      }

      markersRef.current.push(marker);
    });

    // Fit bounds if there are users
    if (validUsers.length > 0) {
      const bounds = L.latLngBounds(
        validUsers.map((u) => [u.latitude!, u.longitude!] as [number, number]),
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [isReady, users, onUserClick]);

  // Handle resize when container size changes
  useEffect(() => {
    if (!mapRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      mapRef.current?.invalidateSize();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [isReady]);

  return (
    <div ref={containerRef} className={`w-full h-full ${className}`}>
      {!isReady && (
        <div className="w-full h-full flex items-center justify-center bg-neutral-100">
          <span className="text-sm text-neutral-500">Loading map...</span>
        </div>
      )}
    </div>
  );
};
