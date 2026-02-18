import '../styles/globals.css'
import { useEffect } from 'react'
import { syncBookingsFromGitHub } from '../lib/syncService'

export default function App({ Component, pageProps }) {
  // Auto sync ทุกครั้งที่เข้าเว็บ/รีเฟรช
  useEffect(() => {
    syncBookingsFromGitHub()
      .then(result => {
        if (result.success) {
          console.log('✅ Auto sync:', result.message)
        } else {
          console.warn('⚠️ Auto sync:', result.message)
        }
      })
      .catch(err => console.error('❌ Auto sync error:', err))
  }, [])

  return <Component {...pageProps} />
}
