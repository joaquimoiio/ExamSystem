import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('exam-system-theme');
    if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
      return savedTheme;
    }
    
    // Default to auto if no preference set
    return 'auto';
  });

  const getEffectiveTheme = () => {
    if (theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  };

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('exam-system-theme', theme);
    
    // Apply theme to document
    const effectiveTheme = getEffectiveTheme();
    if (effectiveTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      // Only auto-switch if theme is set to auto
      if (theme === 'auto') {
        // Force re-render to apply new system preference
        const effectiveTheme = e.matches ? 'dark' : 'light';
        if (effectiveTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const setAutoTheme = () => {
    setTheme('auto');
  };

  const effectiveTheme = getEffectiveTheme();
  
  const value = {
    theme,
    setTheme,
    toggleTheme,
    setAutoTheme,
    effectiveTheme,
    isDark: effectiveTheme === 'dark',
    isLight: effectiveTheme === 'light',
    isAuto: theme === 'auto'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;