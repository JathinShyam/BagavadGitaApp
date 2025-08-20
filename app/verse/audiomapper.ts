// Define types for better type safety
interface AudioMapping {
  [key: string]: any; // NodeRequire or similar audio file type
}

// Create audio mappings for each chapter
const chapter1Audio: AudioMapping = {
  "1": require("../audios/chapter1/chapter1verse1.mp3"),
  "2": require("../audios/chapter1/chapter1verse2.mp3"),
  "3": require("../audios/chapter1/chapter1verse3.mp3"),
  "4": require("../audios/chapter1/chapter1verse4.mp3"),
  "5": require("../audios/chapter1/chapter1verse5.mp3"),
  "6": require("../audios/chapter1/chapter1verse6.mp3"),
  "7": require("../audios/chapter1/chapter1verse7.mp3"),
  "8": require("../audios/chapter1/chapter1verse8.mp3"),
  "9": require("../audios/chapter1/chapter1verse9.mp3"),
  "10": require("../audios/chapter1/chapter1verse10.mp3"),
  "11": require("../audios/chapter1/chapter1verse11.mp3"),
  "12": require("../audios/chapter1/chapter1verse12.mp3"),
  "13": require("../audios/chapter1/chapter1verse13.mp3"),
  "14": require("../audios/chapter1/chapter1verse14.mp3"),
  "15": require("../audios/chapter1/chapter1verse15.mp3"),
  "16": require("../audios/chapter1/chapter1verse16.mp3"),
  "17": require("../audios/chapter1/chapter1verse17.mp3"),
  "18": require("../audios/chapter1/chapter1verse18.mp3"),
  "19": require("../audios/chapter1/chapter1verse19.mp3"),
  "20": require("../audios/chapter1/chapter1verse20.mp3"),
  "21": require("../audios/chapter1/chapter1verse21.mp3"),
  "22": require("../audios/chapter1/chapter1verse22.mp3"),
  "23": require("../audios/chapter1/chapter1verse23.mp3"),
  "24": require("../audios/chapter1/chapter1verse24.mp3"),
  "25": require("../audios/chapter1/chapter1verse25.mp3"),
  "26": require("../audios/chapter1/chapter1verse26.mp3"),
  "27": require("../audios/chapter1/chapter1verse27.mp3"),
  "28": require("../audios/chapter1/chapter1verse28.mp3"),
  "29": require("../audios/chapter1/chapter1verse29.mp3"),
  "30": require("../audios/chapter1/chapter1verse30.mp3"),
  "31": require("../audios/chapter1/chapter1verse31.mp3"),
  "32": require("../audios/chapter1/chapter1verse32.mp3"),
  "33": require("../audios/chapter1/chapter1verse33.mp3"),
  "34": require("../audios/chapter1/chapter1verse34.mp3"),
  "35": require("../audios/chapter1/chapter1verse35.mp3"),
  "36": require("../audios/chapter1/chapter1verse36.mp3"),
  "37": require("../audios/chapter1/chapter1verse37.mp3"),
  "38": require("../audios/chapter1/chapter1verse38.mp3"),
  "39": require("../audios/chapter1/chapter1verse39.mp3"),
  "40": require("../audios/chapter1/chapter1verse40.mp3"),
  "41": require("../audios/chapter1/chapter1verse41.mp3"),
  "42": require("../audios/chapter1/chapter1verse42.mp3"),
  "43": require("../audios/chapter1/chapter1verse43.mp3"),
  "44": require("../audios/chapter1/chapter1verse44.mp3"),
  "45": require("../audios/chapter1/chapter1verse45.mp3"),
  "46": require("../audios/chapter1/chapter1verse46.mp3"),
  "47": require("../audios/chapter1/chapter1verse47.mp3"),
};

// Main audio mapping object
export const audioMappings: { [key: string]: AudioMapping } = {
  "1": chapter1Audio,
  // '2': chapter2Audio,
  // Add more chapters
};

// Add default export at the end
export default audioMappings;
