import { captureRef } from "react-native-view-shot";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import React from "react";
import { Platform, Share, View, type ViewStyle } from "react-native";

import { ShareCard } from "@/components/verse/ShareCard";
import { StreakShareCard } from "@/components/verse/StreakShareCard";
import { DEEP_LINKS } from "@/constants/routes";
import { translate } from "@/lib/i18n";
import { DEFAULT_CONTENT_LANGUAGE, type ContentLanguage } from "@/constants/languages";

/**
 * Cards are laid out at full size but placed outside the viewport, then captured
 * from their own bounds. The wrapper must carry the measured size, so it has to
 * be the positioned element — an absolutely positioned child inside a plain
 * wrapper leaves the wrapper 0×0 and captureRef renders nothing.
 */
const offscreen: ViewStyle = { position: "absolute", left: -9999, top: -9999 };

export async function captureShareCardRef(viewRef: any): Promise<string> {
  const uri = await captureRef(viewRef, {
    format: "png",
    quality: 1,
  });

  // Ensure file lives in cache directory with stable extension.
  const target = `${FileSystem.cacheDirectory}share-card-${Date.now()}.png`;
  await FileSystem.copyAsync({ from: uri, to: target });
  return target;
}

export async function shareImage(
  uri: string,
  language: ContentLanguage = DEFAULT_CONTENT_LANGUAGE
): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) return;
  await Sharing.shareAsync(uri, {
    mimeType: "image/png",
    dialogTitle: translate(language, "share.dialogTitle"),
    UTI: "public.png",
  });
}

/**
 * Capture and share a verse card.
 *
 * iOS can carry text and a file together, so the recipient gets the image plus a
 * tappable `bagavadgita://verses/<id>` link. Android's Share API drops the file
 * when text is present, so the image goes on its own and the deep link is
 * printed on the card instead.
 *
 * Returns false when there is nothing to capture or no share sheet available.
 */
export async function shareVerseCard(
  viewRef: React.RefObject<View | null>,
  verseId: string,
  caption: string,
  language: ContentLanguage = DEFAULT_CONTENT_LANGUAGE
): Promise<boolean> {
  const view = viewRef.current;
  if (!view) return false;

  const uri = await captureShareCardRef(view);
  const message = `${caption}\n${DEEP_LINKS.verse(verseId)}`;

  if (Platform.OS === "ios") {
    await Share.share({ message, url: uri });
    return true;
  }

  if (!(await Sharing.isAvailableAsync())) return false;
  await shareImage(uri, language);
  return true;
}

export const ShareCardView = React.forwardRef<
  View,
  React.ComponentProps<typeof ShareCard>
>(function ShareCardView(props, ref) {
  return (
    <View ref={ref} collapsable={false} pointerEvents="none" style={offscreen}>
      <ShareCard {...props} />
    </View>
  );
});

export const StreakShareCardView = React.forwardRef<
  View,
  React.ComponentProps<typeof StreakShareCard>
>(function StreakShareCardView(props, ref) {
  return (
    <View ref={ref} collapsable={false} pointerEvents="none" style={offscreen}>
      <StreakShareCard {...props} />
    </View>
  );
});
