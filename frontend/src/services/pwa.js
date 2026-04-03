import { Workbox } from 'workbox-window'

let wb

export const registerSW = async () => {
  if ('serviceWorker' in navigator) {
    try {
      wb = new Workbox('/sw.js')

      wb.addEventListener('controlling', () => {
        window.location.reload()
      })

      wb.addEventListener('waiting', () => {
        // Show update notification
        if (confirm('New version available! Reload to update?')) {
          wb.messageSkipWaiting()
        }
      })

      await wb.register()
      console.log('✅ Service Worker registered successfully')
    } catch (error) {
      console.warn('⚠️ Service Worker registration warning (offline features disabled):', error.message)
      // PWA is optional - app works fine without it
    }
  } else {
    console.log('ℹ️ Service Workers not supported in this browser')
  }
}

export const unregisterSW = async () => {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      for (let registration of registrations) {
        await registration.unregister()
      }
    }
  } catch (error) {
    console.warn('Failed to unregister service worker:', error)
  }
}

export const checkForUpdates = async () => {
  if (wb) {
    try {
      await wb.update()
      return true
    } catch (error) {
      console.debug('Failed to check for updates:', error)
      return false
    }
  }
  return false
}
