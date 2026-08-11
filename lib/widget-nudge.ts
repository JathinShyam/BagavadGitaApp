import AsyncStorage from "@react-native-async-storage/async-storage";

import { STORAGE_KEYS } from "@/constants/storage-keys";
import { getLocalDateKey, addDaysToDateKey } from "@/lib/date-keys";

const DISMISS_DAYS = 14;

export async function shouldShowWidgetNudge(): Promise<boolean> {
  try {
    const until = await AsyncStorage.getItem(STORAGE_KEYS.WIDGET_NUDGE_DISMISSED);
    if (!until) return true;
    return getLocalDateKey() > until;
  } catch {
    return true;
  }
}

export async function dismissWidgetNudge(): Promise<void> {
  const until = addDaysToDateKey(getLocalDateKey(), DISMISS_DAYS);
  await AsyncStorage.setItem(STORAGE_KEYS.WIDGET_NUDGE_DISMISSED, until);
}
