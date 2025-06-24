# Pool Tournament Tracker

This is a simple Pool Tournament Tracker app using Firebase Realtime Database and Firebase Hosting.

## Setup

1. Replace the Firebase config in `app.js` with your own Firebase project credentials.
2. Install Firebase CLI if you haven't:

```bash
npm install -g firebase-tools
```

3. Login and initialize Firebase in this folder:

```bash
firebase login
firebase init
```

Choose Hosting and select this folder as public directory.

4. Deploy your app:

```bash
firebase deploy
```

## Features

- Add and remove players
- Record matches between players
- View match history
- View leaderboard sorted by wins and win percentage
- Real-time sync with Firebase Realtime Database
