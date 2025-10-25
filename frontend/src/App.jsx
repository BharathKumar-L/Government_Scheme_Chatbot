import React, { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

// Components
import Header from './components/Header'
import ChatPage from './pages/ChatPage'
import SchemesPage from './pages/SchemesPage'
import AboutPage from './pages/AboutPage'
import LoadingSpinner from './components/LoadingSpinner'

// Services
import { registerSW } from './services/pwa'

function App() {
  const { i18n } = useTranslation()
  const [isLoading, setIsLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    // Initialize app
    const initializeApp = async () => {
      try {
        // Register service worker for PWA
        await registerSW()
        
        // Set initial language based on browser preference
        const savedLanguage = localStorage.getItem('ruralconnect-language')
        if (savedLanguage) {
          await i18n.changeLanguage(savedLanguage)
        }
        
        // Listen for online/offline status
        const handleOnline = () => setIsOnline(true)
        const handleOffline = () => setIsOnline(false)
        
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)
        
        setIsLoading(false)
        
        return () => {
          window.removeEventListener('online', handleOnline)
          window.removeEventListener('offline', handleOffline)
        }
      } catch (error) {
        console.error('Failed to initialize app:', error)
        setIsLoading(false)
      }
    }

    initializeApp()
  }, [i18n])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Offline indicator */}
      {!isOnline && (
        <div className="bg-yellow-500 text-white text-center py-2 text-sm">
          📡 You're offline. Some features may be limited.
        </div>
      )}
      
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<ChatPage />} />
          <Route path="/schemes" element={<SchemesPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </main>
      
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'hsl(var(--card))',
            color: 'hsl(var(--card-foreground))',
            border: '1px solid hsl(var(--border))',
          },
        }}
      />
    </div>
  )
}

export default App
