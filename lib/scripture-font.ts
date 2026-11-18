import { Platform } from "react-native";

import type { ContentLanguage } from "@/constants/languages";

/**
 * Latin → Playfair Italic.
 * Indic → platform serif, which has real conjunct + matra shaping.
 *
 * Rendering scripture in Playfair (a Latin-only family) forces the platform to
 * synthesise falling-back glyphs without the shaping rules Telugu, Devanagari
 * and Tamil need, so conjuncts split apart (BUG-026).
 */
export function getScriptureFont(language: ContentLanguage): string {
  if (language === "en") return "PlayfairDisplay_400Regular_Italic";
  return (
    Platform.select({
      ios: "Georgia", // iOS has no Indic serif; Indic falls back to system serif
      android: "serif", // Noto Serif Devanagari / Telugu / Tamil
      default: "serif",
    }) ?? "serif"
  );
}
