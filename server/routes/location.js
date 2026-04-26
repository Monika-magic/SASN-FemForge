const express = require('express');
const router = express.Router();
const { db } = require('../firebase');

// POST /api/location/update
// Updates live location during active SOS
router.post('/update', async (req, res) => {
  const { sessionId, latitude, longitude } = req.body;
  if (!sessionId || !latitude || !longitude) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  try {
    await db.collection('sos_sessions').doc(sessionId).update({
      latitude,
      longitude,
      lastUpdated: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/location/:sessionId
// Returns current location for a session (used by tracking page)
router.get('/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  try {
    const doc = await db.collection('sos_sessions').doc(sessionId).get();
    if (!doc.exists) return res.status(404).json({ error: 'Session not found' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
