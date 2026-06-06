export interface WordMeaning {
  word: string;
  meaning: string;
}

export interface Verse {
  id: string;
  chapter: number;
  verse_number: string;
  teluguSloka?: string;
  meaning?: string;
  word_meanings?: WordMeaning[];
  commentary?: string;
}

export interface VerseForNotification {
  id: string;
  chapter: number;
  verse_number: string;
  meaning?: string;
  teluguSloka?: string;
}
