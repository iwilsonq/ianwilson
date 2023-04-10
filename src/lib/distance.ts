/**
 * Distance in meters
 */
export type Distance = number;

/**
 * Typically for total altitude ascended
 * @param distance
 * @returns {number}
 */
export function toFeet(distance: Distance): number {
  return distance / 0.3;
}

const METERS_IN_MILE = 1609.34;

/**
 * Typically for total distance traveled
 * @param distance
 * @returns {number}
 */
export function toMiles(distance: Distance): number {
  return distance / METERS_IN_MILE;
}
