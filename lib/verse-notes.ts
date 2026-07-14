import AsyncStorage from "@react-native-async-storage/async-storage";

import { STORAGE_KEYS } from "@/constants/storage-keys";
import type { VerseNote, VerseNotes } from "@/types/reading-progress";

export async function getAllVerseNotes(): Promise<VerseNotes> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.VERSE_NOTES);
    if (!raw) return {};
    return JSON.parse(raw) as VerseNotes;
  } catch {
    return {};
  }
}

export async function getVerseNote(verseId: string): Promise<VerseNote | null> {
  const notes = await getAllVerseNotes();
  return notes[verseId] ?? null;
}

export async function setVerseNote(verseId: string, text: string): Promise<VerseNote> {
  const notes = await getAllVerseNotes();
  const trimmed = text.trim();
  if (!trimmed) {
    delete notes[verseId];
    await AsyncStorage.setItem(STORAGE_KEYS.VERSE_NOTES, JSON.stringify(notes));
    return { text: "", updatedAt: new Date().toISOString() };
  }
  const note: VerseNote = { text: trimmed, updatedAt: new Date().toISOString() };
  notes[verseId] = note;
  await AsyncStorage.setItem(STORAGE_KEYS.VERSE_NOTES, JSON.stringify(notes));
  return note;
}
