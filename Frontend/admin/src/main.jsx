import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './adminPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
