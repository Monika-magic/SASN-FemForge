const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const { db } = require('../firebase');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendSMS = async (phone, message) => {
  return client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
  })
}

// POST /api/alert/sos
router.post('/sos', async (req, res) => {
  const { userId, userName, latitude, longitude, contacts } = req.body

  if (!userId || !latitude || !longitude || !contacts?.length) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`
  const message = `EMERGENCY ALERT! ${userName} needs help! Live location: ${mapsLink} This is an automated SOS alert. Please respond immediately.`

  try {
    const sosRef = await db.collection('sos_sessions').add({
      userId,
      userName,
      latitude,
      longitude,
      active: true,
      triggeredAt: new Date().toISOString(),
    })

    const smsPromises = contacts.map(contact => sendSMS(contact.phone, message))
    await Promise.all(smsPromises)

    res.json({ success: true, sessionId: sosRef.id, mapsLink })
  } catch (err) {
    console.error('SOS error:', err.message, '| code:', err.code)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/alert/safe
router.post('/safe', async (req, res) => {
  const { sessionId, userName, contacts } = req.body
  try {
    await db.collection('sos_sessions').doc(sessionId).update({
      active: false,
      resolvedAt: new Date().toISOString(),
    })

    const safeMsg = `${userName} is now safe. The emergency alert has been cancelled.`
    const smsPromises = contacts.map(contact => sendSMS(contact.phone, safeMsg))
    await Promise.all(smsPromises)

    res.json({ success: true })
  } catch (err) {
    console.error('Safe error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
