import { View, StyleSheet, type ViewProps, type StyleProp, type ViewStyle } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Radius, Spacing } from "@/theme/design-tokens";

type Props = ViewProps & {
  style?: StyleProp<ViewStyle>;
  /** Tighter padding for dense list cards */
  compact?: boolean;
};

/** Surface card with a soft primary border — theme-aware for light and dark. */
export function GoldCard({ style, compact, children, ...rest }: Props) {
  const { colors, isDark } = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        compact && styles.compact,
        {
          backgroundColor: isDark ? colors.surfaceElevated : colors.surface,
          borderColor: colors.primary + (isDark ? "88" : "70"),
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    padding: Spacing.lg,
  },
  compact: {
    padding: Spacing.md,
  },
});

export default GoldCard;
