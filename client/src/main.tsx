import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthRoot } from './components/AuthRoot.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthRoot>{(account) => <App key={account?.id ?? "local"} accountId={account?.id} accountEmail={account?.email} onSignOut={account?.signOut} />}</AuthRoot>
  </StrictMode>,
)
