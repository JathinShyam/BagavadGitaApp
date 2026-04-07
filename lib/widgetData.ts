import { NativeModules, Platform } from "react-native";

export type WidgetVerseData = {
  verseId: string;
  title: string; // e.g. "Chapter 2 • Verse 47"
  sloka: string;
  meaning: string;
  updatedAt: number;
};

const { WidgetDataModule } = NativeModules as any;

export async function setWidgetVerseData(data: WidgetVerseData): Promise<void> {
  if (Platform.OS !== "android" && Platform.OS !== "ios") return;
  if (!WidgetDataModule?.setWidgetData) return;
  await WidgetDataModule.setWidgetData(JSON.stringify(data));
}

