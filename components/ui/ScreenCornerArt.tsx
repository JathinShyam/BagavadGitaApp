import { Image, StyleSheet, type ImageSourcePropType, type StyleProp, type ImageStyle } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";

export const CORNER_ART = {
  chariot: require("../../assets/images/journey-chariot.png"),
  chariotLine: require("../../assets/images/saved-chariot-lineart.png"),
  krishna: require("../../assets/images/krishna-conch.png"),
} as const;

type Props = {
  source?: ImageSourcePropType;
  style?: StyleProp<ImageStyle>;
  /** Override default theme opacity */
  opacity?: number;
  /** Tint with theme primary (good for line-art) */
  tint?: boolean;
};

/**
 * Soft decorative art anchored top-right behind headers.
 * Opacity is lower in dark mode so gold UI stays readable.
 */
export function ScreenCornerArt({
  source = CORNER_ART.chariot,
  style,
  opacity,
  tint = true,
}: Props) {
  const { colors, isDark } = useAppTheme();
  const resolvedOpacity = opacity ?? (isDark ? 0.22 : 0.32);

  return (
    <Image
      source={source}
      style={[
        styles.art,
        { opacity: resolvedOpacity },
        tint ? { tintColor: colors.primary } : null,
        style,
      ]}
      resizeMode="contain"
      accessible={false}
      importantForAccessibility="no"
    />
  );
}

const styles = StyleSheet.create({
  art: {
    position: "absolute",
    top: -8,
    right: -12,
    width: 140,
    height: 140,
    zIndex: 0,
  },
});

export default ScreenCornerArt;
