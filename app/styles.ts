import { StyleSheet, Dimensions } from "react-native";
const windowWidth = Dimensions.get("window").width;
const cardWidth = (windowWidth - 48) / 2; // 2 cards per row with padding


export const savedstyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8E7",
  },
  header: {
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4A3200",
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
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    padding: 16,
  },
  verseLocation: {
    fontSize: 16,
    color: "#666666",
    marginBottom: 8,
  },
  sanskritText: {
    fontSize: 18,
    color: "#4A3200",
    marginBottom: 8,
  },
  translationText: {
    fontSize: 16,
    color: "#333333",
  },
  emptyText: {
    fontSize: 18,
    color: "#4A3200",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
  },
});


export const indexstyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5EFE0", // Warmer background color for bookshelf feel
  },
  header: {
    padding: 10,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E0D6C1", // Subtle border for header
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#4A3200",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#4A3200",
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
    marginBottom: 10,
    // Add a subtle shelf appearance
    // paddingBottom: 8,
    // borderBottomWidth: 4,
    // borderBottomColor: '#8B7355', // Wooden shelf color
  },
  chapterCard: {
    width: cardWidth,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#E0D6C1",
  },
  chapterImage: {
    width: "100%",
    height: 180,
    resizeMode: "cover",
  },
  cardContent: {
    padding: 12,
    backgroundColor: "#FFF8E7", // Slightly different background for text area
  },
  chapterNumber: {
    fontSize: 14,
    color: "#8B5A2B", // Darker wood color
    marginBottom: 4,
    fontWeight: "500",
  },
  sanskritName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4A3200",
    // marginBottom: 3,
    height: 50, // Fixed height for title to ensure consistent card sizes
  },
  versesCount: {
    fontSize: 14,
    color: "#8B5A2B",
    fontStyle: "italic",
  },
  emptySlot: {
    width: cardWidth,
    height: 0, // Takes space but isn't visible
  },
});

export const chapterstyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8E7",
  },
  header: {
    padding: 20,
    backgroundColor: "#FFF8E7",
  },
  sanskritName: {
    fontSize: 24,
    color: "#4A3200",
    marginBottom: 8,
    textAlign: "center",
    fontWeight: "bold",
  },
  chapterName: {
    fontSize: 18,
    color: "#4A3200",
    marginBottom: 12,
    textAlign: "center",
    fontWeight: "bold",
  },
  // description: {
  //   fontSize: 16,
  //   color: "#666666",
  //   lineHeight: 20,
  //   textAlign: "justify",
  // },
  // descriptionCard: {
  //   backgroundColor: "#FFF8E7",
  //   padding: 20,
  //   margin: 16,
  //   borderRadius: 12,
  //   elevation: 2,
  //   shadowColor: "#000",
  //   shadowOffset: { width: 0, height: 2 },
  //   shadowOpacity: 0.1,
  //   shadowRadius: 4,
  // },
  // descriptionText: {
  //   fontSize: 16,
  //   color: "#666666",
  //   lineHeight: 24,
  //   textAlign: "justify",
  //   fontWeight: "bold",
  // },

  descriptionCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    margin: 16,
    borderRadius: 12,
    marginHorizontal: 0,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    width: "auto",
  },
  descriptionText: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 24,
    textAlign: "justify",
    fontWeight: "bold",
  },
  listContainer: {
    padding: 16,
  },
  verseCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  verseContent: {
    padding: 16,
  },
  verseNumber: {
    fontSize: 16,
    color: "#666666",
    marginBottom: 8,
    fontWeight: "bold",
  },
  //   sanskritText: {
  //     fontSize: 18,
  //     color: "#4A3200",
  //     marginBottom: 8,
  //   },
  teluguSloka: {
    fontSize: 14,
    color: "#666666",
    fontStyle: "italic",
    marginBottom: 8,
    // fontWeight: "bold",
  },
  translation: {
    fontSize: 16,
    color: "#333333",
    lineHeight: 24,
  },
});

export const versestyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8E7",
  },
  content: {
    flex: 1,
  },
  saveButton: {
    padding: 8,
  },
  verseContainer: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    margin: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  teluguSlokaText: {
    fontSize: 18,
    color: "#4A3200",
    marginBottom: 12,
    textAlign: "center",
  },
  transliteration: {
    fontSize: 16,
    color: "#666666",
    fontStyle: "italic",
    marginBottom: 16,
    textAlign: "center",
  },
  meaningStyle: {
    fontSize: 16,
    color: "#333333",
    lineHeight: 26,
    textAlign: "justify",
  },
  wordMeaningsContainer: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    margin: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    color: "#4A3200",
    marginBottom: 16,
    fontWeight: "bold",
  },
  wordMeaningRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  word: {
    fontSize: 16,
    color: "#4A3200",
    flex: 1,
  },
  meaning: {
    fontSize: 14,
    color: "#666666",
    flex: 2,
    textAlign: "right",
  },
  commentaryContainer: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    margin: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  commentaryText: {
    fontSize: 16,
    color: "#333333",
    lineHeight: 24,
    textAlign: "justify",
  },
  errorText: {
    fontSize: 18,
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
  navigationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#FFF8E7",
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
    color: "#666666",
  },
});
