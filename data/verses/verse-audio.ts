import { audioMappings } from "./audio-mapper";

export function getAudioFile(
  chapter: string,
  verseNumber: string
): number[] | null {
  try {
    const verseNumbers = verseNumber.split("-").map(Number);
    const audioFiles = verseNumbers
      .map((num) => audioMappings[chapter]?.[num.toString()] as number | undefined)
      .filter((file): file is number => file != null);

    return audioFiles.length > 0 ? audioFiles : null;
  } catch (error) {
    console.error("Error getting audio file:", error);
    return null;
  }
}
