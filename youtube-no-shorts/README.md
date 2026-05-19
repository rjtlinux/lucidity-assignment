# YouTube No-Shorts — Android App

A personal Android YouTube client that shows your subscriptions and lets you search and watch videos — with **all Shorts permanently filtered out**. Uses your real Google account (YouTube Premium works for ad-free playback).

---

## How it works

- Signs in via **Google OAuth** — reads your subscriptions using the official YouTube Data API v3.
- Home tab: latest uploads from your subscribed channels (up to 20 channels, 6 videos each).
- Search tab: full YouTube search with Shorts removed from results.
- Subscriptions tab: browse any channel's uploads — Shorts stripped.
- Playback: uses the official **YouTube IFrame Player** embedded in a WebView. If you're signed into Google in your device's Chrome/WebView, you'll get Premium ad-free playback.

**Shorts are filtered by two signals:**
1. Video duration ≤ 60 seconds
2. Title or description contains `#shorts` or `#short`

---

## Setup (one-time, ~15 minutes)

### 1. Prerequisites

```bash
# Install Node 18+, Java 17+, Android Studio (for SDK)
npx react-native doctor   # verify environment
```

### 2. Clone and scaffold

```bash
# Init a fresh RN project (gets the Android boilerplate)
npx react-native@0.73 init YouTubeNoShorts --template react-native-template-typescript
cd YouTubeNoShorts

# Copy the source code from this repo into it
cp -r /path/to/this/youtube-no-shorts/src ./
cp /path/to/this/youtube-no-shorts/App.tsx ./
cp /path/to/this/youtube-no-shorts/package.json ./
```

### 3. Google Cloud — enable YouTube API

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → New Project.
2. **APIs & Services → Library** → enable **YouTube Data API v3**.
3. **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**:
   - Create a **Web** client → copy the client ID (used in `App.tsx`).
   - Create an **Android** client:
     - Package name: `com.youtubenoshortsapp`
     - SHA-1: run `cd android && ./gradlew signingReport` and copy the debug SHA-1.
4. **OAuth consent screen** — add yourself as a test user (or publish if you prefer).

### 4. Configure the app

Open `App.tsx` and replace the placeholder:

```ts
const WEB_CLIENT_ID = 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com';
//                     ^^^^ paste your Web OAuth client ID here
```

### 5. Firebase / google-services.json

The `@react-native-google-signin/google-signin` package needs a `google-services.json`:

1. In Google Cloud Console → **APIs & Services → Credentials**, download the Android OAuth client config,  
   **or** go to [Firebase Console](https://console.firebase.google.com) → Add project → Add Android app (package `com.youtubenoshortsapp`) → download `google-services.json`.
2. Place `google-services.json` at `android/app/google-services.json`.

### 6. Install dependencies

```bash
npm install
```

### 7. Build and install (debug APK)

Plug in your Android device with USB debugging enabled, or launch an emulator:

```bash
npx react-native run-android
```

To build a standalone APK you can sideload:

```bash
cd android
./gradlew assembleRelease
# APK at: android/app/build/outputs/apk/release/app-release.apk
```

Transfer the APK to your phone via USB/email, install it (allow "install unknown apps" in settings), and you're done.

---

## API quota note

The free YouTube Data API v3 quota is **10,000 units/day**. Loading the home feed costs roughly 80–120 units (1 subscriptions call + 1 channels call + ~20 playlistItems calls + ~3 videos calls). Normal daily usage is well within the free tier.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `DEVELOPER_ERROR` on sign-in | SHA-1 fingerprint in Google Cloud doesn't match. Re-run `./gradlew signingReport` and update. |
| Blank video player | Your WebView version may be outdated. Update Android System WebView from the Play Store. |
| `403 quotaExceeded` | You've hit the daily API quota. Wait until midnight Pacific time for reset. |
| Videos not loading | Token expired — sign out and sign back in. |
