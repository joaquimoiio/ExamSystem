import React, { createContext, useContext, useReducer, useEffect } from 'react';

const AppContext = createContext();

const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_OFFLINE':
      return { ...state, offline: action.payload };
    case 'SET_CURRENT_EXAM':
      return { ...state, currentExam: action.payload };
    case 'SET_EXAM_ANSWERS':
      return { 
        ...state, 
        examAnswers: { ...state.examAnswers, ...action.payload } 
      };
    case 'CLEAR_EXAM_ANSWERS':
      return { ...state, examAnswers: {} };
    case 'SET_EXAM_CONFIG':
      return { ...state, examConfig: action.payload };
    case 'SET_SIDEBAR_OPEN':
      return { ...state, sidebarOpen: action.payload };
    case 'SET_MOBILE_MENU_OPEN':
      return { ...state, mobileMenuOpen: action.payload };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_PREFERENCES':
      return { 
        ...state, 
        preferences: { ...state.preferences, ...action.payload } 
      };
    case 'SET_QUESTION_FILTERS':
      return { 
        ...state, 
        questionFilters: { ...state.questionFilters, ...action.payload } 
      };
    case 'SET_EXAM_FILTERS':
      return { 
        ...state, 
        examFilters: { ...state.examFilters, ...action.payload } 
      };
    case 'ADD_RECENT_ACTIVITY':
      return {
        ...state,
        recentActivity: [action.payload, ...state.recentActivity.slice(0, 9)]
      };
    case 'SET_CACHE_DATA':
      return {
        ...state,
        cache: { ...state.cache, [action.payload.key]: action.payload.data }
      };
    case 'CLEAR_CACHE':
      return { ...state, cache: {} };
    default:
      return state;
  }
};

const initialState = {
  loading: false,
  offline: false,
  currentExam: null,
  examAnswers: {},
  examConfig: null,
  sidebarOpen: true,
  mobileMenuOpen: false,
  theme: 'light',
  preferences: {
    autoSave: true,
    notifications: true,
    soundEnabled: true,
    animationsEnabled: true,
    compactMode: false,
  },
  questionFilters: {
    difficulty: 'all',
    subject: 'all',
    tags: [],
    search: '',
  },
  examFilters: {
    status: 'all',
    subject: 'all',
    dateRange: 'all',
    search: '',
  },
  recentActivity: [],
  cache: {},
};

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Network status detection
  useEffect(() => {
    const handleOnline = () => dispatch({ type: 'SET_OFFLINE', payload: false });
    const handleOffline = () => dispatch({ type: 'SET_OFFLINE', payload: true });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    dispatch({ type: 'SET_OFFLINE', payload: !navigator.onLine });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load preferences from localStorage
  useEffect(() => {
    const savedPreferences = localStorage.getItem('appPreferences');
    if (savedPreferences) {
      try {
        const preferences = JSON.parse(savedPreferences);
        dispatch({ type: 'SET_PREFERENCES', payload: preferences });
      } catch (error) {
        console.error('Failed to load preferences:', error);
      }
    }

    const savedTheme = localStorage.getItem('appTheme');
    if (savedTheme) {
      dispatch({ type: 'SET_THEME', payload: savedTheme });
    }
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('appPreferences', JSON.stringify(state.preferences));
  }, [state.preferences]);

  useEffect(() => {
    localStorage.setItem('appTheme', state.theme);
    document.documentElement.classList.toggle('dark', state.theme === 'dark');
  }, [state.theme]);

  // Auto-save exam answers
  useEffect(() => {
    if (state.preferences.autoSave && state.currentExam && Object.keys(state.examAnswers).length > 0) {
      const saveKey = `exam_answers_${state.currentExam.id}`;
      localStorage.setItem(saveKey, JSON.stringify(state.examAnswers));
    }
  }, [state.examAnswers, state.currentExam, state.preferences.autoSave]);

  // Action creators
  const setLoading = (loading) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setCurrentExam = (exam) => {
    dispatch({ type: 'SET_CURRENT_EXAM', payload: exam });
    
    // Load saved answers if auto-save is enabled
    if (exam && state.preferences.autoSave) {
      const saveKey = `exam_answers_${exam.id}`;
      const savedAnswers = localStorage.getItem(saveKey);
      if (savedAnswers) {
        try {
          const answers = JSON.parse(savedAnswers);
          dispatch({ type: 'SET_EXAM_ANSWERS', payload: answers });
        } catch (error) {
          console.error('Failed to load saved answers:', error);
        }
      }
    }
  };

  const setExamAnswers = (answers) => {
    dispatch({ type: 'SET_EXAM_ANSWERS', payload: answers });
  };

  const clearExamAnswers = () => {
    dispatch({ type: 'CLEAR_EXAM_ANSWERS' });
    if (state.currentExam) {
      const saveKey = `exam_answers_${state.currentExam.id}`;
      localStorage.removeItem(saveKey);
    }
  };

  const setExamConfig = (config) => {
    dispatch({ type: 'SET_EXAM_CONFIG', payload: config });
  };

  const toggleSidebar = () => {
    dispatch({ type: 'SET_SIDEBAR_OPEN', payload: !state.sidebarOpen });
  };

  const toggleMobileMenu = () => {
    dispatch({ type: 'SET_MOBILE_MENU_OPEN', payload: !state.mobileMenuOpen });
  };

  const setTheme = (theme) => {
    dispatch({ type: 'SET_THEME', payload: theme });
  };

  const updatePreferences = (preferences) => {
    dispatch({ type: 'SET_PREFERENCES', payload: preferences });
  };

  const setQuestionFilters = (filters) => {
    dispatch({ type: 'SET_QUESTION_FILTERS', payload: filters });
  };

  const setExamFilters = (filters) => {
    dispatch({ type: 'SET_EXAM_FILTERS', payload: filters });
  };

  const addRecentActivity = (activity) => {
    const activityWithTimestamp = {
      ...activity,
      timestamp: new Date().toISOString(),
      id: Date.now() + Math.random(),
    };
    dispatch({ type: 'ADD_RECENT_ACTIVITY', payload: activityWithTimestamp });
  };

  const setCacheData = (key, data) => {
    dispatch({ type: 'SET_CACHE_DATA', payload: { key, data } });
  };

  const getCacheData = (key) => {
    return state.cache[key];
  };

  const clearCache = () => {
    dispatch({ type: 'CLEAR_CACHE' });
  };

  const contextValue = {
    ...state,
    setLoading,
    setCurrentExam,
    setExamAnswers,
    clearExamAnswers,
    setExamConfig,
    toggleSidebar,
    toggleMobileMenu,
    setTheme,
    updatePreferences,
    setQuestionFilters,
    setExamFilters,
    addRecentActivity,
    setCacheData,
    getCacheData,
    clearCache,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppContext;