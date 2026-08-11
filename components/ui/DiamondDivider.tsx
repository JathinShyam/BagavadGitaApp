import { View, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";

type Props = {
  style?: StyleProp<ViewStyle>;
};

/** Thin gold line with a centered diamond — matches explore featured-card mockup. */
export function DiamondDivider({ style }: Props) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.row, style]} accessibilityElementsHidden>
      <View style={[styles.line, { backgroundColor: colors.primary + "99" }]} />
      <View
        style={[
          styles.diamond,
          {
            borderColor: colors.primary,
            backgroundColor: colors.surface,
          },
        ]}
      />
      <View style={[styles.line, { backgroundColor: colors.primary + "99" }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: 10,
    gap: 8,
  },
  line: {
    flex: 1,
    height: 1,
  },
  diamond: {
    width: 8,
    height: 8,
    borderWidth: 1.5,
    transform: [{ rotate: "45deg" }],
  },
});

export default DiamondDivider;
