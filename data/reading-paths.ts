/**
 * Curated multi-day reading paths (local only — no path builder).
 */

import {
  CONTENT_LANGUAGE_FALLBACKS,
  DEFAULT_CONTENT_LANGUAGE,
  type ContentLanguage,
} from "@/constants/languages";

export interface PathDay {
  /** Stable id within the path, e.g. "day-1" */
  id: string;
  day: number;
  /** Localized day titles. */
  titles: Partial<Record<ContentLanguage, string>>;
  verseIds: string[];
}

export interface ReadingPath {
  id: string;
  titles: Partial<Record<ContentLanguage, string>>;
  descriptions: Partial<Record<ContentLanguage, string>>;
  days: PathDay[];
}

function pickLocalized(
  map: Partial<Record<ContentLanguage, string>> | undefined,
  language: ContentLanguage
): string {
  if (!map) return "";
  const preferred = map[language]?.trim();
  if (preferred) return preferred;
  for (const code of CONTENT_LANGUAGE_FALLBACKS) {
    if (code === language) continue;
    const candidate = map[code]?.trim();
    if (candidate) return candidate;
  }
  return "";
}

export function getPathTitle(
  path: ReadingPath,
  language: ContentLanguage = DEFAULT_CONTENT_LANGUAGE
): string {
  return pickLocalized(path.titles, language);
}

export function getPathDescription(
  path: ReadingPath,
  language: ContentLanguage = DEFAULT_CONTENT_LANGUAGE
): string {
  return pickLocalized(path.descriptions, language);
}

export function getPathDayTitle(
  day: PathDay,
  language: ContentLanguage = DEFAULT_CONTENT_LANGUAGE
): string {
  return pickLocalized(day.titles, language);
}

export const READING_PATHS: ReadingPath[] = [
  {
    id: "chapter-2-week",
    titles: {
      en: "Chapter 2 in 7 days",
      te: "7 రోజుల్లో 2వ అధ్యాయం",
      hi: "7 दिनों में अध्याय 2",
      ta: "7 நாட்களில் அத்தியாயம் 2",
    },
    descriptions: {
      en: "Walk through Sankhya Yoga — the foundation of wisdom — one step a day.",
      te: "సాంఖ్య యోగం — జ్ఞాన పునాది —ను రోజుకు ఒక అడుగు చొప్పున చదవండి.",
      hi: "सांख्य योग — ज्ञान की नींव — को प्रतिदिन एक कदम आगे बढ़ाएँ।",
      ta: "சாங்கிய யோகம் — ஞானத்தின் அடித்தளம் — ஒவ்வொரு நாளும் ஒரு படி.",
    },
    days: [
      {
        id: "day-1",
        day: 1,
        titles: {
          en: "Arjuna’s despair",
          te: "అర్జునుని విషాదం",
          hi: "अर्जुन का विषाद",
          ta: "அர்ஜுனனின் துக்கம்",
        },
        verseIds: ["2-1", "2-2", "2-3"],
      },
      {
        id: "day-2",
        day: 2,
        titles: {
          en: "The eternal self",
          te: "నిత్యాత్మ",
          hi: "शाश्वत आत्मा",
          ta: "நித்திய ஆன்மா",
        },
        verseIds: ["2-11", "2-12", "2-13"],
      },
      {
        id: "day-3",
        day: 3,
        titles: {
          en: "Duty without attachment",
          te: "ఫలాసక్తి లేని కర్తవ్యం",
          hi: "आसक्ति रहित कर्तव्य",
          ta: "பற்றுதலற்ற கடமை",
        },
        verseIds: ["2-47", "2-48"],
      },
      {
        id: "day-4",
        day: 4,
        titles: {
          en: "Steady wisdom",
          te: "స్థితప్రజ్ఞత",
          hi: "स्थिर प्रज्ञा",
          ta: "நிலையான ஞானம்",
        },
        verseIds: ["2-54", "2-55", "2-56"],
      },
      {
        id: "day-5",
        day: 5,
        titles: {
          en: "Sense control",
          te: "ఇంద్రియ నిగ్రహం",
          hi: "इंद्रिय संयम",
          ta: "புலன் கட்டுப்பாடு",
        },
        verseIds: ["2-58", "2-59", "2-62", "2-63"],
      },
      {
        id: "day-6",
        day: 6,
        titles: {
          en: "Peace of mind",
          te: "మనఃశాంతి",
          hi: "मन की शांति",
          ta: "மன அமைதி",
        },
        verseIds: ["2-64", "2-65", "2-66"],
      },
      {
        id: "day-7",
        day: 7,
        titles: {
          en: "The established yogi",
          te: "స్థిత యోగి",
          hi: "स्थित योगी",
          ta: "நிலைபெற்ற யோகி",
        },
        verseIds: ["2-70", "2-71", "2-72"],
      },
    ],
  },
  {
    id: "seeking-peace",
    titles: {
      en: "Seeking peace",
      te: "శాంతి వైపు",
      hi: "शांति की खोज",
      ta: "அமைதியைத் தேடி",
    },
    descriptions: {
      en: "Seven days of verses for a quieter heart when the mind is restless.",
      te: "మనసు అశాంతంగా ఉన్నప్పుడు నిశ్చల హృదయం కోసం ఏడు రోజుల శ్లోకాలు.",
      hi: "जब मन व्याकुल हो, शांत हृदय के लिए सात दिनों के श्लोक।",
      ta: "மனம் அலைபாயும்போது அமைதியான உள்ளத்திற்கான ஏழு நாள் பாடல்கள்.",
    },
    days: [
      {
        id: "day-1",
        day: 1,
        titles: {
          en: "Stillness",
          te: "నిశ్చలత",
          hi: "स्थिरता",
          ta: "அமைதி",
        },
        verseIds: ["2-70"],
      },
      {
        id: "day-2",
        day: 2,
        titles: {
          en: "Equanimity",
          te: "సమత్వం",
          hi: "समभाव",
          ta: "சமநிலை",
        },
        verseIds: ["2-56"],
      },
      {
        id: "day-3",
        day: 3,
        titles: {
          en: "Surrender the fruits",
          te: "ఫలాలను వదలడం",
          hi: "फल समर्पण",
          ta: "பலன்களை விடுதல்",
        },
        verseIds: ["2-47"],
      },
      {
        id: "day-4",
        day: 4,
        titles: {
          en: "Inner renunciation",
          te: "అంతర సన్న్యాసం",
          hi: "आंतरिक संन्यास",
          ta: "உள் துறவு",
        },
        verseIds: ["5-26"],
      },
      {
        id: "day-5",
        day: 5,
        titles: {
          en: "Devotion’s calm",
          te: "భక్తి శాంతి",
          hi: "भक्ति की शांति",
          ta: "பக்தியின் அமைதி",
        },
        verseIds: ["12-13-14"],
      },
      {
        id: "day-6",
        day: 6,
        titles: {
          en: "Trust",
          te: "విశ్వాసం",
          hi: "विश्वास",
          ta: "நம்பிக்கை",
        },
        verseIds: ["18-66"],
      },
      {
        id: "day-7",
        day: 7,
        titles: {
          en: "Abiding peace",
          te: "నిలిచిన శాంతి",
          hi: "स्थायी शांति",
          ta: "நிலையான அமைதி",
        },
        verseIds: ["6-26", "6-27"],
      },
    ],
  },
  {
    id: "foundations",
    titles: {
      en: "Foundational verses",
      te: "మూల శ్లోకాలు",
      hi: "आधारभूत श्लोक",
      ta: "அடிப்படை பாடல்கள்",
    },
    descriptions: {
      en: "A gentle intro to the Gita’s most remembered teachings.",
      te: "గీతలో అత్యంత గుర్తుండిపోయే బోధలకు సున్నిత పరిచయం.",
      hi: "गीता की सबसे यादगार शिक्षाओं का सरल परिचय।",
      ta: "கீதையின் மிக நினைவுகூரப்படும் போதனைகளுக்கு மென்மையான அறிமுகம்.",
    },
    days: [
      {
        id: "day-1",
        day: 1,
        titles: {
          en: "You are not the body",
          te: "మీరు శరీరం కాదు",
          hi: "आप शरीर नहीं हैं",
          ta: "நீங்கள் உடல் அல்ல",
        },
        verseIds: ["2-20"],
      },
      {
        id: "day-2",
        day: 2,
        titles: {
          en: "Act, don’t cling",
          te: "చేయండి, అంటిపెట్టుకోకండి",
          hi: "कर्म करो, आसक्त न हो",
          ta: "செயல் செய், பற்றாதே",
        },
        verseIds: ["2-47"],
      },
      {
        id: "day-3",
        day: 3,
        titles: {
          en: "Yoga is skill in action",
          te: "యోగం కర్మలో నైపుణ్యం",
          hi: "योग कर्म में कुशलता है",
          ta: "யோகம் செயலில் திறமை",
        },
        verseIds: ["2-50"],
      },
      {
        id: "day-4",
        day: 4,
        titles: {
          en: "See the divine in all",
          te: "అన్నింటిలో దైవాన్ని చూడండి",
          hi: "सब में ईश्वर देखो",
          ta: "எல்லாவற்றிலும் இறைவனைக் காண்",
        },
        verseIds: ["6-29"],
      },
      {
        id: "day-5",
        day: 5,
        titles: {
          en: "Offer everything",
          te: "అంతా అర్పించండి",
          hi: "सब कुछ अर्पित करो",
          ta: "எல்லாம் அர்ப்பணி",
        },
        verseIds: ["9-27"],
      },
      {
        id: "day-6",
        day: 6,
        titles: {
          en: "Love without hate",
          te: "ద్వేషం లేని ప్రేమ",
          hi: "द्वेष रहित प्रेम",
          ta: "வெறுப்பற்ற அன்பு",
        },
        verseIds: ["12-13-14"],
      },
      {
        id: "day-7",
        day: 7,
        titles: {
          en: "Come to Me",
          te: "నా వద్దకు రండి",
          hi: "मेरे पास आओ",
          ta: "என்னிடம் வா",
        },
        verseIds: ["18-65", "18-66"],
      },
    ],
  },
];

export function getReadingPathById(pathId: string): ReadingPath | undefined {
  return READING_PATHS.find((p) => p.id === pathId);
}

export function getNextIncompleteDay(
  path: ReadingPath,
  completedDayIds: string[]
): PathDay | null {
  return path.days.find((d) => !completedDayIds.includes(d.id)) ?? null;
}

export function isPathComplete(path: ReadingPath, completedDayIds: string[]): boolean {
  return path.days.every((d) => completedDayIds.includes(d.id));
}
