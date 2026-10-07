import { Store } from "@/types";

export interface Coordinates {
  lat: number;
  lon: number;
}

// Reverse Geocoding helper to turn GPS coordinates into readable address
export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        const road = data.address.road || data.address.suburb || data.address.neighbourhood || "";
        const city = data.address.city || data.address.town || data.address.state_district || "Warri";
        const state = data.address.state || "Delta State";
        const formatted = [road, city, state].filter(Boolean).join(", ");
        if (formatted.length > 5) return formatted;
      }
      if (data && data.display_name) {
        const parts = data.display_name.split(",");
        return parts.slice(0, 3).join(",").trim();
      }
    }
  } catch (e) {
    console.warn("Reverse geocoding request failed:", e);
  }
  return "Current Location, Warri, Delta State";
}

// Preset GPS Coordinates for Target Cities & Regions
export const TARGET_CITY_COORDINATES: Record<string, Coordinates> = {
  warri: { lat: 5.5544, lon: 5.7932 },
  asaba: { lat: 6.1983, lon: 6.7276 },
  sapele: { lat: 5.8941, lon: 5.6767 },
  effurun: { lat: 5.5587, lon: 5.7808 },
  ughelli: { lat: 5.4913, lon: 6.0028 },
  lagos: { lat: 6.5244, lon: 3.3792 },
};

/**
 * Calculates spherical distance in kilometers between two GPS points using the Haversine formula.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in KM
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Normalizes address text to extract city key (warri, asaba, sapele, etc.)
 */
export function extractCityFromAddress(address?: string): string {
  if (!address) return "warri";
  const lower = address.toLowerCase();
  if (lower.includes("asaba")) return "asaba";
  if (lower.includes("sapele")) return "sapele";
  if (lower.includes("effurun")) return "effurun";
  if (lower.includes("ughelli")) return "ughelli";
  if (lower.includes("lagos")) return "lagos";
  if (lower.includes("warri")) return "warri";
  return "warri"; // Default fallback hub
}

/**
 * Resolves coordinates for a user given an address or coordinates object.
 */
export function getCoordinatesForAddress(address?: string, coords?: Coordinates | null): Coordinates {
  if (coords && coords.lat && coords.lon) {
    return coords;
  }
  const city = extractCityFromAddress(address);
  return TARGET_CITY_COORDINATES[city] || TARGET_CITY_COORDINATES.warri;
}

/**
 * Calculates dynamic delivery fee based on distance:
 * Base fee ₦300 + ₦100 per km (minimum ₦300, capped at ₦2500)
 */
export function calculateDynamicDeliveryFee(
  distanceKm: number,
  baseFee: number = 300,
  ratePerKm: number = 100,
  minFee: number = 300,
  maxFee: number = 2500
): number {
  if (distanceKm <= 0) return minFee;
  const rawFee = baseFee + Math.ceil(distanceKm) * ratePerKm;
  const rounded = Math.ceil(rawFee / 50) * 50; // Round up to nearest 50 Naira
  return Math.min(Math.max(rounded, minFee), maxFee);
}

/**
 * Estimates delivery time string based on distance and store preparation time.
 */
export function estimateDeliveryTime(distanceKm: number, basePrepMinutes: number = 15): string {
  // Average travel speed ~25 km/h in urban traffic (approx 2.4 mins per km)
  const travelMinutes = Math.ceil(distanceKm * 2.4);
  const minTime = basePrepMinutes + travelMinutes;
  const maxTime = minTime + 10;
  return `${minTime} - ${maxTime} mins`;
}

/**
 * Checks if a store can deliver to a user based on city match & max radius km.
 */
export function isStoreInDeliveryRange(
  store: Store,
  userAddress?: string,
  userCoords?: Coordinates | null,
  maxRadiusKm: number = 15
): { inRange: boolean; distanceKm: number; deliveryFee: number; deliveryTime: string } {
  const storeCity = (store.city || extractCityFromAddress(store.address)).toLowerCase();
  const userCity = extractCityFromAddress(userAddress);
  
  const userPos = getCoordinatesForAddress(userAddress, userCoords);
  const storePos = store.latitude && store.longitude 
    ? { lat: store.latitude, lon: store.longitude }
    : (TARGET_CITY_COORDINATES[storeCity] || TARGET_CITY_COORDINATES.warri);

  const distanceKm = calculateHaversineDistance(userPos.lat, userPos.lon, storePos.lat, storePos.lon);
  
  // Geofence Rule: City match OR distance within radius
  const maxAllowedRadius = store.deliveryRadiusKm || maxRadiusKm;
  const cityMatches = storeCity === userCity || (storeCity === "warri" && userCity === "effurun") || (storeCity === "effurun" && userCity === "warri");
  const inRange = cityMatches && distanceKm <= maxAllowedRadius;

  const deliveryFee = calculateDynamicDeliveryFee(distanceKm, store.deliveryFee || 300);
  const deliveryTime = estimateDeliveryTime(distanceKm);

  return {
    inRange,
    distanceKm,
    deliveryFee,
    deliveryTime,
  };
}
