import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ThemeState {
  darkMode: boolean;
}

const getInitialTheme = (): ThemeState => {
  if (typeof window === 'undefined') return { darkMode: false };
  const stored = localStorage.getItem('darkMode');
  const darkMode = stored ? JSON.parse(stored) : false;
  if (darkMode) document.documentElement.classList.add('dark');
  return { darkMode };
};

const themeSlice = createSlice({
  name: 'theme',
  initialState: getInitialTheme(),
  reducers: {
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      if (typeof window !== 'undefined') {
        localStorage.setItem('darkMode', JSON.stringify(state.darkMode));
        if (state.darkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    },
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.darkMode = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('darkMode', JSON.stringify(state.darkMode));
        if (state.darkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    },
  },
});

export const { toggleDarkMode, setDarkMode } = themeSlice.actions;
export default themeSlice.reducer;
