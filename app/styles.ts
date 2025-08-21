import { StyleSheet, Dimensions } from "react-native";
const windowWidth = Dimensions.get("window").width;
const cardWidth = (windowWidth - 48) / 2; // 2 cards per row with padding

export const savedstyles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor will be set dynamically
  },
  header: {
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    // color will be set dynamically
    marginBottom: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  listContainer: {
    padding: 16,
  },
  verseCard: {
    // backgroundColor and borderColor will be set dynamically
    margin: 8,
    borderRadius: 16,
    marginHorizontal: 0,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    width: "auto",
    borderWidth: 2,
    // Reduced margin for closer spacing
  },
  cardContent: {
    padding: 16,
  },
  verseLocation: {
    fontSize: 15,
    // color will be set dynamically
    marginBottom: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  sanskritText: {
    fontSize: 15,
    // color will be set dynamically
    marginBottom: 10,
    textAlign: "center",
    lineHeight: 22,
    fontStyle: "italic",
  },
  translationText: {
    fontSize: 16,
    // color will be set dynamically
  },
  emptyText: {
    fontSize: 18,
    // color will be set dynamically
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    // color will be set dynamically
    textAlign: "center",
  },
});

export const indexstyles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor will be set dynamically
  },
  header: {
    padding: 16,
    alignItems: "center",
    borderBottomWidth: 0,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    // color will be set dynamically
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    // color will be set dynamically
    marginBottom: 6,
  },
  scrollContainer: {
    padding: 16,
  },
  bookshelfContainer: {
    flex: 1,
    paddingVertical: 8,
  },
  shelfRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  chapterCard: {
    width: cardWidth,
    // backgroundColor and borderColor will be set dynamically
    borderRadius: 18,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    borderWidth: 1,
  },
  chapterImage: {
    width: "100%",
    height: 160,
    resizeMode: "cover",
  },
  cardContent: {
    padding: 12,
    // backgroundColor will be set dynamically
  },
  chapterNumber: {
    fontSize: 12,
    // color will be set dynamically
    marginBottom: 4,
    fontWeight: "500",
  },
  sanskritName: {
    fontSize: 14,
    fontWeight: "bold",
    // color will be set dynamically
    height: 44,
  },
  versesCount: {
    fontSize: 12,
    // color will be set dynamically
    fontStyle: "italic",
  },
  emptySlot: {
    width: cardWidth,
    height: 0,
  },
});

export const chapterstyles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor will be set dynamically
  },
  header: {
    padding: 20,
    // backgroundColor will be set dynamically
  },
  sanskritName: {
    fontSize: 24,
    // color will be set dynamically
    marginBottom: 8,
    textAlign: "center",
    fontWeight: "bold",
  },
  chapterName: {
    fontSize: 16,
    // color will be set dynamically
    marginBottom: 12,
    textAlign: "center",
    fontWeight: "bold",
  },
  descriptionCard: {
    // backgroundColor and borderColor will be set dynamically
    padding: 20,
    margin: 16,
    borderRadius: 16,
    marginHorizontal: 0,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    width: "auto",
    borderWidth: 1,
  },
  descriptionText: {
    fontSize: 14,
    // color will be set dynamically
    lineHeight: 24,
    textAlign: "justify",
    fontWeight: "500",
  },
  listContainer: {
    padding: 16,
  },
  verseCard: {
    // backgroundColor and borderColor will be set dynamically
    margin: 8,
    borderRadius: 16,
    marginHorizontal: 0,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    width: "auto",
    borderWidth: 2,
    // Same layout properties as description card
  },
  verseContent: {
    padding: 16,
  },
  verseNumber: {
    fontSize: 15,
    // color will be set dynamically
    marginBottom: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  teluguSloka: {
    fontSize: 15,
    // color will be set dynamically
    fontStyle: "italic",
    marginBottom: 10,
    lineHeight: 22,
    textAlign: "center",
  },
  translation: {
    fontSize: 16,
    // color will be set dynamically
    lineHeight: 24,
  },
});

export const versestyles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor will be set dynamically
  },
  content: {
    flex: 1,
  },
  saveButton: {
    padding: 8,
  },
  verseContainer: {
    padding: 20,
    // backgroundColor and borderColor will be set dynamically
    margin: 16,
    borderRadius: 16,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    borderWidth: 1,
  },
  teluguSlokaText: {
    fontSize: 18,
    color: "#F5F2EA",
    marginBottom: 12,
    textAlign: "center",
    lineHeight: 28,
    letterSpacing: 0.5,
  },
  transliteration: {
    fontSize: 16,
    color: "#C9C3B2",
    fontStyle: "italic",
    marginBottom: 16,
    textAlign: "center",
  },
  meaningStyle: {
    fontSize: 16,
    color: "#D9D4C5",
    lineHeight: 26,
    textAlign: "justify",
    letterSpacing: 0.3,
  },
  wordMeaningsContainer: {
    padding: 20,
    backgroundColor: "#11100E",
    margin: 16,
    borderRadius: 16,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 245, 224, 0.08)",
  },
  sectionTitle: {
    fontSize: 18,
    // color will be set dynamically
    marginBottom: 16,
    fontWeight: "bold",
  },
  wordMeaningRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 245, 224, 0.06)",
  },
  word: {
    fontSize: 16,
    color: "#F5F2EA",
    flex: 1,
  },
  meaning: {
    fontSize: 14,
    color: "#C9C3B2",
    flex: 2,
    textAlign: "right",
  },
  commentaryContainer: {
    padding: 20,
    backgroundColor: "#11100E",
    margin: 16,
    borderRadius: 16,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 245, 224, 0.08)",
  },
  commentaryText: {
    fontSize: 16,
    color: "#D9D4C5",
    lineHeight: 24,
    textAlign: "justify",
    letterSpacing: 0.3,
  },
  errorText: {
    fontSize: 18,
    color: "#F08A7E",
    textAlign: "center",
    marginTop: 20,
  },
  navigationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    // backgroundColor will be set dynamically
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    // backgroundColor and borderColor will be set dynamically
    borderWidth: 1,
    minWidth: 100,
    justifyContent: "center",
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: "500",
    // color will be set dynamically
    marginHorizontal: 8,
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
    color: "#C9C3B2",
  },
});

// Default export to fix the warning
export default {
  savedstyles,
  indexstyles,
  chapterstyles,
  versestyles,
};
