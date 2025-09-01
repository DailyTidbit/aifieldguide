// src/app/hooks/useLocalStorage.ts - Fixed hydration safety issues
import { useState, useEffect } from 'react'

export function useLocalStorage<T>(key: string, defaultValue: T) {
  // HYDRATION FIX: Always start with defaultValue on both server and client
  const [value, setValue] = useState<T>(defaultValue)
  const [mounted, setMounted] = useState(false)

  // HYDRATION FIX: Only read from localStorage after hydration
  useEffect(() => {
    setMounted(true)
    
    // Only read from localStorage after component mounts
    if (typeof window !== 'undefined') {
      try {
        const item = window.localStorage.getItem(key)
        if (item !== null) {
          const parsedValue = JSON.parse(item)
          setValue(parsedValue)
        }
      } catch (error) {
        console.warn(`Error reading localStorage key "${key}":`, error)
        // Keep the default value if parsing fails
      }
    }
  }, [key])

  // Update localStorage whenever value changes (but only after mount)
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(key, JSON.stringify(value))
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error)
      }
    }
  }, [key, value, mounted])

  return [value, setValue] as const
}