import { useContext } from 'react'
import { NavigationContext } from './navigationContextDef'

export const useNavigation = () => useContext(NavigationContext)
