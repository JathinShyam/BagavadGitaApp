/**
 * Bhagavad Gita verses by topic/category.
 * Format: Chapter.Verse → verse ID (chapter-verse_number)
 * Combined verses (e.g., 16.1-3) use the app's verse_number format.
 * Gradient colors for Soft muted topic tiles.
 */
import type { ContentLanguage } from "@/constants/languages";

export interface Category {
  id: string;
  /** English fallback and stable display name. */
  name: string;
  /** Localized topic names. */
  names: Partial<Record<ContentLanguage, string>>;
  verses: string[];
  /** Gradient colors [start, end] for tile background */
  gradient: [string, string];
  /** Ionicons name for tile icon */
  icon: string;
}

export const CATEGORIES: Category[] = [
  {
    id: "anger",
    name: "Anger",
    names: {
      te: "కోపం",
      en: "Anger",
      hi: "क्रोध",
      ta: "கோபம்",
    },
    verses: ["2-56", "2-62", "2-63", "5-26", "16-1-3", "16-21"],
    gradient: ["#862725", "#94453d"],
    icon: "flame",
  },
  {
    id: "feeling-sinful",
    name: "Feeling Sinful",
    names: {
      te: "పాప భావన",
      en: "Feeling Sinful",
      hi: "पाप का भाव",
      ta: "பாவ உணர்வு",
    },
    verses: ["4-36", "4-37", "5-10", "9-30", "10-3", "14-6", "18-66"],
    gradient: ["#42175d", "#5e1e69"],
    icon: "heart-dislike",
  },
  {
    id: "practising-forgiveness",
    name: "Practising Forgiveness",
    names: {
      te: "క్షమించడం నేర్చుకోవడం",
      en: "Practising Forgiveness",
      hi: "क्षमा का अभ्यास",
      ta: "மன்னிப்பைப் பயிலுதல்",
    },
    verses: ["11-44", "12-13-14", "16-1-3"],
    gradient: ["#214d24", "#406f42"],
    icon: "heart",
  },
  {
    id: "pride",
    name: "Pride",
    names: {
      te: "అహంకారం",
      en: "Pride",
      hi: "अहंकार",
      ta: "ஆணவம்",
    },
    verses: ["16-4", "16-13-15", "18-26", "18-58"],
    gradient: ["#91651c", "#947d34"],
    icon: "trophy",
  },
  {
    id: "death-of-loved-one",
    name: "Death of a Loved One",
    names: {
      te: "ప్రియమైన వారి మరణం",
      en: "Death of a Loved One",
      hi: "प्रियजन का देहांत",
      ta: "அன்புக்குரியவரின் மரணம்",
    },
    verses: ["2-13", "2-20", "2-22", "2-25", "2-27"],
    gradient: ["#262f34", "#36454b"],
    icon: "flower",
  },
  {
    id: "seeking-peace",
    name: "Seeking Peace",
    names: {
      te: "శాంతి కోరడం",
      en: "Seeking Peace",
      hi: "शांति की खोज",
      ta: "அமைதியைத் தேடுதல்",
    },
    verses: ["2-66", "2-71", "4-39", "5-29", "8-28"],
    gradient: ["#094a70", "#347390"],
    icon: "leaf",
  },
  {
    id: "lust",
    name: "Lust",
    names: {
      te: "కామం",
      en: "Lust",
      hi: "कामवासना",
      ta: "காமம்",
    },
    verses: ["3-37", "3-41", "3-43", "5-22", "16-21"],
    gradient: ["#671338", "#8c3e58"],
    icon: "sparkles",
  },
  {
    id: "uncontrolled-mind",
    name: "Uncontrolled Mind",
    names: {
      te: "అదుపు తప్పిన మనస్సు",
      en: "Uncontrolled Mind",
      hi: "अनियंत्रित मन",
      ta: "கட்டுப்படாத மனம்",
    },
    verses: ["6-5", "6-6", "6-26", "6-35"],
    gradient: ["#4c1961", "#6e4176"],
    icon: "flash",
  },
  {
    id: "dealing-with-envy",
    name: "Dealing with Envy",
    names: {
      te: "అసూయను ఎదుర్కోవడం",
      en: "Dealing with Envy",
      hi: "ईर्ष्या से सामना",
      ta: "பொறாமையைக் கையாளுதல்",
    },
    verses: ["12-13-14", "16-19-20", "18-71"],
    gradient: ["#173c1a", "#4f7651"],
    icon: "eye",
  },
  {
    id: "discriminated",
    name: "Discriminated",
    names: {
      te: "వివక్షకు గురైనప్పుడు",
      en: "Discriminated",
      hi: "भेदभाव का सामना",
      ta: "பாகுபாடு அனுபவித்தல்",
    },
    verses: ["5-18", "5-19", "6-32", "9-29"],
    gradient: ["#3b2b26", "#61534e"],
    icon: "people",
  },
  {
    id: "laziness",
    name: "Laziness",
    names: {
      te: "సోమరితనం",
      en: "Laziness",
      hi: "आलस",
      ta: "சோம்பேறித்தனம்",
    },
    verses: ["3-8", "3-20-21", "6-16", "18-39"],
    gradient: ["#873508", "#946d32"],
    icon: "bed",
  },
  {
    id: "loneliness",
    name: "Loneliness",
    names: {
      te: "ఒంటరితనం",
      en: "Loneliness",
      hi: "अकेलापन",
      ta: "தனிமை",
    },
    verses: ["6-30", "9-29", "13-16", "13-18"],
    gradient: ["#2e3a3f", "#576268"],
    icon: "person",
  },
  {
    id: "depression",
    name: "Depression",
    names: {
      te: "నిరాశ",
      en: "Depression",
      hi: "अवसाद",
      ta: "மனச்சோர்வு",
    },
    verses: ["2-3", "2-14", "5-21"],
    gradient: ["#144072", "#2c638f"],
    icon: "cloudy",
  },
  {
    id: "confusion",
    name: "Confusion",
    names: {
      te: "గందరగోళం",
      en: "Confusion",
      hi: "भ्रम",
      ta: "குழப்பம்",
    },
    verses: ["2-7", "3-1-2", "18-61"],
    gradient: ["#232b60", "#4b5278"],
    icon: "help-circle",
  },
  {
    id: "fear",
    name: "Fear",
    names: {
      te: "భయం",
      en: "Fear",
      hi: "भय",
      ta: "பயம்",
    },
    verses: ["4-10", "11-50", "18-30"],
    gradient: ["#311355", "#4d3873"],
    icon: "warning",
  },
  {
    id: "greed",
    name: "Greed",
    names: {
      te: "దురాశ",
      en: "Greed",
      hi: "लोभ",
      ta: "பேராசை",
    },
    verses: ["14-17", "16-21", "17-25"],
    gradient: ["#8f4e15", "#94771e"],
    icon: "wallet",
  },
  {
    id: "demotivated",
    name: "Demotivated",
    names: {
      te: "ఉత్సాహం కోల్పోయినప్పుడు",
      en: "Demotivated",
      hi: "हतोत्साहित",
      ta: "ஊக்கமிழந்த நிலை",
    },
    verses: ["11-33", "18-48", "18-78"],
    gradient: ["#3d3d3d", "#5f5f5f"],
    icon: "trending-down",
  },
  {
    id: "temptation",
    name: "Temptation",
    names: {
      te: "ప్రలోభం",
      en: "Temptation",
      hi: "प्रलोभन",
      ta: "சோதனை",
    },
    verses: ["2-60", "2-61", "2-70", "7-14"],
    gradient: ["#751e1e", "#8c3634"],
    icon: "nutrition",
  },
  {
    id: "forgetfulness",
    name: "Forgetfulness",
    names: {
      te: "మరచిపోవడం",
      en: "Forgetfulness",
      hi: "विस्मृति",
      ta: "மறதி",
    },
    verses: ["15-15", "18-61"],
    gradient: ["#42175d", "#662f70"],
    icon: "bookmark",
  },
  {
    id: "losing-hope",
    name: "Losing Hope",
    names: {
      te: "ఆశ కోల్పోవడం",
      en: "Losing Hope",
      hi: "आशा खोना",
      ta: "நம்பிக்கை இழப்பு",
    },
    verses: ["4-11", "9-22", "9-34", "18-66", "18-78"],
    gradient: ["#7f2d14", "#945440"],
    icon: "sunny",
  },
];

/** Localized category name, falling back to the English label. */
export function getCategoryName(
  category: Category,
  language: ContentLanguage
): string {
  return category.names[language]?.trim() || category.name;
}
