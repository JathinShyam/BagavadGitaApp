import { View, Image, StyleSheet, type StyleProp, type ViewStyle, type ImageSourcePropType } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";

export const ORNAMENTS = {
  lotusSimple: require("../../assets/images/lotus-simple.png"),
  filigree: require("../../assets/images/filigree-swirl.png"),
  chapterEmbroidery: require("../../assets/images/chapter-embroidery.png"),
  settingsDivider: require("../../assets/images/settings-divider.png"),
  lotusBanner: require("../../assets/images/ornament-lotus-divider.png"),
} as const;

type Props = {
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
  source?: ImageSourcePropType;
  height?: number;
};

/**
 * Gold ornamental image divider, tinted with theme primary.
 */
export function OrnamentalDivider({
  style,
  compact,
  source = ORNAMENTS.lotusBanner,
  height,
}: Props) {
  const { colors } = useAppTheme();
  const h = height ?? (compact ? 28 : 40);

  return (
    <View style={[styles.row, style]} accessibilityElementsHidden>
      <Image
        source={source}
        style={[styles.ornament, { height: h, tintColor: colors.primary }]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
    width: "100%",
  },
  ornament: {
    width: "94%",
  },
});

export default OrnamentalDivider;

/** @deprecated use ORNAMENTS.chapterEmbroidery */
export const CHAPTER_LOTUS_ORNAMENT = ORNAMENTS.chapterEmbroidery;
