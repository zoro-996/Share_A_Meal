import { createContext } from 'react'

export type AppRoute = 
  | '/'
  | '/register/volunteer'
  | '/register/donor'
  | '/volunteer/dashboard'
  | '/donor/dashboard'

export interface NavigationContextType {
  currentPath: string
  navigate: (to: string) => void
}

export const NavigationContext = createContext<NavigationContextType>({
  currentPath: '/',
  navigate: () => {},
})
