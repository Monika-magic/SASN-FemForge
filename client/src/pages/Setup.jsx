import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function Setup() {
  const navigate = useNavigate()
  const [screen, setScreen] = useState('location') // location | form
  const [locationStatus, setLocationStatus] = useState('asking') // asking | granted | denied
  const [coords, setCoords] = useState(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [contacts, setContacts] = useState([{ name: '', phone: '' }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // One-time login
    const userId = localStorage.getItem('userId')
    if (userId) { navigate('/home'); return }
    requestLocation()
  }, [])

  const requestLocation = () => {
    setLocationStatus('asking')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
        setLocationStatus('granted')
      },
      () => setLocationStatus('denied'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const proceedToForm = () => setScreen('form')

  const addContact = () => {
    if (contacts.length < 3) setContacts([...contacts, { name: '', phone: '' }])
  }

  const updateContact = (i, field, value) => {
    const updated = [...contacts]
    updated[i][field] = value
    setContacts(updated)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const validContacts = contacts.filter(c => c.name && c.phone)
    if (!validContacts.length) return setError('Add at least one emergency contact')
    setLoading(true)
    try {
      const { data } = await axios.post(`${API}/api/user/register`, { name, phone })
      await axios.post(`${API}/api/user/${data.userId}/contacts`, { contacts: validContacts })
      localStorage.setItem('userId', data.userId)
      localStorage.setItem('userName', name)
      localStorage.setItem('userPhone', phone)
      localStorage.setItem('contacts', JSON.stringify(validContacts))
      if (coords) localStorage.setItem('lastLocation', JSON.stringify(coords))
      navigate('/home')
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    }
    setLoading(false)
  }

  // --- LOCATION PERMISSION SCREEN ---
  if (screen === 'location') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.logo}>🛡️</div>
          <h1 style={styles.title}>SASN</h1>
          <p style={styles.subtitle}>Smart Adaptive Safety Network</p>

          <div style={styles.locationBox}>
            {locationStatus === 'asking' && (
              <>
                <div style={styles.locationIcon}>📍</div>
                <p style={styles.locationTitle}>Enable Live Location</p>
                <p style={styles.locationDesc}>
                  SASN needs your real-time GPS location to send accurate emergency alerts to your contacts.
                </p>
                <div style={styles.spinner} />
                <p style={styles.locationHint}>Waiting for location permission...</p>
              </>
            )}

            {locationStatus === 'granted' && (
              <>
                <div style={styles.locationIcon}>✅</div>
                <p style={styles.locationTitle}>Location Access Granted</p>
                <p style={styles.locationDesc}>
                  Your GPS is active and accurate.
                </p>
                {coords && (
                  <div style={styles.coordsBadge}>
                    📍 {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
                  </div>
                )}
                <button style={styles.proceedBtn} onClick={proceedToForm}>
                  Continue to Setup →
                </button>
              </>
            )}

            {locationStatus === 'denied' && (
              <>
                <div style={styles.locationIcon}>❌</div>
                <p style={styles.locationTitle}>Location Access Denied</p>
                <p style={styles.locationDesc}>
                  Without location access, SOS alerts won't include your position. Please enable location in your browser settings.
                </p>
                <div style={styles.steps}>
                  <p style={styles.stepText}>1. Click the 🔒 lock icon in your browser address bar</p>
                  <p style={styles.stepText}>2. Set Location → Allow</p>
                  <p style={styles.stepText}>3. Refresh the page</p>
                </div>
                <button style={styles.retryBtn} onClick={requestLocation}>
                  🔄 Retry Location
                </button>
                <button style={styles.skipBtn} onClick={proceedToForm}>
                  Continue without location (not recommended)
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // --- REGISTRATION FORM SCREEN ---
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>🛡️</div>
        <h1 style={styles.title}>SASN</h1>
        <p style={styles.subtitle}>Smart Adaptive Safety Network</p>

        {locationStatus === 'granted' && coords && (
          <div style={styles.locationGranted}>
            ✅ GPS Active — {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Your Name</label>
          <input style={styles.input} value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" required />

          <label style={styles.label}>Your Phone Number</label>
          <input style={styles.input} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91XXXXXXXXXX" required />

          <div style={styles.sectionHeader}>
            <label style={styles.label}>Emergency Contacts</label>
            {contacts.length < 3 && (
              <button type="button" onClick={addContact} style={styles.addBtn}>+ Add</button>
            )}
          </div>

          {contacts.map((c, i) => (
            <div key={i} style={styles.contactRow}>
              <input
                style={{ ...styles.input, flex: 1, marginRight: 8 }}
                placeholder="Contact name"
                value={c.name}
                onChange={e => updateContact(i, 'name', e.target.value)}
              />
              <input
                style={{ ...styles.input, flex: 1 }}
                placeholder="+91XXXXXXXXXX"
                value={c.phone}
                onChange={e => updateContact(i, 'phone', e.target.value)}
              />
            </div>
          ))}

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? 'Setting up...' : 'Get Started →'}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: { background: '#1a1a2e', borderRadius: 16, padding: 32, width: '100%', maxWidth: 420, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' },
  logo: { fontSize: 48, textAlign: 'center', marginBottom: 8 },
  title: { color: '#fff', textAlign: 'center', fontSize: 28, fontWeight: 700, margin: 0 },
  subtitle: { color: '#888', textAlign: 'center', marginBottom: 20, fontSize: 14 },

  locationBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', gap: 12 },
  locationIcon: { fontSize: 56 },
  locationTitle: { color: '#fff', fontSize: 18, fontWeight: 700, margin: 0, textAlign: 'center' },
  locationDesc: { color: '#888', fontSize: 13, textAlign: 'center', lineHeight: 1.6, margin: 0 },
  coordsBadge: { background: '#0d1f0d', border: '1px solid #166534', borderRadius: 8, padding: '6px 14px', fontSize: 12, color: '#4ade80' },
  spinner: { width: 32, height: 32, border: '3px solid #333', borderTop: '3px solid #7c3aed', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  locationHint: { color: '#555', fontSize: 12, margin: 0 },
  steps: { background: '#0f0f1a', borderRadius: 8, padding: 12, width: '100%' },
  stepText: { color: '#888', fontSize: 12, margin: '4px 0' },
  proceedBtn: { width: '100%', padding: '13px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  retryBtn: { width: '100%', padding: '11px', background: '#1e3a5f', color: '#93c5fd', border: '1px solid #1e40af', borderRadius: 10, fontSize: 14, cursor: 'pointer' },
  skipBtn: { background: 'transparent', border: 'none', color: '#555', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' },

  locationGranted: { background: '#0d1f0d', border: '1px solid #166534', borderRadius: 8, padding: '7px 12px', fontSize: 12, color: '#4ade80', marginBottom: 12, textAlign: 'center' },
  label: { color: '#ccc', fontSize: 13, display: 'block', marginBottom: 4, marginTop: 12 },
  input: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #333', background: '#0f0f1a', color: '#fff', fontSize: 14, boxSizing: 'border-box', outline: 'none' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  addBtn: { background: 'transparent', border: '1px solid #7c3aed', color: '#7c3aed', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 13 },
  contactRow: { display: 'flex', gap: 8, marginBottom: 8 },
  error: { color: '#f87171', fontSize: 13, marginTop: 8 },
  submitBtn: { width: '100%', padding: '14px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: 'pointer', marginTop: 20 },
}
