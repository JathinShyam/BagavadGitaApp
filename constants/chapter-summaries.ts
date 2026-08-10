import { CHAPTER_IMAGES } from "./chapter-images";
import { CHAPTER_VERSE_COUNTS } from "./chapter-verse-counts";
import {
  CONTENT_LANGUAGE_FALLBACKS,
  DEFAULT_CONTENT_LANGUAGE,
  type ContentLanguage,
} from "./languages";

export interface ChapterSummary {
  id: number;
  /** Localized chapter titles. Fill additional keys when translations are ready. */
  names: Partial<Record<ContentLanguage, string>>;
  verses: number;
  image: (typeof CHAPTER_IMAGES)[number];
}

/** Lightweight chapter list for the home screen. */
export const CHAPTER_SUMMARIES: ChapterSummary[] = [
  {
    id: 1,
    names: {
      te: "అర్జున విషాద యోగము",
      en: "Arjuna Vishada Yoga",
      hi: "अर्जुन विषाद योग",
      ta: "அர்ஜுன விஷாத யோகம்",
    },
    verses: CHAPTER_VERSE_COUNTS[1],
    image: CHAPTER_IMAGES[1],
  },
  {
    id: 2,
    names: {
      te: "సాంఖ్య యోగము",
      en: "Sankhya Yoga",
      hi: "सांख्य योग",
      ta: "சாங்கிய யோகம்",
    },
    verses: CHAPTER_VERSE_COUNTS[2],
    image: CHAPTER_IMAGES[2],
  },
  {
    id: 3,
    names: {
      te: "కర్మ యోగము",
      en: "Karma Yoga",
      hi: "कर्म योग",
      ta: "கர்ம யோகம்",
    },
    verses: CHAPTER_VERSE_COUNTS[3],
    image: CHAPTER_IMAGES[3],
  },
  {
    id: 4,
    names: {
      te: "జ్ఞాన, కర్మ, సన్న్యాస యోగము",
      en: "Jnana Karma Sannyasa Yoga",
      hi: "ज्ञान कर्म संन्यास योग",
      ta: "ஞான கர்ம சந்நியாச யோகம்",
    },
    verses: CHAPTER_VERSE_COUNTS[4],
    image: CHAPTER_IMAGES[4],
  },
  {
    id: 5,
    names: {
      te: "కర్మ సన్న్యాస యోగము",
      en: "Karma Sannyasa Yoga",
      hi: "कर्म संन्यास योग",
      ta: "கர்ம சந்நியாச யோகம்",
    },
    verses: CHAPTER_VERSE_COUNTS[5],
    image: CHAPTER_IMAGES[5],
  },
  {
    id: 6,
    names: {
      te: "ధ్యాన యోగము",
      en: "Dhyana Yoga",
      hi: "ध्यान योग",
      ta: "தியான யோகம்",
    },
    verses: CHAPTER_VERSE_COUNTS[6],
    image: CHAPTER_IMAGES[6],
  },
  {
    id: 7,
    names: {
      te: "జ్ఞాన విజ్ఞాన యోగము",
      en: "Jnana Vijnana Yoga",
      hi: "ज्ञान विज्ञान योग",
      ta: "ஞான விஜ்ஞான யோகம்",
    },
    verses: CHAPTER_VERSE_COUNTS[7],
    image: CHAPTER_IMAGES[7],
  },
  {
    id: 8,
    names: {
      te: "అక్షర బ్రహ్మ యోగము",
      en: "Akshara Brahma Yoga",
      hi: "अक्षर ब्रह्म योग",
      ta: "அக்ஷர ப்ரஹ்ம யோகம்",
    },
    verses: CHAPTER_VERSE_COUNTS[8],
    image: CHAPTER_IMAGES[8],
  },
  {
    id: 9,
    names: {
      te: "రాజ విద్యా యోగము",
      en: "Raja Vidya Yoga",
      hi: "राज विद्या योग",
      ta: "ராஜ வித்யா யோகம்",
    },
    verses: CHAPTER_VERSE_COUNTS[9],
    image: CHAPTER_IMAGES[9],
  },
  {
    id: 10,
    names: {
      te: "విభూతి యోగము",
      en: "Vibhuti Yoga",
      hi: "विभूति योग",
      ta: "விபூதி யோகம்",
    },
    verses: CHAPTER_VERSE_COUNTS[10],
    image: CHAPTER_IMAGES[10],
  },
  {
    id: 11,
    names: {
      te: "విశ్వ రూప దర్శన యోగము",
      en: "Vishwarupa Darshana Yoga",
      hi: "विश्वरूप दर्शन योग",
      ta: "விஷ்வ ரூப தர்ஷன யோகம்",
    },
    verses: CHAPTER_VERSE_COUNTS[11],
    image: CHAPTER_IMAGES[11],
  },
  {
    id: 12,
    names: {
      te: "భక్తి యోగము",
      en: "Bhakti Yoga",
      hi: "भक्ति योग",
      ta: "பக்தி யோகம்",
    },
    verses: CHAPTER_VERSE_COUNTS[12],
    image: CHAPTER_IMAGES[12],
  },
  {
    id: 13,
    names: {
      te: "క్షేత్ర క్షేత్రజ్ఞ విభాగ యోగము",
      en: "Kshetra Kshetrajna Vibhaga Yoga",
      hi: "क्षेत्र क्षेत्रज्ञ विभाग योग",
      ta: "க்ஷேத்ர க்ஷேத்ரஜ்ஞ விபாக யோகம்",
    },
    verses: CHAPTER_VERSE_COUNTS[13],
    image: CHAPTER_IMAGES[13],
  },
  {
    id: 14,
    names: {
      te: "గుణత్రయ విభాగ యోగము",
      en: "Gunatraya Vibhaga Yoga",
      hi: "गुणत्रय विभाग योग",
      ta: "குணத்ரய விபாக யோகம்",
    },
    verses: CHAPTER_VERSE_COUNTS[14],
    image: CHAPTER_IMAGES[14],
  },
  {
    id: 15,
    names: {
      te: "పురుషోత్తమ యోగము",
      en: "Purushottama Yoga",
      hi: "पुरुषोत्तम योग",
      ta: "புருஷோத்தம யோகம்",
    },
    verses: CHAPTER_VERSE_COUNTS[15],
    image: CHAPTER_IMAGES[15],
  },
  {
    id: 16,
    names: {
      te: "దైవాసుర సంపద్విభాగ యోగము",
      en: "Daivasura Sampad Vibhaga Yoga",
      hi: "दैवासुर संपद्विभाग योग",
      ta: "தைவாசுர சம்பத்விபாக யோகம்",
    },
    verses: CHAPTER_VERSE_COUNTS[16],
    image: CHAPTER_IMAGES[16],
  },
  {
    id: 17,
    names: {
      te: "శ్రద్ధా త్రయ విభాగ యోగము",
      en: "Shraddha Traya Vibhaga Yoga",
      hi: "श्रद्धा त्रय विभाग योग",
      ta: "ஶ்ரத்தா த்ரய விபாக யோகம்",
    },
    verses: CHAPTER_VERSE_COUNTS[17],
    image: CHAPTER_IMAGES[17],
  },
  {
    id: 18,
    names: {
      te: "మోక్ష సన్యాస యోగము",
      en: "Moksha Sannyasa Yoga",
      hi: "मोक्ष संन्यास योग",
      ta: "மோக்ஷ சந்நியாச யோகம்",
    },
    verses: CHAPTER_VERSE_COUNTS[18],
    image: CHAPTER_IMAGES[18],
  },
];

/** Prefer selected language, then English, then remaining locales. */
const CHAPTER_NAME_FALLBACKS: ContentLanguage[] = [
  "en",
  ...CONTENT_LANGUAGE_FALLBACKS.filter((code) => code !== "en"),
];

export function getChapterName(
  chapter: ChapterSummary | { names: Partial<Record<ContentLanguage, string>>; id?: number },
  language: ContentLanguage = DEFAULT_CONTENT_LANGUAGE
): string {
  const direct = chapter.names[language]?.trim();
  if (direct) return direct;
  for (const code of CHAPTER_NAME_FALLBACKS) {
    if (code === language) continue;
    const name = chapter.names[code]?.trim();
    if (name) return name;
  }
  return chapter.id != null ? `Chapter ${chapter.id}` : "";
}
