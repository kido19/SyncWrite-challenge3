import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDark));
    
    if (isDark) {
      document.body.style.background = 'linear-gradient(160deg, #0a0a0a 0%, #111111 50%, #0d0d0d 100%)';
      document.body.style.color = '#e8e8e8';
    } else {
      document.body.style.background = 'linear-gradient(160deg, #f5f5f5 0%, #ebebeb 50%, #f0f0f0 100%)';
      document.body.style.color = '#111111';
    }
    
    document.body.style.minHeight = '100vh';
    document.body.style.margin = '0';
    document.body.style.fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const theme = {
    isDark,
    toggleTheme,
    colors: {
      dark: {
        primary: '#0a0a0a',
        secondary: '#111111',
        tertiary: '#181818',
        accent: '#c0c0c0',
        accentLight: '#e0e0e0',
        accentDark: '#888888',
        surface: 'rgba(20, 20, 20, 0.85)',
        surfaceLight: 'rgba(192, 192, 192, 0.05)',
        surfaceBorder: 'rgba(192, 192, 192, 0.1)',
        text: '#f0f0f0',
        textSecondary: '#c0c0c0',
        textMuted: 'rgba(255, 255, 255, 0.45)',
        border: 'rgba(192, 192, 192, 0.15)',
        shadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
        shadowHover: '0 16px 48px rgba(192, 192, 192, 0.1)',
        gradient: 'linear-gradient(160deg, #0a0a0a 0%, #111111 50%, #0d0d0d 100%)',
        cardGradient: 'linear-gradient(145deg, rgba(20,20,20,0.95), rgba(14,14,14,0.9))',
        buttonGradient: 'linear-gradient(135deg, #888888 0%, #c0c0c0 100%)',
      },
      light: {
        primary: '#ffffff',
        secondary: '#f5f5f5',
        tertiary: '#ebebeb',
        accent: '#555555',
        accentLight: '#777777',
        accentDark: '#333333',
        surface: 'rgba(245, 245, 245, 0.92)',
        surfaceLight: 'rgba(0, 0, 0, 0.03)',
        surfaceBorder: 'rgba(0, 0, 0, 0.08)',
        text: '#111111',
        textSecondary: '#444444',
        textMuted: 'rgba(0, 0, 0, 0.45)',
        border: 'rgba(0, 0, 0, 0.12)',
        shadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        shadowHover: '0 16px 48px rgba(0, 0, 0, 0.12)',
        gradient: 'linear-gradient(160deg, #f5f5f5 0%, #ebebeb 50%, #f0f0f0 100%)',
        cardGradient: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(245,245,245,0.9))',
        buttonGradient: 'linear-gradient(135deg, #555555 0%, #888888 100%)',
      }
    },
    get current() {
      return this.colors[this.isDark ? 'dark' : 'light'];
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};