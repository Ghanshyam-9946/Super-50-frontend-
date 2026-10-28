// Indian time, 12-hour clock, everywhere. First import, so the defaults
// are in place before any other module body runs.
import './utils/istTime'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './landing.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
