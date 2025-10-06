import { AuthContext } from '@auth/context/AuthContext'
import { useContext } from 'react'

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context)
    throw new Error('ClientSideError :: useAuth must be used within AuthContextProvider')

  return context
}
