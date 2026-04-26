# 🛡️ SASN — Smart Adaptive Safety Network

> EliteHer Hackathon 2026 | PS 1: Real-Time Emergency Response & Tracking System

## Idea Title
SASN — Smart Adaptive Safety Network

## Idea Description
SASN is a real-time emergency response web application designed for women's safety. With a single hold of the SOS button, it instantly sends real SMS alerts with a live Google Maps location link to pre-saved emergency contacts. The location updates every 30 seconds automatically, and contacts can track the user in real-time from any device without installing any app.

## The Problem
In emergency situations, women often face difficulty in quickly alerting trusted contacts or authorities while also sharing their real-time location and situation context. Existing solutions are either too complex, require app installation by contacts, or fail to deliver real-time location updates.

## Our Solution
One tap. Real SMS. Live GPS. No app needed for contacts.
- Hold SOS button for 2 seconds → real SMS sent to emergency contacts
- SMS contains live Google Maps tracking link
- Location updates every 30 seconds automatically
- Contacts track in real-time from any browser
- "I'm Safe" button sends confirmation SMS to all contacts

## Tech Stack

| Technology | Purpose |
|---|---|
| React + Vite | Frontend UI — fast, mobile-responsive |
| Node.js + Express | Backend API server |
| Firebase Firestore | Real-time database for live location sessions |
| Twilio | Real SMS delivery to emergency contacts |
| Browser Geolocation API | High-accuracy GPS tracking |
| Google Maps Embed | Live location visualization |
| Vercel | Frontend deployment |
| Render | Backend deployment |

## Architecture Overview
```
User Device (React App)
    ↓ holds SOS button
    ↓ captures GPS (high accuracy)
    ↓ POST /api/alert/sos
Backend (Node.js + Express)
    ↓ saves session to Firebase Firestore
    ↓ sends SMS via Twilio to all contacts
    ↓ returns sessionId + tracking link
User Device
    ↓ updates location every 30s → POST /api/location/update
Emergency Contact
    ↓ receives SMS with Google Maps link
    ↓ opens /track/:sessionId in browser
    ↓ sees live location refreshing every 15s
```

## Database Used
Firebase Firestore (NoSQL, real-time)
- `users` collection — stores user profile and emergency contacts
- `sos_sessions` collection — stores active SOS sessions with live coordinates

## Third-Party Integrations
- Twilio — SMS API for real emergency alerts
- Firebase Admin SDK — server-side Firestore access
- Google Maps Embed API — live location map display

## Key Features
- One-tap SOS with 2-second hold (prevents accidental triggers)
- Real SMS to emergency contacts (no app install needed by contacts)
- Live GPS tracking with 30-second updates
- Real-time activity log showing every event with timestamp
- Per-contact SMS delivery status (sent/failed)
- "I'm Safe" cancellation with confirmation SMS
- One-time registration (no repeated logins)
- Location permission screen on first launch
- Mobile-first responsive design

## Live Demo
- Frontend: [deployed link]
- Backend API: [deployed link]
- GitHub: [repo link]

## Local Setup
```bash
# Clone repo
git clone https://github.com/yourusername/sasn-app.git

# Backend
cd server
npm install
# create .env from .env.example
node index.js

# Frontend
cd client
npm install
# create .env from .env.example
npm run dev
```
