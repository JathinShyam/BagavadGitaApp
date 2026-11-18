import { StyleSheet, Dimensions } from "react-native";

import { Type } from "@/theme/design-tokens";

const windowWidth = Dimensions.get("window").width;
const cardWidth = (windowWidth - 48) / 2;

/** Quiet list row — no elevated card chrome. */
const calmListRow = {
  marginHorizontal: 0,
  marginVertical: 0,
  borderRadius: 0,
  elevation: 0,
  shadowOpacity: 0,
  shadowRadius: 0,
  borderWidth: 0,
  borderBottomWidth: StyleSheet.hairlineWidth,
} as const;

export const savedScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    alignItems: "flex-start",
  },
  title: {
    ...Type.title,
    marginBottom: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  verseCard: {
    ...calmListRow,
    width: "auto",
  },
  cardContent: {
    paddingVertical: 14,
    paddingHorizontal: 0,
  },
  verseLocation: {
    ...Type.label,
    marginBottom: 6,
    // English-only chrome: "Chapter 2 · Verse 47".
    letterSpacing: 0.3,
  },
  sanskritText: {
    ...Type.bodySm,
    marginBottom: 0,
    textAlign: "left",
    fontStyle: "italic",
  },
  translationText: {
    ...Type.body,
  },
  emptyText: {
    ...Type.heading,
    marginBottom: 8,
  },
  emptySubtext: {
    ...Type.bodySm,
    textAlign: "center",
  },
});

export const homeScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    alignItems: "center",
    borderBottomWidth: 0,
  },
  title: {
    ...Type.title,
    marginBottom: 4,
  },
  subtitle: {
    ...Type.bodySm,
    marginBottom: 6,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 28,
  },
  shelfRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
    marginBottom: 14,
  },
  emptySlot: {
    flex: 1,
  },
  richCard: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  richCardMedia: {
    width: "100%",
    height: 231,
    position: "relative",
    justifyContent: "flex-end",
  },
  richCardImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  richCardFade: {
    ...StyleSheet.absoluteFillObject,
  },
  richCardOverlay: {
    paddingHorizontal: 12,
    paddingBottom: 14,
    paddingTop: 36,
    zIndex: 1,
    gap: 4,
  },
  richCardEyebrow: {
    ...Type.caption,
    fontFamily: "PlayfairDisplay_700Bold",
  },
  richCardTitle: {
    color: "#FFFFFF",
    ...Type.bodySm,
    fontWeight: "600",
    marginBottom: 2,
  },
  richCardStatusRow: {
    marginTop: 4,
  },
  richCardStatusInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  richCardStatus: {
    color: "rgba(255,255,255,0.88)",
    ...Type.caption,
    fontWeight: "600",
  },
  richCardCheck: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    borderWidth: StyleSheet.hairlineWidth,
  },
  richCardVerseCount: {
    ...Type.caption,
    fontWeight: "700",
  },
  richCardTrackOnImage: {
    marginTop: 8,
    height: 3,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  richCardFill: {
    height: "100%",
    borderRadius: 999,
  },
  // Unused with overlay layout (kept briefly for compatibility)
  richCardFooter: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 8,
  },
  richCardMeta: {
    ...Type.label,
  },
  richCardTrack: {
    height: 3,
    borderRadius: 999,
    overflow: "hidden",
  },
  // Kept for try A reference
  chapterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chapterThumb: {
    width: 68,
    height: 68,
    borderRadius: 10,
    resizeMode: "cover",
  },
  chapterRowBody: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  chapterRowEyebrow: {
    ...Type.caption,
    fontFamily: "PlayfairDisplay_700Bold",
  },
  chapterRowTitle: {
    ...Type.bodySm,
    fontWeight: "600",
  },
  chapterRowMeta: {
    marginTop: 4,
    gap: 6,
  },
  chapterRowStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  chapterRowStatusText: {
    ...Type.caption,
    fontWeight: "400",
  },
  chapterRowTrack: {
    height: 3,
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 2,
  },
  chapterRowFill: {
    height: "100%",
    borderRadius: 999,
  },
  bookshelfContainer: {
    flex: 1,
    paddingVertical: 8,
  },
  chapterCard: {
    width: cardWidth,
    borderRadius: 14,
    overflow: "hidden",
    elevation: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chapterImage: {
    width: "100%",
    height: 185,
    resizeMode: "cover",
  },
  verseCountBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  verseCountBadgeText: {
    ...Type.caption,
    fontWeight: "700",
  },
  cardContent: {
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 6,
  },
  chapterNumber: {
    ...Type.caption,
    marginBottom: 2,
    fontWeight: "500",
  },
  sanskritName: {
    ...Type.label,
    fontWeight: "700",
    height: 36,
  },
  versesCount: {
    ...Type.caption,
    fontStyle: "italic",
  },
  chapterProgressContainer: {
    marginTop: 2,
  },
  chapterProgressBarBackground: {
    width: "100%",
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
    marginTop: 4,
  },
  chapterProgressBarFill: {
    height: "100%",
    borderRadius: 999,
  },
  chapterProgressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chapterProgressLabel: {
    ...Type.caption,
    fontWeight: "400",
  },
  chapterProgressBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  chapterProgressBadgeText: {
    ...Type.caption,
  },
});

export const chapterScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 2,
  },
  sanskritName: {
    ...Type.title,
    marginBottom: 8,
    textAlign: "center",
  },
  chapterName: {
    ...Type.body,
    marginBottom: 12,
    textAlign: "center",
    fontWeight: "600",
  },
  descriptionCard: {
    paddingVertical: 16,
    paddingHorizontal: 0,
    margin: 0,
    borderRadius: 0,
    elevation: 0,
    shadowOpacity: 0,
    borderWidth: 0,
    width: "auto",
  },
  descriptionText: {
    ...Type.body,
    textAlign: "left",
    fontWeight: "400",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  verseCard: {
    ...calmListRow,
    width: "auto",
  },
  verseContent: {
    paddingVertical: 14,
    paddingHorizontal: 0,
  },
  verseHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  verseNumber: {
    ...Type.caption,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  teluguSloka: {
    ...Type.body,
    fontStyle: "italic",
    marginBottom: 0,
    textAlign: "left",
  },
  readBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 0,
    borderWidth: 0,
    marginBottom: 0,
  },
  readBadgeText: {
    ...Type.caption,
    marginLeft: 4,
  },
  continueCta: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
    marginBottom: 4,
    gap: 12,
  },
  continueCtaBody: {
    flex: 1,
    gap: 2,
  },
  continueCtaLabel: {
    ...Type.label,
    fontWeight: "700",
  },
  continueCtaSubtitle: {
    ...Type.bodySm,
  },
  translation: {
    ...Type.body,
  },
});

export const verseScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  saveButton: {
    padding: 8,
  },
  verseContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 8,
    borderRadius: 0,
    elevation: 0,
    shadowOpacity: 0,
    borderWidth: 0,
  },
  // Font family is applied at the render site: Playfair Italic for the Latin
  // sloka, platform serif for Telugu/Hindi/Tamil (BUG-026).
  teluguSlokaText: {
    ...Type.sloka,
    marginBottom: 12,
    textAlign: "center",
  },
  transliteration: {
    ...Type.body,
    fontStyle: "italic",
    marginBottom: 16,
    textAlign: "center",
  },
  meaningStyle: {
    ...Type.body,
    textAlign: "left",
  },
  wordMeaningsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 0,
    marginVertical: 4,
    borderRadius: 0,
    elevation: 0,
    shadowOpacity: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
  },
  sectionTitle: {
    ...Type.heading,
    marginBottom: 12,
  },
  wordMeaningRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  word: {
    ...Type.body,
    flex: 1,
  },
  meaning: {
    ...Type.bodySm,
    flex: 2,
    textAlign: "right",
  },
  commentaryContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 0,
    marginVertical: 4,
    borderRadius: 0,
    elevation: 0,
    shadowOpacity: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
  },
  commentaryText: {
    ...Type.body,
    textAlign: "left",
  },
  errorText: {
    ...Type.heading,
    textAlign: "center",
    marginTop: 20,
  },
  navigationButtons: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  navButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  navButtonText: {
    ...Type.bodySm,
    fontWeight: "700",
  },
  audioContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 0,
    gap: 8,
    minHeight: 40,
  },
  audioPlayBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  audioMuteBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  slider: {
    flex: 1,
    height: 32,
    marginHorizontal: 2,
  },
  audioTime: {
    ...Type.caption,
    minWidth: 36,
    textAlign: "center",
    padding: 0,
  },
});

export default {
  savedScreenStyles,
  homeScreenStyles,
  chapterScreenStyles,
  verseScreenStyles,
};
