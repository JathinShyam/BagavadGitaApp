/** Normalizes Expo Router dynamic segment params (string | string[] | undefined). */
export function getRouteParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
