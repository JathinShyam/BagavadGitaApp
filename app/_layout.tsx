import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
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

  if (!loaded || isOnboardingComplete === null) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
    </GestureHandlerRootView>
  );
}
