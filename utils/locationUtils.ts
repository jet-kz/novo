import { Store } from "@/types";

export interface Coordinates {
  lat: number;
  lon: number;
}

/** A place from search or reverse geocoding. */
export interface PlaceResult {
  /** Short line, e.g. "12 Okumagba Avenue". */
  title: string;
  /** Area / city / state line. */
  subtitle: string;
  /** Full single-line address. */
  address: string;
  coords: Coordinates;
}

// Nigeria bounding box (minLon, minLat, maxLon, maxLat) keeps search results local.
const NG_BBOX = "2.67,4.27,14.68,13.89";

const join = (...parts: (string | undefined | null)[]) =>
  parts.map((p) => (p || "").trim()).filter((p, i, arr) => p && arr.indexOf(p) === i).join(", ");

/**
 * Search-as-you-type for addresses and places (OpenStreetMap data via Photon), restricted to
 * Nigeria and biased towards `near`.
 */
export async function searchPlaces(query: string, near?: Coordinates | null, signal?: AbortSignal): Promise<PlaceResult[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const params = new URLSearchParams({ q, limit: "7", lang: "en", bbox: NG_BBOX });
  if (near) {
    params.set("lat", String(near.lat));
    params.set("lon", String(near.lon));
  }
  const res = await fetch(`https://photon.komoot.io/api/?${params}`, { signal });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.features || []).map((f: any): PlaceResult => {
    const p = f.properties || {};
    const street = join(p.housenumber && p.street ? `${p.housenumber} ${p.street}` : p.street);
    const title = p.name && p.name !== p.street ? p.name : street || p.name || p.district || p.city || "Unnamed place";
    const subtitle = join(p.name && p.name !== p.street ? street : "", p.district || p.locality, p.city || p.county, p.state);
    return {
      title,
      subtitle,
      address: join(title, subtitle),
      coords: { lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0] },
    };
  });
}

/** Coordinates -> readable address (OpenStreetMap Nominatim). Falls back to rounded coordinates. */
export async function reverseGeocodePlace(lat: number, lon: number, signal?: AbortSignal): Promise<PlaceResult> {
  const coords = { lat, lon };
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&accept-language=en`,
      { signal }
    );
    if (res.ok) {
      const data = await res.json();
      const a = data.address || {};
      const street = join(a.house_number && a.road ? `${a.house_number} ${a.road}` : a.road);
      const named = data.name && data.name !== a.road ? data.name : "";
      const title = named || street || a.neighbourhood || a.suburb || a.quarter || "Pinned location";
      const subtitle = join(named ? street : "", a.neighbourhood || a.suburb || a.quarter, a.city || a.town || a.village || a.county, a.state);
      return { title, subtitle, address: join(title, subtitle), coords };
    }
  } catch (e: any) {
    if (e?.name === "AbortError") throw e;
  }
  const fallback = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  return { title: "Pinned location", subtitle: fallback, address: fallback, coords };
}

/** Kept for existing callers: coordinates -> one-line address. */
export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  return (await reverseGeocodePlace(lat, lon)).address;
}

/** Current GPS position with readable errors. */
export function getCurrentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Your browser can't share location. Search for your address instead."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) =>
        reject(
          new Error(
            err.code === err.PERMISSION_DENIED
              ? "Location is blocked for this site. Allow it in your browser settings, or search for your address."
              : err.code === err.TIMEOUT
                ? "Couldn't get a GPS fix in time. Try again near a window, or search for your address."
                : "Couldn't find your location. Search for your address instead."
          )
        ),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  });
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
  const storePinned = hasRealStoreLocation(store);
  const storePos = storePinned
    ? { lat: store.latitude as number, lon: store.longitude as number }
    : (TARGET_CITY_COORDINATES[storeCity] || TARGET_CITY_COORDINATES.warri);

  const distanceKm = calculateHaversineDistance(userPos.lat, userPos.lon, storePos.lat, storePos.lon);

  // With a real pin on both sides, distance decides. Otherwise fall back to matching city names.
  const maxAllowedRadius = store.deliveryRadiusKm || maxRadiusKm;
  const cityMatches = storeCity === userCity || (storeCity === "warri" && userCity === "effurun") || (storeCity === "effurun" && userCity === "warri");
  const inRange = storePinned && userCoords ? distanceKm <= maxAllowedRadius : cityMatches && distanceKm <= maxAllowedRadius;

  const deliveryFee = calculateDynamicDeliveryFee(distanceKm, store.deliveryFee || 300);
  const deliveryTime = estimateDeliveryTime(distanceKm);

  return {
    inRange,
    distanceKm,
    deliveryFee,
    deliveryTime,
  };
}

/** Stores created before the map picker were saved on a placeholder point in Lagos. */
export function hasRealStoreLocation(store: Pick<Store, "latitude" | "longitude">): boolean {
  if (store.latitude == null || store.longitude == null) return false;
  return !(Math.abs(store.latitude - 6.5244) < 0.0001 && Math.abs(store.longitude - 3.3792) < 0.0001);
}
