import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function Track() {
  const { sessionId } = useParams()
  const [session, setSession] = useState(null)
  const [error, setError] = useState('')

  const fetchLocation = async () => {
    try {
      const { data } = await axios.get(`${API}/api/location/${sessionId}`)
      setSession(data)
    } catch {
      setError('Session not found or expired.')
    }
  }

  useEffect(() => {
    fetchLocation()
    const interval = setInterval(fetchLocation, 15000) // refresh every 15s
    return () => clearInterval(interval)
  }, [sessionId])

  if (error) return (
    <div style={styles.container}>
      <p style={{ color: '#f87171', textAlign: 'center' }}>{error}</p>
    </div>
  )

  if (!session) return (
    <div style={styles.container}>
      <p style={{ color: '#aaa', textAlign: 'center' }}>Loading location...</p>
    </div>
  )

  const mapsUrl = `https://maps.google.com/?q=${session.latitude},${session.longitude}`
  const embedUrl = `https://maps.google.com/maps?q=${session.latitude},${session.longitude}&z=16&output=embed`

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.logo}>🛡️ SASN</span>
        <span style={{ ...styles.badge, background: session.active ? '#7f1d1d' : '#14532d', color: session.active ? '#fca5a5' : '#86efac' }}>
          {session.active ? '🚨 SOS ACTIVE' : '✅ Resolved'}
        </span>
      </div>

      <div style={styles.infoCard}>
        <p style={styles.name}>{session.userName}</p>
        <p style={styles.time}>Last updated: {session.lastUpdated ? new Date(session.lastUpdated).toLocaleTimeString() : new Date(session.triggeredAt).toLocaleTimeString()}</p>
        <p style={styles.coords}>📍 {session.latitude?.toFixed(5)}, {session.longitude?.toFixed(5)}</p>
        <a href={mapsUrl} target="_blank" rel="noreferrer" style={styles.openMaps}>
          Open in Google Maps →
        </a>
      </div>

      <iframe
        title="Live Location"
        src={embedUrl}
        style={styles.map}
        allowFullScreen
        loading="lazy"
      />

      {session.active && (
        <p style={styles.liveNote}>🔄 Location auto-refreshes every 15 seconds</p>
      )}
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: '#0f0f1a', color: '#fff', padding: 16, display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  logo: { fontSize: 18, fontWeight: 700, color: '#7c3aed' },
  badge: { borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 600 },
  infoCard: { background: '#1a1a2e', borderRadius: 12, padding: 16, marginBottom: 16 },
  name: { fontSize: 20, fontWeight: 700, margin: '0 0 4px' },
  time: { color: '#888', fontSize: 12, margin: '0 0 8px' },
  coords: { color: '#a78bfa', fontSize: 13, margin: '0 0 12px' },
  openMaps: { color: '#7c3aed', fontSize: 14, textDecoration: 'underline' },
  map: { width: '100%', flex: 1, minHeight: 400, borderRadius: 12, border: 'none' },
  liveNote: { color: '#555', fontSize: 12, textAlign: 'center', marginTop: 8 },
}
