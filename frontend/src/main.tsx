import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App'
import '@/index.css'
import '@/lib/i18n' // Import i18n configuration

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center font-bold text-[#0A1628]">Loading...</div>}>
      <App />
    </Suspense>
  </React.StrictMode>,
)