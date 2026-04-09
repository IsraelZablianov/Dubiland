import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

export type ThemeSlug = 'bear' | 'football' | 'magic' | 'space' | 'ocean';

export interface ThemeConfig {
  slug: ThemeSlug;
  nameKey: string;
  mascotEmoji: string;
}

export const themes: Record<ThemeSlug, ThemeConfig> = {
  bear: { slug: 'bear', nameKey: 'themes.bear', mascotEmoji: '🧸' },
  football: { slug: 'football', nameKey: 'themes.football', mascotEmoji: '⚽' },
  magic: { slug: 'magic', nameKey: 'themes.magic', mascotEmoji: '🦄' },
  space: { slug: 'space', nameKey: 'themes.space', mascotEmoji: '🚀' },
  ocean: { slug: 'ocean', nameKey: 'themes.ocean', mascotEmoji: '🌊' },
};

interface ThemeContextValue {
  theme: ThemeSlug;
  themeConfig: ThemeConfig;
  setTheme: (theme: ThemeSlug) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeSlug;
}

export function ThemeProvider({ children, defaultTheme = 'bear' }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeSlug>(defaultTheme);

  const setTheme = useCallback((newTheme: ThemeSlug) => {
    setThemeState(newTheme);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    return () => {
      document.documentElement.removeAttribute('data-theme');
    };
  }, [theme]);

  const value: ThemeContextValue = {
    theme,
    themeConfig: themes[theme],
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
