const express = require('express');
const router = express.Router();
const { db } = require('../firebase');

// POST /api/user/register
router.post('/register', async (req, res) => {
  const { name, phone } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'Name and phone required' });
  try {
    const ref = await db.collection('users').add({ name, phone, contacts: [], createdAt: new Date().toISOString() });
    res.json({ success: true, userId: ref.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/user/:userId/contacts
// Save emergency contacts
router.post('/:userId/contacts', async (req, res) => {
  const { contacts } = req.body; // [{name, phone}]
  try {
    await db.collection('users').doc(req.params.userId).update({ contacts });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/user/:userId
router.get('/:userId', async (req, res) => {
  try {
    const doc = await db.collection('users').doc(req.params.userId).get();
    if (!doc.exists) return res.status(404).json({ error: 'User not found' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
