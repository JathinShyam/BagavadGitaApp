jest.mock("react-native-view-shot", () => ({
  captureRef: jest.fn(async () => "file:///tmp/capture.png"),
}));

// The share service only captures these; rendering them would pull in Expo
// modules that the Jest preset does not transform.
jest.mock("@/components/verse/ShareCard", () => ({ ShareCard: () => null }));
jest.mock("@/components/verse/StreakShareCard", () => ({ StreakShareCard: () => null }));

jest.mock("expo-file-system/legacy", () => ({
  cacheDirectory: "file:///cache/",
  copyAsync: jest.fn(async () => undefined),
}));

jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async () => undefined),
}));

// Imports come after the mocks so the mocked modules load first.
/* eslint-disable import/first -- jest.mock() calls are hoisted above imports */
import { createRef } from "react";
import { Platform, Share, View } from "react-native";
import * as Sharing from "expo-sharing";

import { shareVerseCard } from "@/services/verse-share";
/* eslint-enable import/first */

const ref = createRef<View>();

describe("shareVerseCard (BUG-015)", () => {
  beforeEach(() => {
    (ref as { current: View | null }).current = {} as View;
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns false when the card is not mounted", async () => {
    (ref as { current: View | null }).current = null;

    await expect(shareVerseCard(ref, "2-47", "Bhagavad Gita")).resolves.toBe(false);
  });

  it("shares the image and a tappable deep link on iOS", async () => {
    jest
      .spyOn(Share, "share")
      .mockResolvedValue({ action: Share.sharedAction } as never);

    await expect(shareVerseCard(ref, "2-47", "Bhagavad Gita")).resolves.toBe(true);

    const payload = (Share.share as jest.Mock).mock.calls[0][0];
    expect(payload.message).toContain("bagavadgita://verses/2-47");
    expect(payload.url).toContain("share-card-");
    expect(Sharing.shareAsync).not.toHaveBeenCalled();
  });

  it("shares the image through the system sheet on Android", async () => {
    const originalOS = Platform.OS;
    Object.defineProperty(Platform, "OS", { value: "android", configurable: true });
    jest.spyOn(Share, "share");

    try {
      await expect(shareVerseCard(ref, "2-47", "Bhagavad Gita")).resolves.toBe(true);

      expect(Sharing.shareAsync).toHaveBeenCalledWith(
        expect.stringContaining("share-card-"),
        expect.objectContaining({ mimeType: "image/png" })
      );
      expect(Share.share).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(Platform, "OS", { value: originalOS, configurable: true });
    }
  });
});
