import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, BounceIn } from "react-native-reanimated";
import { useAppTheme } from "@/hooks/useAppTheme";

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}) => {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      {/* Decorative circles */}
      <View style={styles.illustrationContainer}>
        <Animated.View
          entering={FadeIn.delay(100).duration(600)}
          style={[
            styles.circle,
            styles.circleLarge,
            { backgroundColor: colors.primary + "10" },
          ]}
        />
        <Animated.View
          entering={FadeIn.delay(200).duration(600)}
          style={[
            styles.circle,
            styles.circleMedium,
            { backgroundColor: colors.primary + "15" },
          ]}
        />
        <Animated.View
          entering={BounceIn.delay(300).duration(800)}
          style={[
            styles.iconContainer,
            { backgroundColor: colors.primary + "20" },
          ]}
        >
          <Ionicons name={icon} size={64} color={colors.primary} />
        </Animated.View>
      </View>

      <Animated.View entering={FadeIn.delay(400).duration(600)}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      </Animated.View>

      <Animated.View entering={FadeIn.delay(500).duration(600)}>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {subtitle}
        </Text>
      </Animated.View>

      {actionLabel && onAction && (
        <Animated.View entering={FadeIn.delay(600).duration(600)}>
          <Pressable
            onPress={onAction}
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.actionText, { color: colors.onPrimary }]}>
              {actionLabel}
            </Text>
          </Pressable>
        </Animated.View>
      )}

      {/* Decorative elements */}
      <View style={styles.decorContainer} pointerEvents="none">
        {[...Array(6)].map((_, i) => (
          <Animated.View
            key={i}
            entering={FadeIn.delay(700 + i * 100).duration(600)}
            style={[
              styles.dot,
              {
                backgroundColor: colors.primary + "30",
                left: `${15 + i * 15}%`,
                top: 20 + Math.sin(i) * 30,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  illustrationContainer: {
    width: 180,
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  circle: {
    position: "absolute",
    borderRadius: 999,
  },
  circleLarge: {
    width: 180,
    height: 180,
  },
  circleMedium: {
    width: 140,
    height: 140,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 280,
  },
  actionButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 16,
    fontWeight: "600",
  },
  decorContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  dot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default EmptyState;
