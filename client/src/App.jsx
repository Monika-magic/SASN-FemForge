import { Routes, Route } from 'react-router-dom'
import Setup from './pages/Setup'
import Home from './pages/Home'
import Track from './pages/Track'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Setup />} />
      <Route path="/home" element={<Home />} />
      <Route path="/track/:sessionId" element={<Track />} />
    </Routes>
  )
}
