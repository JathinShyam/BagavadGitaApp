import { useTheme } from "@/context/theme-context";
import { Palette } from "@/theme/design-tokens";

export const useAppTheme = () => {
  const { theme } = useTheme();

  const colors = theme === "dark" ? Palette.dark : Palette.light;

  return {
    colors,
    isDark: theme === "dark",
    isLight: theme === "light",
  };
};

export default useAppTheme;
