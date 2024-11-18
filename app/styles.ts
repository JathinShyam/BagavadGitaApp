import { StyleSheet } from "react-native";

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
    backgroundColor: "#FFF8E7",
  },
  header: {
    padding: 20,
    alignItems: "center",
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
    marginBottom: 16,
  },
  listContainer: {
    padding: 16,
  },
  chapterCard: {
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
  chapterNumber: {
    fontSize: 16,
    color: "#666666",
    marginBottom: 4,
  },
  sanskritName: {
    fontSize: 20,
    color: "#4A3200",
    marginBottom: 4,
  },
  chapterName: {
    fontSize: 18,
    color: "#4A3200",
    marginBottom: 8,
  },
  versesCount: {
    fontSize: 14,
    color: "#666666",
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
});
