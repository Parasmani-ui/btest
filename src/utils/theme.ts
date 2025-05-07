import { useContext, createContext } from 'react';

// Define a theme context
const ThemeContext = createContext<{
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}>({
  theme: 'dark',
  toggleTheme: () => {}
});

// Hook to use theme
export const useTheme = () => {
  return useContext(ThemeContext);
};

// Theme provider
export const ThemeProvider = ThemeContext.Provider; 