import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import PlaypenApp from './PlaypenApp.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PlaypenApp />
  </StrictMode>,
)
