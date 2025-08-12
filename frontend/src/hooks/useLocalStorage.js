import { useState, useEffect, useCallback } from 'react'

/**
 * Custom hook for managing localStorage with React state
 * @param {string} key - The localStorage key
 * @param {*} initialValue - Initial value if key doesn't exist
 * @returns {[value, setValue, removeValue]} - Array with current value, setter, and remover
 */
export const useLocalStorage = (key, initialValue) => {
  // Get initial value from localStorage or use provided initial value
  const [storedValue, setStoredValue] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(key)
        return item ? JSON.parse(item) : initialValue
      }
      return initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback((value) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value
      
      // Save state
      setStoredValue(valueToStore)
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  // Function to remove the value from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error)
    }
  }, [key, initialValue])

  // Listen for changes to this localStorage key from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue))
        } catch (error) {
          console.error(`Error parsing localStorage value for key "${key}":`, error)
        }
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange)
      return () => window.removeEventListener('storage', handleStorageChange)
    }
  }, [key])

  return [storedValue, setValue, removeValue]
}

/**
 * Hook for managing user preferences in localStorage
 * @param {string} userId - User ID to scope preferences
 * @param {object} defaultPreferences - Default preferences object
 * @returns {[preferences, updatePreferences, resetPreferences]}
 */
export const useUserPreferences = (userId, defaultPreferences = {}) => {
  const key = userId ? `user_preferences_${userId}` : 'user_preferences'
  const [preferences, setPreferences, removePreferences] = useLocalStorage(key, defaultPreferences)

  const updatePreferences = useCallback((updates) => {
    setPreferences(prev => ({ ...prev, ...updates }))
  }, [setPreferences])

  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences)
  }, [setPreferences, defaultPreferences])

  return [preferences, updatePreferences, resetPreferences]
}

/**
 * Hook for managing theme preference
 * @param {string} defaultTheme - Default theme ('light', 'dark', 'system')
 * @returns {[theme, setTheme, toggleTheme]}
 */
export const useTheme = (defaultTheme = 'light') => {
  const [theme, setTheme] = useLocalStorage('theme', defaultTheme)

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => {
      switch (prevTheme) {
        case 'light': return 'dark'
        case 'dark': return 'system'
        case 'system': return 'light'
        default: return 'light'
      }
    })
  }, [setTheme])

  return [theme, setTheme, toggleTheme]
}

/**
 * Hook for managing recent items (with size limit)
 * @param {string} key - localStorage key
 * @param {number} maxItems - Maximum number of items to keep
 * @returns {[items, addItem, removeItem, clearItems]}
 */
export const useRecentItems = (key, maxItems = 10) => {
  const [items, setItems] = useLocalStorage(key, [])

  const addItem = useCallback((item) => {
    setItems(prevItems => {
      // Remove if already exists
      const filtered = prevItems.filter(existing => 
        JSON.stringify(existing) !== JSON.stringify(item)
      )
      
      // Add to beginning and limit size
      const newItems = [item, ...filtered].slice(0, maxItems)
      return newItems
    })
  }, [setItems, maxItems])

  const removeItem = useCallback((itemToRemove) => {
    setItems(prevItems => 
      prevItems.filter(item => 
        JSON.stringify(item) !== JSON.stringify(itemToRemove)
      )
    )
  }, [setItems])

  const clearItems = useCallback(() => {
    setItems([])
  }, [setItems])

  return [items, addItem, removeItem, clearItems]
}

/**
 * Hook for managing form drafts
 * @param {string} formId - Unique form identifier
 * @param {object} initialData - Initial form data
 * @returns {[draft, saveDraft, clearDraft, hasDraft]}
 */
export const useFormDraft = (formId, initialData = {}) => {
  const key = `form_draft_${formId}`
  const [draft, setDraft, removeDraft] = useLocalStorage(key, null)

  const saveDraft = useCallback((formData) => {
    const draftData = {
      data: formData,
      timestamp: new Date().toISOString(),
      formId
    }
    setDraft(draftData)
  }, [setDraft, formId])

  const clearDraft = useCallback(() => {
    removeDraft()
  }, [removeDraft])

  const hasDraft = draft && draft.formId === formId

  return [
    hasDraft ? draft.data : initialData,
    saveDraft,
    clearDraft,
    hasDraft
  ]
}

/**
 * Hook for managing search history
 * @param {string} key - localStorage key for search history
 * @param {number} maxHistory - Maximum number of search terms to keep
 * @returns {[history, addSearch, removeSearch, clearHistory]}
 */
export const useSearchHistory = (key = 'search_history', maxHistory = 20) => {
  const [history, setHistory] = useLocalStorage(key, [])

  const addSearch = useCallback((searchTerm) => {
    if (!searchTerm || searchTerm.trim().length === 0) return
    
    const trimmedTerm = searchTerm.trim()
    setHistory(prevHistory => {
      // Remove if already exists
      const filtered = prevHistory.filter(term => 
        term.toLowerCase() !== trimmedTerm.toLowerCase()
      )
      
      // Add to beginning and limit size
      return [trimmedTerm, ...filtered].slice(0, maxHistory)
    })
  }, [setHistory, maxHistory])

  const removeSearch = useCallback((searchTerm) => {
    setHistory(prevHistory => 
      prevHistory.filter(term => 
        term.toLowerCase() !== searchTerm.toLowerCase()
      )
    )
  }, [setHistory])

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [setHistory])

  return [history, addSearch, removeSearch, clearHistory]
}

/**
 * Hook for managing application state with localStorage persistence
 * @param {string} key - localStorage key
 * @param {object} initialState - Initial state object
 * @returns {[state, updateState, resetState]}
 */
export const usePersistedState = (key, initialState = {}) => {
  const [state, setState] = useLocalStorage(key, initialState)

  const updateState = useCallback((updates) => {
    if (typeof updates === 'function') {
      setState(updates)
    } else {
      setState(prevState => ({ ...prevState, ...updates }))
    }
  }, [setState])

  const resetState = useCallback(() => {
    setState(initialState)
  }, [setState, initialState])

  return [state, updateState, resetState]
}

/**
 * Hook for managing cached data with expiration
 * @param {string} key - localStorage key
 * @param {number} ttl - Time to live in milliseconds
 * @returns {[data, setData, clearData, isExpired]}
 */
export const useCachedData = (key, ttl = 5 * 60 * 1000) => { // 5 minutes default
  const [cachedItem, setCachedItem, removeCachedItem] = useLocalStorage(key, null)

  const isExpired = useCallback(() => {
    if (!cachedItem || !cachedItem.timestamp) return true
    const now = new Date().getTime()
    return now - cachedItem.timestamp > ttl
  }, [cachedItem, ttl])

  const setData = useCallback((data) => {
    const item = {
      data,
      timestamp: new Date().getTime()
    }
    setCachedItem(item)
  }, [setCachedItem])

  const clearData = useCallback(() => {
    removeCachedItem()
  }, [removeCachedItem])

  const getData = () => {
    if (isExpired()) {
      clearData()
      return null
    }
    return cachedItem?.data || null
  }

  return [getData(), setData, clearData, isExpired()]
}

/**
 * Hook for managing view preferences (pagination, filters, etc.)
 * @param {string} viewId - Unique view identifier
 * @param {object} defaultPreferences - Default view preferences
 * @returns {[preferences, updatePreferences, resetPreferences]}
 */
export const useViewPreferences = (viewId, defaultPreferences = {}) => {
  const key = `view_preferences_${viewId}`
  const [preferences, setPreferences] = useLocalStorage(key, defaultPreferences)

  const updatePreferences = useCallback((updates) => {
    setPreferences(prev => ({ ...prev, ...updates }))
  }, [setPreferences])

  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences)
  }, [setPreferences, defaultPreferences])

  return [preferences, updatePreferences, resetPreferences]
}

/**
 * Hook for managing last activity timestamp
 * @returns {[lastActivity, updateActivity]}
 */
export const useLastActivity = () => {
  const [lastActivity, setLastActivity] = useLocalStorage('last_activity', null)

  const updateActivity = useCallback(() => {
    setLastActivity(new Date().toISOString())
  }, [setLastActivity])

  // Auto-update activity on mount and focus
  useEffect(() => {
    updateActivity()
    
    const handleFocus = () => updateActivity()
    const handleClick = () => updateActivity()
    const handleKeyPress = () => updateActivity()

    window.addEventListener('focus', handleFocus)
    window.addEventListener('click', handleClick)
    window.addEventListener('keypress', handleKeyPress)

    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('click', handleClick)
      window.removeEventListener('keypress', handleKeyPress)
    }
  }, [updateActivity])

  return [lastActivity, updateActivity]
}

export default useLocalStorage