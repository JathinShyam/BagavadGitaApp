import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { STORAGE_KEYS } from "@/constants/storage-keys";
import {
  DEFAULT_CONTENT_LANGUAGE,
  getLanguageOption,
  isContentLanguage,
  type ContentLanguage,
  type ContentLanguageOption,
} from "@/constants/languages";

interface LanguageContextType {
  language: ContentLanguage;
  languageOption: ContentLanguageOption;
  setLanguage: (language: ContentLanguage) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function useContentLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useContentLanguage must be used within a LanguageProvider");
  }
  return context;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<ContentLanguage>(DEFAULT_CONTENT_LANGUAGE);

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEYS.CONTENT_LANGUAGE);
        if (isContentLanguage(saved)) {
          setLanguageState(saved);
        }
      } catch (error) {
        console.error("Error loading content language:", error);
      }
    };
    load();
  }, []);

  const setLanguage = async (next: ContentLanguage) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CONTENT_LANGUAGE, next);
      setLanguageState(next);
    } catch (error) {
      console.error("Error saving content language:", error);
    }
  };

  const value = useMemo(
    () => ({
      language,
      languageOption: getLanguageOption(language),
      setLanguage,
    }),
    [language]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export default LanguageContext;
