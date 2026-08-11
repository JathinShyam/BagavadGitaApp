import AsyncStorage from "@react-native-async-storage/async-storage";

import { STORAGE_KEYS } from "@/constants/storage-keys";
import {
  getReadingPathById,
  getNextIncompleteDay as getNextDayFromPath,
  isPathComplete as isPathDaysComplete,
  getPathTitle,
  getPathDescription,
  getPathDayTitle,
  type PathDay,
  type ReadingPath,
  READING_PATHS,
} from "@/data/reading-paths";
import { getLocalDateKey } from "@/lib/date-keys";
import type { ActiveReadingPath } from "@/types/reading-progress";

export {
  READING_PATHS,
  getReadingPathById,
  getPathTitle,
  getPathDescription,
  getPathDayTitle,
};
export type { ReadingPath, PathDay, ActiveReadingPath };

export async function getActivePath(): Promise<ActiveReadingPath | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_PATH);
    if (!raw) return null;
    return JSON.parse(raw) as ActiveReadingPath;
  } catch {
    return null;
  }
}

export async function setActivePath(pathId: string): Promise<ActiveReadingPath> {
  const payload: ActiveReadingPath = {
    pathId,
    startedAt: new Date().toISOString(),
    completedDayIds: [],
    lastCompletedDate: null,
  };
  await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_PATH, JSON.stringify(payload));
  return payload;
}

export async function clearActivePath(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_PATH);
}

export async function saveActivePath(path: ActiveReadingPath): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_PATH, JSON.stringify(path));
}

export function getNextIncompleteDay(
  path: ReadingPath,
  active: ActiveReadingPath
): PathDay | null {
  return getNextDayFromPath(path, active.completedDayIds);
}

export function isPathComplete(path: ReadingPath, active: ActiveReadingPath): boolean {
  return isPathDaysComplete(path, active.completedDayIds);
}

/**
 * When a verse is read, complete the path day that contains it (if active).
 */
let pathWriteQueue: Promise<unknown> = Promise.resolve();

export async function markPathProgressForVerse(verseId: string): Promise<{
  dayCompleted: boolean;
  pathCompleted: boolean;
  active: ActiveReadingPath | null;
}> {
  const task = pathWriteQueue.then(async () => {
    const active = await getActivePath();
    if (!active) return { dayCompleted: false, pathCompleted: false, active: null };

    const path = getReadingPathById(active.pathId);
    if (!path) return { dayCompleted: false, pathCompleted: false, active };

    const day = path.days.find(
      (d) => d.verseIds.includes(verseId) && !active.completedDayIds.includes(d.id)
    );
    if (!day) return { dayCompleted: false, pathCompleted: false, active };

    const next: ActiveReadingPath = {
      ...active,
      completedDayIds: [...active.completedDayIds, day.id],
      lastCompletedDate: getLocalDateKey(),
    };
    await saveActivePath(next);
    const pathCompleted = isPathComplete(path, next);
    return { dayCompleted: true, pathCompleted, active: next };
  });
  pathWriteQueue = task.catch(() => {});
  return task;
}
