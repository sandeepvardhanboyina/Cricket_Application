import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '@/types';
import { clearAuthStorage } from '@/lib/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

const getInitialState = (): AuthState => {
  if (typeof window === 'undefined') return { user: null, isAuthenticated: false };
  const stored = localStorage.getItem('user');
  if (stored) {
    const user = JSON.parse(stored);
    return { user, isAuthenticated: true };
  }
  return { user: null, isAuthenticated: false };
};

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialState(),
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(action.payload));
        if (action.payload.token) localStorage.setItem('token', action.payload.token);
        if (action.payload.role) localStorage.setItem('role', action.payload.role);
        if (action.payload.role === 'admin') localStorage.setItem('admin', 'true');
      }
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      clearAuthStorage();
    },
  },
});

export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;
