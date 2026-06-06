import { Platform } from "react-native";
import Constants from "expo-constants";

/**
 * Expo Go on Android (SDK 53+) throws when `expo-notifications` is loaded.
 * Never `require("expo-notifications")` in that environment — use a dev build instead.
 *
 * @see https://docs.expo.dev/develop/development-builds/introduction/
 */
export function shouldLoadExpoNotifications(): boolean {
  if (Platform.OS === "web") return false;
  if (Platform.OS !== "android") return true;
  // Expo Go = store client; dev / release builds are typically "bare" or "standalone"
  return Constants.executionEnvironment !== "storeClient";
}
