import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { useColorScheme } from "@/hooks/useColorScheme";
import {
  useFonts as useInter,
  Inter_400Regular,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import {
  useFonts as usePlayfair,
  PlayfairDisplay_700Bold,
} from "@expo-google-fonts/playfair-display";
import { ThemeProvider as AppThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "../components/Toast";
import { ReadingProgressProvider } from "./hooks/useReadingProgress";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { scheduleNextDailyVerseNotification } from "@/lib/dailyVerseNotifications";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const ONBOARDING_KEY = "hasCompletedOnboarding";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [interLoaded] = useInter({ Inter_400Regular, Inter_600SemiBold });
  const [playfairLoaded] = usePlayfair({ PlayfairDisplay_700Bold });
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean | null>(null);

  const loaded = interLoaded && playfairLoaded;

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const value = await AsyncStorage.getItem(ONBOARDING_KEY);
        setIsOnboardingComplete(value === "true");
      } catch {
        setIsOnboardingComplete(true); // Default to true if error
      }
    };
    checkOnboarding();
  }, []);

  useEffect(() => {
    if (loaded && isOnboardingComplete !== null) {
      SplashScreen.hideAsync();
      if (!isOnboardingComplete) {
        router.replace("/onboarding");
      }
    }
  }, [loaded, isOnboardingComplete]);

  // Reschedule daily verse notification: on app launch (cold start) and when coming from background
  const appState = useRef<AppStateStatus>(AppState.currentState);
  useEffect(() => {
    if (loaded && isOnboardingComplete !== null) {
      scheduleNextDailyVerseNotification().catch(() => {});
    }
  }, [loaded, isOnboardingComplete]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (appState.current === "background" && nextState === "active") {
        scheduleNextDailyVerseNotification().catch(() => {});
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, []);

  // Setup expo-notifications (lazy load to avoid crash in Expo Go where it's unsupported)
  useEffect(() => {
    let Notifications: typeof import("expo-notifications") | null = null;
    try {
      Notifications = require("expo-notifications");
    } catch {
      return;
    }
    if (!Notifications) return;

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    const lastProcessedIdRef = { current: "" };

    const handleNotificationResponse = (data: { verseId?: string } | undefined, responseId: string) => {
      if (!data?.verseId) return;
      const id = responseId || `fallback-${Date.now()}`;
      if (id === lastProcessedIdRef.current) return;
      lastProcessedIdRef.current = id;
      router.push(`/verse/${data.verseId}`);
    };

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { verseId?: string } | undefined;
      const id = response.notification.request.identifier ?? "";
      handleNotificationResponse(data, id);
    });

    // Handle app launched from notification tap (when app was killed)
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response?.notification.request.content.data) return;
      const data = response.notification.request.content.data as { verseId?: string };
      const id = response.notification.request.identifier ?? "";
      handleNotificationResponse(data, id);
    });

    return () => sub.remove();
  }, []);

  if (!loaded || isOnboardingComplete === null) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <AppThemeProvider>
          <ReadingProgressProvider>
            <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
              <ToastProvider>
                <Stack
                  screenOptions={{
                    animation: "slide_from_right",
                    animationDuration: 250,
                    gestureEnabled: true,
                    gestureDirection: "horizontal",
                  }}
                >
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="onboarding"
                    options={{
                      headerShown: false,
                      animation: "fade",
                    }}
                  />
                  <Stack.Screen name="+not-found" />
                </Stack>
              </ToastProvider>
            </ThemeProvider>
          </ReadingProgressProvider>
        </AppThemeProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
