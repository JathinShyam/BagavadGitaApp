/**
 * Bhagavad Gita verses by topic/category.
 * Format: Chapter.Verse → verse ID (chapter-verse_number)
 * Combined verses (e.g., 16.1-3) use the app's verse_number format.
 * Gradient colors for Spotify-style Explore tiles.
 */
export interface Category {
  id: string;
  name: string;
  verses: string[];
  /** Gradient colors [start, end] for tile background */
  gradient: [string, string];
  /** Ionicons name for tile icon */
  icon: string;
}

export const CATEGORIES: Category[] = [
  {
    id: "anger",
    name: "Anger",
    verses: ["2-56", "2-62", "2-63", "5-26", "16-1-3", "16-21"],
    gradient: ["#E53935", "#FF6F60"],
    icon: "flame",
  },
  {
    id: "feeling-sinful",
    name: "Feeling Sinful",
    verses: ["4-36", "4-37", "5-10", "9-30", "10-3", "14-6", "18-66"],
    gradient: ["#6A1B9A", "#9C27B0"],
    icon: "heart-dislike",
  },
  {
    id: "practising-forgiveness",
    name: "Practising Forgiveness",
    verses: ["11-44", "12-13-14", "16-1-3"],
    gradient: ["#2E7D32", "#66BB6A"],
    icon: "heart",
  },
  {
    id: "pride",
    name: "Pride",
    verses: ["16-4", "16-13-15", "18-26", "18-58"],
    gradient: ["#F9A825", "#FFD54F"],
    icon: "trophy",
  },
  {
    id: "death-of-loved-one",
    name: "Death of a Loved One",
    verses: ["2-13", "2-20", "2-22", "2-25", "2-27"],
    gradient: ["#37474F", "#546E7A"],
    icon: "flower",
  },
  {
    id: "seeking-peace",
    name: "Seeking Peace",
    verses: ["2-66", "2-71", "4-39", "5-29", "8-28"],
    gradient: ["#0277BD", "#4FC3F7"],
    icon: "leaf",
  },
  {
    id: "lust",
    name: "Lust",
    verses: ["3-37", "3-41", "3-43", "5-22", "16-21"],
    gradient: ["#AD1457", "#F06292"],
    icon: "sparkles",
  },
  {
    id: "uncontrolled-mind",
    name: "Uncontrolled Mind",
    verses: ["6-5", "6-6", "6-26", "6-35"],
    gradient: ["#7B1FA2", "#BA68C8"],
    icon: "flash",
  },
  {
    id: "dealing-with-envy",
    name: "Dealing with Envy",
    verses: ["12-13-14", "16-19-20", "18-71"],
    gradient: ["#1B5E20", "#81C784"],
    icon: "eye",
  },
  {
    id: "discriminated",
    name: "Discriminated",
    verses: ["5-18", "5-19", "6-32", "9-29"],
    gradient: ["#5D4037", "#A1887F"],
    icon: "people",
  },
  {
    id: "laziness",
    name: "Laziness",
    verses: ["3-8", "3-20-21", "6-16", "18-39"],
    gradient: ["#E65100", "#FFB74D"],
    icon: "bed",
  },
  {
    id: "loneliness",
    name: "Loneliness",
    verses: ["6-30", "9-29", "13-16", "13-18"],
    gradient: ["#455A64", "#90A4AE"],
    icon: "person",
  },
  {
    id: "depression",
    name: "Depression",
    verses: ["2-3", "2-14", "5-21"],
    gradient: ["#1565C0", "#42A5F5"],
    icon: "cloudy",
  },
  {
    id: "confusion",
    name: "Confusion",
    verses: ["2-7", "3-1-2", "18-61"],
    gradient: ["#303F9F", "#7986CB"],
    icon: "help-circle",
  },
  {
    id: "fear",
    name: "Fear",
    verses: ["4-10", "11-50", "18-30"],
    gradient: ["#4A148C", "#7E57C2"],
    icon: "warning",
  },
  {
    id: "greed",
    name: "Greed",
    verses: ["14-17", "16-21", "17-25"],
    gradient: ["#F57F17", "#FFCA28"],
    icon: "wallet",
  },
  {
    id: "demotivated",
    name: "Demotivated",
    verses: ["11-33", "18-48", "18-78"],
    gradient: ["#616161", "#9E9E9E"],
    icon: "trending-down",
  },
  {
    id: "temptation",
    name: "Temptation",
    verses: ["2-60", "2-61", "2-70", "7-14"],
    gradient: ["#C62828", "#EF5350"],
    icon: "nutrition",
  },
  {
    id: "forgetfulness",
    name: "Forgetfulness",
    verses: ["15-15", "18-61"],
    gradient: ["#6A1B9A", "#AB47BC"],
    icon: "bookmark",
  },
  {
    id: "losing-hope",
    name: "Losing Hope",
    verses: ["4-11", "9-22", "9-34", "18-66", "18-78"],
    gradient: ["#D84315", "#FF8A65"],
    icon: "sunny",
  },
];
