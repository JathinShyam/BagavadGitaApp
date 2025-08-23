import { useTheme } from "../context/ThemeContext";
import { Palette } from "../theme";

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
