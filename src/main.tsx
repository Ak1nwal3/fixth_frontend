import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from '@/App'
import '@/styles/index.css'

// Show focus rings only after keyboard navigation; a click or tap hides them.
const root = document.documentElement
window.addEventListener('keydown', event => {
  if (event.key === 'Tab') root.setAttribute('data-keyboard', '')
}, true)
window.addEventListener('pointerdown', () => root.removeAttribute('data-keyboard'), true)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
