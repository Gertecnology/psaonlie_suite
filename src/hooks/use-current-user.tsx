import { useState, useEffect } from 'react'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  urlPerfil: string | null
  roles: string[]
}

export function useCurrentUser(): User | null {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user')
      if (stored) {
        setUser(JSON.parse(stored))
      }
    } catch {
      setUser(null)
    }
  }, [])

  return user
}