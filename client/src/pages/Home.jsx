import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function Home() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('idle') // idle | active | safe
  const [sessionId, setSessionId] = useState(null)
  const [location, setLocation] = useState(null)
  const [pressing, setPressing] = useState(false)
  const [pressProgress, setPressProgress] = useState(0)
  const [activityLog, setActivityLog] = useState([])
  const [contactStatuses, setContactStatuses] = useState([])
  const [locationUpdateCount, setLocationUpdateCount] = useState(0)
  const [sosTime, setSosTime] = useState(null)
  const [elapsed, setElapsed] = useState(0)

  const pressTimer = useRef(null)
  const pressInterval = useRef(null)
  const triggered = useRef(false)
  const locationInterval = useRef(null)
  const elapsedInterval = useRef(null)

  const userName = localStorage.getItem('userName') || 'User'
  const userId = localStorage.getItem('userId')
  const contacts = JSON.parse(localStorage.getItem('contacts') || '[]')

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => addLog('⚠️', 'Location permission denied. Enable GPS for SOS.', 'warn'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
    return () => {
      clearInterval(locationInterval.current)
      clearInterval(elapsedInterval.current)
    }
  }, [])

  const addLog = (icon, text, type = 'info') => {
    const time = new Date().toLocaleTimeString()
    setActivityLog(prev => [{ icon, text, type, time, id: Date.now() }, ...prev])
  }

  const triggerSOS = async () => {
    if (!location) return addLog('❌', 'Location not available. Enable GPS first.', 'error')
    setStatus('active')
    setSosTime(new Date())
    setElapsed(0)

    // Init contact statuses as pending
    setContactStatuses(contacts.map(c => ({ ...c, smsStatus: 'sending' })))
    addLog('🚨', 'SOS triggered — contacting emergency network...', 'alert')
    addLog('📍', `Location captured: ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`, 'info')

    // Start elapsed timer
    elapsedInterval.current = setInterval(() => setElapsed(e => e + 1), 1000)

    try {
      const { data } = await axios.post(`${API}/api/alert/sos`, {
        userId, userName,
        latitude: location.latitude,
        longitude: location.longitude,
        contacts,
      })
      setSessionId(data.sessionId)

      // Mark all contacts as SMS sent
      setContactStatuses(contacts.map(c => ({ ...c, smsStatus: 'sent' })))
      addLog('✅', `SMS alerts sent to ${contacts.length} emergency contact(s)`, 'success')
      addLog('🗺️', `Live tracking link active: /track/${data.sessionId}`, 'info')
      addLog('💬', `Message sent: "🚨 ${userName} needs help! Live location shared."`, 'info')

      // Live location updates every 30s
      locationInterval.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition(pos => {
          const newLoc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
          setLocation(newLoc)
          setLocationUpdateCount(c => c + 1)
          axios.post(`${API}/api/location/update`, { sessionId: data.sessionId, ...newLoc })
          addLog('📡', `Location updated → ${newLoc.latitude.toFixed(5)}, ${newLoc.longitude.toFixed(5)}`, 'info')
        }, null, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 })
      }, 30000)

    } catch (err) {
      setContactStatuses(contacts.map(c => ({ ...c, smsStatus: 'failed' })))
      addLog('❌', err.response?.data?.error || 'Failed to send alerts. Check your connection.', 'error')
      setStatus('idle')
      clearInterval(elapsedInterval.current)
    }
  }

  const cancelSOS = async () => {
    clearInterval(locationInterval.current)
    clearInterval(elapsedInterval.current)
    addLog('🟢', 'Cancelling SOS — notifying contacts you are safe...', 'info')
    try {
      await axios.post(`${API}/api/alert/safe`, { sessionId, userId, userName, contacts })
      addLog('✅', `Safety confirmation SMS sent to ${contacts.length} contact(s)`, 'success')
      addLog('💬', `Message sent: "✅ ${userName} is now safe. Alert cancelled."`, 'info')
      setStatus('safe')
    } catch {
      addLog('❌', 'Could not send safe confirmation. Try again.', 'error')
    }
  }

  const handlePressStart = () => {
    triggered.current = false
    setPressing(true)
    setPressProgress(0)
    pressInterval.current = setInterval(() => {
      setPressProgress(p => Math.min(p + 5, 100))
    }, 100)
    pressTimer.current = setTimeout(() => {
      triggered.current = true
      clearInterval(pressInterval.current)
      setPressing(false)
      setPressProgress(0)
      triggerSOS()
    }, 2000)
  }

  const handlePressEnd = () => {
    if (triggered.current) return // already fired, don't cancel
    clearTimeout(pressTimer.current)
    clearInterval(pressInterval.current)
    setPressing(false)
    setPressProgress(0)
  }

  const formatElapsed = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const logColors = { alert: '#fca5a5', success: '#86efac', error: '#f87171', warn: '#fde68a', info: '#a5b4fc' }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.logo}>🛡️ SASN</span>
        <div style={styles.headerRight}>
          {status === 'active' && (
            <span style={styles.timerBadge}>⏱ {formatElapsed(elapsed)}</span>
          )}
          <span style={styles.userName}>Hi, {userName}</span>
        </div>
      </div>

      {/* Location bar */}
      {location && (
        <div style={styles.locationBadge}>
          📍 GPS Active — {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          {locationUpdateCount > 0 && <span style={styles.updateCount}> · {locationUpdateCount} update{locationUpdateCount > 1 ? 's' : ''}</span>}
        </div>
      )}

      <div style={styles.body}>
        {/* LEFT — SOS Button */}
        <div style={styles.sosSection}>
          {status === 'idle' && (
            <>
              <p style={styles.instruction}>Hold 2 seconds to trigger SOS</p>
              <div style={styles.sosBtnWrap}>
                {pressing && (
                  <svg style={styles.progressRing} viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r="88" fill="none" stroke="#dc2626" strokeWidth="6"
                      strokeDasharray={`${pressProgress * 5.53} 553`}
                      strokeLinecap="round"
                      transform="rotate(-90 100 100)" />
                  </svg>
                )}
                <button
                  style={{ ...styles.sosBtn, background: pressing ? '#b91c1c' : '#dc2626', transform: pressing ? 'scale(0.96)' : 'scale(1)' }}
                  onMouseDown={handlePressStart}
                  onMouseUp={handlePressEnd}
                  onTouchStart={handlePressStart}
                  onTouchEnd={handlePressEnd}
                >
                  {pressing ? `${Math.round(pressProgress)}%` : 'SOS'}
                </button>
              </div>
              <p style={styles.hint}>Sends real SMS + live GPS to your contacts</p>
            </>
          )}

          {status === 'active' && (
            <>
              <div style={styles.pulseRing} />
              <p style={styles.activeLabel}>🚨 SOS ACTIVE</p>
              {sessionId && (
                <a href={`/track/${sessionId}`} target="_blank" rel="noreferrer" style={styles.trackLink}>
                  📡 Open Live Tracking →
                </a>
              )}
              <button style={styles.safeBtn} onClick={cancelSOS}>✅ I'm Safe — Cancel SOS</button>
            </>
          )}

          {status === 'safe' && (
            <>
              <div style={styles.safeIcon}>✅</div>
              <p style={styles.safeText}>You're Safe</p>
              <button style={styles.resetBtn} onClick={() => { setStatus('idle'); setActivityLog([]); setContactStatuses([]) }}>
                Back to Home
              </button>
            </>
          )}

          {/* Contact SMS Status */}
          {contactStatuses.length > 0 && (
            <div style={styles.contactStatusBox}>
              <p style={styles.contactStatusTitle}>Emergency Contacts</p>
              {contactStatuses.map((c, i) => (
                <div key={i} style={styles.contactStatusRow}>
                  <span style={styles.contactName}>{c.name}</span>
                  <span style={styles.contactPhone}>{c.phone}</span>
                  <span style={{
                    ...styles.smsBadge,
                    background: c.smsStatus === 'sent' ? '#14532d' : c.smsStatus === 'failed' ? '#7f1d1d' : '#1e3a5f',
                    color: c.smsStatus === 'sent' ? '#86efac' : c.smsStatus === 'failed' ? '#fca5a5' : '#93c5fd'
                  }}>
                    {c.smsStatus === 'sent' ? '✓ SMS Sent' : c.smsStatus === 'failed' ? '✗ Failed' : '⏳ Sending...'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT — Activity Log */}
        <div style={styles.logSection}>
          <div style={styles.logHeader}>
            <span style={styles.logTitle}>Activity Log</span>
            {activityLog.length > 0 && (
              <span style={styles.logCount}>{activityLog.length} events</span>
            )}
          </div>
          <div style={styles.logBody}>
            {activityLog.length === 0 ? (
              <p style={styles.logEmpty}>Activity will appear here when SOS is triggered</p>
            ) : (
              activityLog.map(log => (
                <div key={log.id} style={styles.logItem}>
                  <span style={styles.logIcon}>{log.icon}</span>
                  <div style={styles.logContent}>
                    <span style={{ ...styles.logText, color: logColors[log.type] || '#a5b4fc' }}>{log.text}</span>
                    <span style={styles.logTime}>{log.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom contacts bar */}
      <div style={styles.contactsBar}>
        <span style={styles.contactsLabel}>Contacts:</span>
        {contacts.map((c, i) => (
          <span key={i} style={styles.contactChip}>{c.name}</span>
        ))}
        <span style={styles.editLink} onClick={() => navigate('/')}>Edit</span>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: '#0f0f1a', color: '#fff', display: 'flex', flexDirection: 'column', padding: 16, fontFamily: '-apple-system, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  logo: { fontSize: 20, fontWeight: 800, color: '#7c3aed', letterSpacing: 1 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
  timerBadge: { background: '#7f1d1d', color: '#fca5a5', borderRadius: 20, padding: '3px 10px', fontSize: 13, fontWeight: 600 },
  userName: { fontSize: 13, color: '#aaa' },
  locationBadge: { background: '#0d1f0d', border: '1px solid #166534', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: '#4ade80', marginBottom: 14 },
  updateCount: { color: '#86efac', fontWeight: 600 },
  body: { flex: 1, display: 'flex', gap: 16, minHeight: 0 },

  // SOS section
  sosSection: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', width: '45%', paddingTop: 16 },
  instruction: { color: '#666', fontSize: 13, marginBottom: 20, textAlign: 'center' },
  sosBtnWrap: { position: 'relative', width: 180, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  progressRing: { position: 'absolute', top: 0, left: 0, width: 180, height: 180 },
  sosBtn: { width: 160, height: 160, borderRadius: '50%', border: 'none', color: '#fff', fontSize: 32, fontWeight: 900, cursor: 'pointer', boxShadow: '0 0 40px rgba(220,38,38,0.5)', transition: 'all 0.1s', zIndex: 1, letterSpacing: 2 },
  hint: { color: '#444', fontSize: 11, textAlign: 'center', maxWidth: 200 },
  pulseRing: { width: 160, height: 160, borderRadius: '50%', background: 'rgba(220,38,38,0.15)', border: '3px solid #dc2626', animation: 'pulse 1.2s infinite', marginBottom: 12 },
  activeLabel: { fontSize: 22, fontWeight: 800, color: '#dc2626', marginBottom: 12 },
  trackLink: { color: '#7c3aed', fontSize: 13, textDecoration: 'underline', marginBottom: 16 },
  safeBtn: { padding: '12px 24px', background: '#14532d', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 8 },
  safeIcon: { fontSize: 56, marginBottom: 8 },
  safeText: { fontSize: 24, fontWeight: 700, color: '#4ade80', marginBottom: 16 },
  resetBtn: { padding: '10px 20px', background: '#1a1a2e', border: '1px solid #333', borderRadius: 10, color: '#fff', cursor: 'pointer', fontSize: 13 },

  // Contact status
  contactStatusBox: { background: '#111827', border: '1px solid #1f2937', borderRadius: 10, padding: 12, marginTop: 16, width: '100%' },
  contactStatusTitle: { color: '#6b7280', fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  contactStatusRow: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' },
  contactName: { color: '#e5e7eb', fontSize: 13, fontWeight: 600, minWidth: 60 },
  contactPhone: { color: '#6b7280', fontSize: 11, flex: 1 },
  smsBadge: { borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600 },

  // Activity log
  logSection: { flex: 1, display: 'flex', flexDirection: 'column', background: '#111827', borderRadius: 12, border: '1px solid #1f2937', overflow: 'hidden' },
  logHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid #1f2937' },
  logTitle: { color: '#9ca3af', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 },
  logCount: { background: '#1f2937', color: '#6b7280', borderRadius: 20, padding: '2px 8px', fontSize: 11 },
  logBody: { flex: 1, overflowY: 'auto', padding: '8px 0' },
  logEmpty: { color: '#374151', fontSize: 12, textAlign: 'center', padding: '32px 16px', lineHeight: 1.6 },
  logItem: { display: 'flex', gap: 10, padding: '7px 14px', borderBottom: '1px solid #1a2030' },
  logIcon: { fontSize: 14, marginTop: 1, flexShrink: 0 },
  logContent: { display: 'flex', flexDirection: 'column', gap: 2 },
  logText: { fontSize: 12, lineHeight: 1.4 },
  logTime: { color: '#374151', fontSize: 10 },

  // Bottom bar
  contactsBar: { background: '#111827', borderRadius: 10, padding: '10px 14px', marginTop: 12, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  contactsLabel: { color: '#6b7280', fontSize: 11 },
  contactChip: { background: '#1f2937', color: '#a78bfa', borderRadius: 20, padding: '3px 10px', fontSize: 11 },
  editLink: { color: '#7c3aed', fontSize: 11, cursor: 'pointer', marginLeft: 'auto', textDecoration: 'underline' },
}
