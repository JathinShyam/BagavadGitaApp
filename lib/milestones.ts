import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  STREAK_MILESTONES,
  type StreakMilestone,
} from "@/constants/milestones";
import { STORAGE_KEYS } from "@/constants/storage-keys";
import type { MilestonesSeen } from "@/types/reading-progress";

export async function getMilestonesSeen(): Promise<MilestonesSeen> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.MILESTONES_SEEN);
    if (!raw) return {};
    return JSON.parse(raw) as MilestonesSeen;
  } catch {
    return {};
  }
}

export async function markMilestoneSeen(days: StreakMilestone): Promise<void> {
  const seen = await getMilestonesSeen();
  seen[String(days) as keyof MilestonesSeen] = true;
  await AsyncStorage.setItem(STORAGE_KEYS.MILESTONES_SEEN, JSON.stringify(seen));
}

/**
 * Returns the highest unseen milestone the streak has reached.
 * Uses >= so a jump past a threshold still unlocks celebration.
 */
export async function getUnseenMilestoneReached(
  currentStreak: number
): Promise<StreakMilestone | null> {
  const seen = await getMilestonesSeen();
  let found: StreakMilestone | null = null;
  for (const milestone of STREAK_MILESTONES) {
    if (
      currentStreak >= milestone &&
      !seen[String(milestone) as keyof MilestonesSeen]
    ) {
      found = milestone;
    }
  }
  return found;
}
