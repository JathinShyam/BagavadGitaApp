import type { Verse } from "@/types";

import { chapter1 } from "./chapters/chapter-01";
import { chapter2 } from "./chapters/chapter-02";
import { chapter3 } from "./chapters/chapter-03";
import { chapter4 } from "./chapters/chapter-04";
import { chapter5 } from "./chapters/chapter-05";
import { chapter6 } from "./chapters/chapter-06";
import { chapter7 } from "./chapters/chapter-07";
import { chapter8 } from "./chapters/chapter-08";
import { chapter9 } from "./chapters/chapter-09";
import { chapter10 } from "./chapters/chapter-10";
import { chapter11 } from "./chapters/chapter-11";
import { chapter12 } from "./chapters/chapter-12";
import { chapter13 } from "./chapters/chapter-13";
import { chapter14 } from "./chapters/chapter-14";
import { chapter15 } from "./chapters/chapter-15";
import { chapter16 } from "./chapters/chapter-16";
import { chapter17 } from "./chapters/chapter-17";
import { chapter18 } from "./chapters/chapter-18";

export {
  chapter1,
  chapter2,
  chapter3,
  chapter4,
  chapter5,
  chapter6,
  chapter7,
  chapter8,
  chapter9,
  chapter10,
  chapter11,
  chapter12,
  chapter13,
  chapter14,
  chapter15,
  chapter16,
  chapter17,
  chapter18,
};

export const ALL_VERSES: Verse[] = [
  ...chapter1,
  ...chapter2,
  ...chapter3,
  ...chapter4,
  ...chapter5,
  ...chapter6,
  ...chapter7,
  ...chapter8,
  ...chapter9,
  ...chapter10,
  ...chapter11,
  ...chapter12,
  ...chapter13,
  ...chapter14,
  ...chapter15,
  ...chapter16,
  ...chapter17,
  ...chapter18,
];

export function getVerseById(id: string): Verse | undefined {
  return ALL_VERSES.find((verse) => verse.id === id);
}

export function getVersesByChapter(chapterId: number): Verse[] {
  switch (chapterId) {
    case 1:
      return chapter1;
    case 2:
      return chapter2;
    case 3:
      return chapter3;
    case 4:
      return chapter4;
    case 5:
      return chapter5;
    case 6:
      return chapter6;
    case 7:
      return chapter7;
    case 8:
      return chapter8;
    case 9:
      return chapter9;
    case 10:
      return chapter10;
    case 11:
      return chapter11;
    case 12:
      return chapter12;
    case 13:
      return chapter13;
    case 14:
      return chapter14;
    case 15:
      return chapter15;
    case 16:
      return chapter16;
    case 17:
      return chapter17;
    case 18:
      return chapter18;
    default:
      return [];
  }
}
