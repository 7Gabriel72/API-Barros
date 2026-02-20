import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { NeonAuthUIProvider } from '@neondatabase/neon-js/auth/react/ui'
import '@neondatabase/neon-js/ui/css'
import './index.css'
import App from './App.tsx'
import { authClient } from './lib/auth'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NeonAuthUIProvider authClient={authClient}>
      <App />
    </NeonAuthUIProvider>
  </StrictMode>,
)
