// The Appraisal portal (appraisal.sistec.ac.in): a separate site built from
// this repo that shows only the appraisal pages and signs people in with
// their MILE accounts, against the same MILE API.
import '../src/utils/istTime'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './portal.css'
import PortalApp from './PortalApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PortalApp />
  </StrictMode>,
)
