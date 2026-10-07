import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import '@/styles/index.css'
import { initMonitoring } from '@/shared/lib/monitoring'

import { registerSW } from 'virtual:pwa-register'

initMonitoring()

const root = document.getElementById('root');
if (!root) throw new Error('Missing root element');

if (import.meta.env.PROD) {
  registerSW({ immediate: true })
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

