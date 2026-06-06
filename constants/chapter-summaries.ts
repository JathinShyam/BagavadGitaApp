import { CHAPTER_IMAGES } from "./chapter-images";
import { CHAPTER_VERSE_COUNTS } from "./chapter-verse-counts";

export interface ChapterSummary {
  id: number;
  telugu_name: string;
  verses: number;
  image: (typeof CHAPTER_IMAGES)[number];
}

/** Lightweight chapter list for the home screen. */
export const CHAPTER_SUMMARIES: ChapterSummary[] = [
  { id: 1, telugu_name: "అర్జున విషాద యోగము", verses: CHAPTER_VERSE_COUNTS[1], image: CHAPTER_IMAGES[1] },
  { id: 2, telugu_name: "సాంఖ్య యోగము", verses: CHAPTER_VERSE_COUNTS[2], image: CHAPTER_IMAGES[2] },
  { id: 3, telugu_name: "కర్మ యోగము", verses: CHAPTER_VERSE_COUNTS[3], image: CHAPTER_IMAGES[3] },
  { id: 4, telugu_name: "జ్ఞాన, కర్మ, సన్న్యాస యోగము", verses: CHAPTER_VERSE_COUNTS[4], image: CHAPTER_IMAGES[4] },
  { id: 5, telugu_name: "కర్మ సన్న్యాస యోగము", verses: CHAPTER_VERSE_COUNTS[5], image: CHAPTER_IMAGES[5] },
  { id: 6, telugu_name: "ధ్యాన యోగము", verses: CHAPTER_VERSE_COUNTS[6], image: CHAPTER_IMAGES[6] },
  { id: 7, telugu_name: "జ్ఞాన విజ్ఞాన యోగము", verses: CHAPTER_VERSE_COUNTS[7], image: CHAPTER_IMAGES[7] },
  { id: 8, telugu_name: "అక్షర బ్రహ్మ యోగము", verses: CHAPTER_VERSE_COUNTS[8], image: CHAPTER_IMAGES[8] },
  { id: 9, telugu_name: "రాజ విద్యా యోగము", verses: CHAPTER_VERSE_COUNTS[9], image: CHAPTER_IMAGES[9] },
  { id: 10, telugu_name: "విభూతి యోగము", verses: CHAPTER_VERSE_COUNTS[10], image: CHAPTER_IMAGES[10] },
  { id: 11, telugu_name: "విశ్వ రూప దర్శన యోగము", verses: CHAPTER_VERSE_COUNTS[11], image: CHAPTER_IMAGES[11] },
  { id: 12, telugu_name: "భక్తి యోగము", verses: CHAPTER_VERSE_COUNTS[12], image: CHAPTER_IMAGES[12] },
  { id: 13, telugu_name: "క్షేత్ర క్షేత్రజ్ఞ విభాగ యోగము", verses: CHAPTER_VERSE_COUNTS[13], image: CHAPTER_IMAGES[13] },
  { id: 14, telugu_name: "గుణత్రయ విభాగ యోగము", verses: CHAPTER_VERSE_COUNTS[14], image: CHAPTER_IMAGES[14] },
  { id: 15, telugu_name: "పురుషోత్తమ యోగము", verses: CHAPTER_VERSE_COUNTS[15], image: CHAPTER_IMAGES[15] },
  { id: 16, telugu_name: "దైవాసుర సంపద్విభాగ యోగము", verses: CHAPTER_VERSE_COUNTS[16], image: CHAPTER_IMAGES[16] },
  { id: 17, telugu_name: "శ్రద్ధా త్రయ విభాగ యోగము", verses: CHAPTER_VERSE_COUNTS[17], image: CHAPTER_IMAGES[17] },
  { id: 18, telugu_name: "మోక్ష సన్యాస యోగము", verses: CHAPTER_VERSE_COUNTS[18], image: CHAPTER_IMAGES[18] },
];
