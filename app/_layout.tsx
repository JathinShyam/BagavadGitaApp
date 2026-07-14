import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState, useRef, useCallback } from "react";
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
import { ThemeProvider as AppThemeProvider } from "@/context/theme-context";
import { ToastProvider } from "@/components/ui/Toast";
import { LaunchIntro } from "@/components/ui/LaunchIntro";
import { ReadingProgressProvider } from "@/hooks/useReadingProgress";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { getVerseForDate } from "@/lib/daily-verse";
import { scheduleNextDailyVerseNotification } from "@/lib/daily-verse-notifications";
import { shouldLoadExpoNotifications } from "@/lib/notification-availability";
import { syncDailyVerseWidget } from "@/lib/widget-data";
import { ROUTES } from "@/constants/routes";
import { STORAGE_KEYS } from "@/constants/storage-keys";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [interLoaded] = useInter({ Inter_400Regular, Inter_600SemiBold });
  const [playfairLoaded] = usePlayfair({ PlayfairDisplay_700Bold });
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean | null>(null);
  const [showLaunchIntro, setShowLaunchIntro] = useState(true);

  const loaded = interLoaded && playfairLoaded;
  const pendingNavigationPathRef = useRef<string | null>(null);

  const isNavigationReady = loaded && isOnboardingComplete !== null;

  const flushPendingNavigation = useCallback(() => {
    if (!isNavigationReady) return;
    if (isOnboardingComplete !== true) return;
    // Wait for intro so deep links don't fight the entrance.
    if (showLaunchIntro) return;
    const path = pendingNavigationPathRef.current;
    if (!path) return;
    pendingNavigationPathRef.current = null;
    router.push(path as any);
  }, [isNavigationReady, isOnboardingComplete, showLaunchIntro]);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING);
        setIsOnboardingComplete(value === "true");
      } catch {
        setIsOnboardingComplete(true);
      }
    };
    checkOnboarding();
  }, []);

  useEffect(() => {
    if (loaded && isOnboardingComplete !== null) {
      // Reveal the animated intro underneath; native splash disappears cleanly.
      SplashScreen.hideAsync();
      if (!isOnboardingComplete) {
        router.replace(ROUTES.onboarding);
      }
    }
  }, [loaded, isOnboardingComplete]);

  useEffect(() => {
    flushPendingNavigation();
  }, [flushPendingNavigation]);

  const handleLaunchIntroFinish = useCallback(() => {
    setShowLaunchIntro(false);
  }, []);

  // Daily verse notification + widget: on cold start and when returning from background
  const appState = useRef<AppStateStatus>(AppState.currentState);
  useEffect(() => {
    if (loaded && isOnboardingComplete !== null) {
      scheduleNextDailyVerseNotification().catch(() => {});
      syncDailyVerseWidget().catch(() => {});
    }
  }, [loaded, isOnboardingComplete]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === "active") {
        scheduleNextDailyVerseNotification().catch(() => {});
        syncDailyVerseWidget().catch(() => {});
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, []);

  // Setup expo-notifications (skip require on Expo Go Android — module throws on load in SDK 53+)
  useEffect(() => {
    if (!shouldLoadExpoNotifications()) return;

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

    type NotificationPayload = {
      verseId?: string;
      screen?: string;
    };

    const handleNotificationResponse = (data: NotificationPayload | undefined, responseId: string) => {
      const id = responseId || `fallback-${Date.now()}`;
      if (id === lastProcessedIdRef.current) return;
      lastProcessedIdRef.current = id;

      const navigateTo = (path: string) => {
        pendingNavigationPathRef.current = path;
        flushPendingNavigation();
      };

      if (data?.screen === "daily-verse") {
        const verse = getVerseForDate(new Date());
        if (verse) navigateTo(ROUTES.verse(verse.id));
        return;
      }

      if (!data?.verseId) {
        const verse = getVerseForDate(new Date());
        if (verse) navigateTo(ROUTES.verse(verse.id));
        return;
      }
      if (data?.verseId) {
        navigateTo(ROUTES.verse(data.verseId));
      }
    };

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as NotificationPayload | undefined;
      const id = response.notification.request.identifier ?? "";
      handleNotificationResponse(data, id);
    });

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response?.notification.request.content.data) return;
      const data = response.notification.request.content.data as NotificationPayload;
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
                  <Stack.Screen name="(main)" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="onboarding"
                    options={{
                      headerShown: false,
                      animation: "fade",
                    }}
                  />
                  <Stack.Screen name="+not-found" />
                </Stack>
                {showLaunchIntro && (
                  <LaunchIntro onFinish={handleLaunchIntroFinish} />
                )}
              </ToastProvider>
            </ThemeProvider>
          </ReadingProgressProvider>
        </AppThemeProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
