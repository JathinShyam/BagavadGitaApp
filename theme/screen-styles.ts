import { StyleSheet, Dimensions } from "react-native";

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
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 28,
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
    fontSize: 14,
    marginBottom: 6,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  sanskritText: {
    fontSize: 15,
    marginBottom: 0,
    textAlign: "left",
    lineHeight: 22,
    fontStyle: "italic",
  },
  translationText: {
    fontSize: 16,
  },
  emptyText: {
    fontSize: 18,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
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
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 30,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
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
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 13,
    letterSpacing: 0.3,
  },
  richCardTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 21,
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
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
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
    fontSize: 12,
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
    fontSize: 13,
    fontWeight: "600",
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
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 13,
    letterSpacing: 0.2,
  },
  chapterRowTitle: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 21,
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
    fontSize: 12,
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
    fontSize: 11,
    fontWeight: "700",
  },
  cardContent: {
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 6,
  },
  chapterNumber: {
    fontSize: 11,
    marginBottom: 2,
    fontWeight: "500",
  },
  sanskritName: {
    fontSize: 13,
    fontWeight: "bold",
    height: 36,
  },
  versesCount: {
    fontSize: 12,
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
    fontSize: 11,
  },
  chapterProgressBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  chapterProgressBadgeText: {
    fontSize: 10,
    fontWeight: "600",
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
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 24,
    marginBottom: 8,
    textAlign: "center",
  },
  chapterName: {
    fontSize: 16,
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
    fontSize: 15,
    lineHeight: 24,
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
    fontSize: 12,
    marginBottom: 6,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  teluguSloka: {
    fontSize: 16,
    fontStyle: "italic",
    marginBottom: 0,
    lineHeight: 26,
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
    fontSize: 11,
    marginLeft: 4,
    fontWeight: "600",
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
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  continueCtaSubtitle: {
    fontSize: 13,
  },
  translation: {
    fontSize: 16,
    lineHeight: 24,
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
  teluguSlokaText: {
    fontSize: 22,
    marginBottom: 12,
    textAlign: "center",
    lineHeight: 36,
    letterSpacing: 0.4,
  },
  transliteration: {
    fontSize: 16,
    fontStyle: "italic",
    marginBottom: 16,
    textAlign: "center",
  },
  meaningStyle: {
    fontSize: 16,
    lineHeight: 26,
    textAlign: "left",
    letterSpacing: 0.2,
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
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 22,
    marginBottom: 12,
  },
  wordMeaningRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  word: {
    fontSize: 16,
    flex: 1,
  },
  meaning: {
    fontSize: 14,
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
    fontSize: 16,
    lineHeight: 26,
    textAlign: "left",
    letterSpacing: 0.2,
  },
  errorText: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
  },
  navigationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 90,
    justifyContent: "center",
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: "500",
    marginHorizontal: 6,
  },
  audioContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
  },
  audioTime: {
    fontSize: 14,
  },
});

export default {
  savedScreenStyles,
  homeScreenStyles,
  chapterScreenStyles,
  verseScreenStyles,
};
