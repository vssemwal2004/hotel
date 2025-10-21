import React, { createContext, useState, useContext } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }){
  const [theme, setTheme] = useState('light')
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
  )
}

export function useTheme(){
  return useContext(ThemeContext)
}
