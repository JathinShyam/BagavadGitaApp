import { audioMappings } from "./audio-mapper";

/** Expand "1-3" / "13-15" into every traditional verse number in the inclusive range. */
function expandVerseNumbers(verseNumber: string): number[] {
  const parts = verseNumber
    .split("-")
    .map(Number)
    .filter((n) => Number.isFinite(n));
  if (parts.length === 0) return [];
  if (parts.length === 1) return [parts[0]];
  const start = Math.min(parts[0], parts[parts.length - 1]);
  const end = Math.max(parts[0], parts[parts.length - 1]);
  const nums: number[] = [];
  for (let n = start; n <= end; n++) nums.push(n);
  return nums;
}

export function getAudioFile(
  chapter: string,
  verseNumber: string
): number[] | null {
  try {
    const verseNumbers = expandVerseNumbers(verseNumber);
    const audioFiles = verseNumbers
      .map((num) => audioMappings[chapter]?.[num.toString()] as number | undefined)
      .filter((file): file is number => file != null);

    return audioFiles.length > 0 ? audioFiles : null;
  } catch (error) {
    console.error("Error getting audio file:", error);
    return null;
  }
}
