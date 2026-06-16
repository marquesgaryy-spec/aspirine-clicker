import { useState } from 'react'
import LoginScreen from './ui/LoginScreen'
import GameCanvas from './ui/GameCanvas'

export default function App() {
  const [pseudo, setPseudo] = useState<string | null>(() => {
    return localStorage.getItem('garyworld_pseudo')
  })

  const handleEnter = (p: string) => {
    localStorage.setItem('garyworld_pseudo', p)
    setPseudo(p)
  }

  if (!pseudo) return <LoginScreen onEnter={handleEnter} />
  return <GameCanvas pseudo={pseudo} />
}
