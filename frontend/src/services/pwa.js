import { Workbox } from 'workbox-window'

let wb

export const registerSW = async () => {
  if ('serviceWorker' in navigator) {
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

    try {
      await wb.register()
      console.log('✅ Service Worker registered successfully')
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error)
    }
  }
}

export const unregisterSW = async () => {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations()
    for (let registration of registrations) {
      await registration.unregister()
    }
  }
}

export const checkForUpdates = async () => {
  if (wb) {
    try {
      await wb.update()
      return true
    } catch (error) {
      console.error('Failed to check for updates:', error)
      return false
    }
  }
  return false
}
