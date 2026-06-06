import { captureRef } from "react-native-view-shot";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import React from "react";
import { View } from "react-native";

import { ShareCard } from "@/components/verse/ShareCard";

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

export async function shareImage(uri: string): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) return;
  await Sharing.shareAsync(uri, {
    mimeType: "image/png",
    dialogTitle: "Share verse",
    UTI: "public.png",
  });
}

export function ShareCardView(props: React.ComponentProps<typeof ShareCard>) {
  return (
    <View style={{ position: "absolute", left: -9999, top: -9999, opacity: 0 }}>
      <ShareCard {...props} />
    </View>
  );
}

