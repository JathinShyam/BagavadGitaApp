import type { ImageSourcePropType } from "react-native";

/**
 * White silhouette icons for Explore topic tiles (true alpha, immersive).
 * Mapped by category id from data/explore-categories.ts.
 */
export const TOPIC_ICONS: Record<string, ImageSourcePropType> = {
  anger: require("../assets/images/icon-flame.png"),
  "feeling-sinful": require("../assets/images/icon-pray.png"),
  "practising-forgiveness": require("../assets/images/icon-leaf.png"),
  pride: require("../assets/images/icon-lion.png"),
  "death-of-loved-one": require("../assets/images/icon-death.png"),
  "seeking-peace": require("../assets/images/icon-peace.png"),
  lust: require("../assets/images/icon-lust.png"),
  "uncontrolled-mind": require("../assets/images/icon-mind.png"),
  "dealing-with-envy": require("../assets/images/icon-envy.png"),
  discriminated: require("../assets/images/icon-discriminated.png"),
  laziness: require("../assets/images/icon-laziness.png"),
  loneliness: require("../assets/images/icon-loneliness.png"),
  depression: require("../assets/images/icon-depression.png"),
  confusion: require("../assets/images/icon-confusion.png"),
  fear: require("../assets/images/icon-fear.png"),
  greed: require("../assets/images/icon-greed.png"),
  demotivated: require("../assets/images/icon-demotivated.png"),
  temptation: require("../assets/images/icon-temptation.png"),
  forgetfulness: require("../assets/images/icon-forgetfulness.png"),
  "losing-hope": require("../assets/images/icon-hope.png"),
};

/**
 * Atmospheric background photos for Explore topic tiles.
 */
export const TOPIC_BACKGROUNDS: Record<string, ImageSourcePropType> = {
  anger: require("../assets/images/topic-anger-bg.webp"),
  "feeling-sinful": require("../assets/images/topic-sinful-bg.webp"),
  "practising-forgiveness": require("../assets/images/topic-forgiveness-bg.webp"),
  pride: require("../assets/images/topic-pride-bg.webp"),
  "death-of-loved-one": require("../assets/images/topic-death-bg.webp"),
  "seeking-peace": require("../assets/images/topic-peace-bg.webp"),
  lust: require("../assets/images/topic-lust-bg.webp"),
  "uncontrolled-mind": require("../assets/images/topic-mind-bg.webp"),
  "dealing-with-envy": require("../assets/images/topic-envy-bg.webp"),
  discriminated: require("../assets/images/topic-discriminated-bg.webp"),
  laziness: require("../assets/images/topic-laziness-bg.webp"),
  loneliness: require("../assets/images/topic-loneliness-bg.webp"),
  depression: require("../assets/images/topic-depression-bg.webp"),
  confusion: require("../assets/images/topic-confusion-bg.webp"),
  fear: require("../assets/images/topic-fear-bg.webp"),
  greed: require("../assets/images/topic-greed-bg.webp"),
  demotivated: require("../assets/images/topic-demotivated-bg.webp"),
  temptation: require("../assets/images/topic-temptation-bg.webp"),
  forgetfulness: require("../assets/images/topic-forgetfulness-bg.webp"),
  "losing-hope": require("../assets/images/topic-hope-bg.webp"),
};

export const TOPIC_BG_FALLBACK = require("../assets/images/topic-generic-dark.webp");
