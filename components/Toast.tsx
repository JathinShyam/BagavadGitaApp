import React, { useEffect, useCallback } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  runOnJS,
} from "react-native-reanimated";
import { useAppTheme } from "../app/hooks/useAppTheme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export type ToastType = "success" | "info" | "warning" | "error";

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}

const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = "success",
  duration = 2000,
  onHide,
  icon,
}) => {
  const { colors, isDark } = useAppTheme();
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  const getIconName = (): keyof typeof Ionicons.glyphMap => {
    if (icon) return icon;
    switch (type) {
      case "success":
        return "checkmark-circle";
      case "info":
        return "information-circle";
      case "warning":
        return "warning";
      case "error":
        return "close-circle";
      default:
        return "checkmark-circle";
    }
  };

  const getIconColor = () => {
    switch (type) {
      case "success":
        return colors.success;
      case "info":
        return colors.primary;
      case "warning":
        return colors.warning;
      case "error":
        return colors.danger;
      default:
        return colors.success;
    }
  };

  const hideToast = useCallback(() => {
    onHide();
  }, [onHide]);

  useEffect(() => {
    if (visible) {
      translateY.value = withSequence(
        withTiming(60, { duration: 300 }),
        withTiming(60, { duration: duration }),
        withTiming(-100, { duration: 300 })
      );
      opacity.value = withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(1, { duration: duration }),
        withTiming(0, { duration: 300 }, () => {
          runOnJS(hideToast)();
        })
      );
    }
  }, [visible, duration, hideToast]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? colors.surface : colors.surfaceElevated,
          borderColor: colors.outline + "40",
        },
        animatedStyle,
      ]}
    >
      <Ionicons name={getIconName()} size={24} color={getIconColor()} />
      <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
    </Animated.View>
  );
};

// Toast Context for global usage
import { createContext, useContext, useState } from "react";

interface ToastContextType {
  showToast: (message: string, type?: ToastType, icon?: keyof typeof Ionicons.glyphMap) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toastState, setToastState] = useState({
    visible: false,
    message: "",
    type: "success" as ToastType,
    icon: undefined as keyof typeof Ionicons.glyphMap | undefined,
  });

  const showToast = (
    message: string,
    type: ToastType = "success",
    icon?: keyof typeof Ionicons.glyphMap
  ) => {
    setToastState({ visible: true, message, type, icon });
  };

  const hideToast = () => {
    setToastState((prev) => ({ ...prev, visible: false }));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast
        visible={toastState.visible}
        message={toastState.message}
        type={toastState.type}
        icon={toastState.icon}
        onHide={hideToast}
      />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  message: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    fontWeight: "500",
  },
});

export default Toast;
