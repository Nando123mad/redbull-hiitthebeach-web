# Red Bull HIIT The Beach (Next.js) — Project Structure & Guide

---

## Folder Tree

```
src/
  app/
    api/
      send/
        route.js            # API endpoint: POST /api/send
    favicon.ico
    layout.js               # App layout wrapper (App Router)
    page.js                 # Top-level state machine & page router
    page.module.css         # (Optional) module CSS for page-scoped styles
  components/
    pages/
      CameraPage.jsx        # Live camera + AI face detection + countdown capture
      CtaPage.jsx           # Landing CTA
      FormPage.jsx          # Name + email/phone + channel toggle
      PhotoDecidePage.jsx   # Choose to take photo or skip
      ReviewPage.jsx        # Preview avatar/time + Share
      ThanksPage.jsx        # Success screen
      TimeEntryPage.jsx     # Enter time (mm:ss)
  hooks/
    useAIFaceCamera.js      # Loads MediaPipe, starts camera, exposes refs & last detection
    useManualCamera.js      # Starts camera and exposes refs
    useCountdown.js         # Reusable countdown hook (fires onDone after render)
  lib/
    avatar.js               # buildDefaultAvatar, cropFaceFromFrame (canvas helpers)
    normalize.js            # normalizePhone, normalizeTime
    pages.js                # Pages enum for the flow
    share.js                # shareResult(): builds payload & POSTs to /api/send
    shareCard.js            # renderShareCard(): draws the shareable PNG
  styles/
    globals.css             # Global styles used across screens

.env.local                  # Env vars (e.g., API keys)
.eslintrc.config.mjs        # ESLint config
jsconfig.json               # Path alias config: "@/..." → "src/..."
next.config.mjs             # Next.js config
package.json
README.md
```

---

## File Descriptions

### app/page.js
Controls the overall user flow, storing all state and switching between components based on step.

### app/layout.js
Defines the global HTML/body structure for all pages. Imports global CSS here.

### app/api/send/route.js
Handles POST requests for sending results (via Twilio or email).

### components/pages/*
Contains all step-based UI screens (Form, Camera, Review, etc.)

### hooks/*
Reusable logic for MediaPipe AI/Standard Camera and countdown timer.

### lib/*
All utility functions (normalization, avatar creation, share logic).

### styles/globals.css
Holds global CSS definitions shared across screens.

---

## Hooks Overview

- **useAIFaceCamera.js** — Handles MediaPipe face detection, waits for DOM refs, and safely starts/stops the camera.
- **useManualCamera.js** — Handles manual camera with no AI, waits for DOM refs, and safely starts/stops the camera.
- **useCountdown.js** — Manages a timer with an `onDone` callback triggered after render.

---

## Data Flow Overview

1. **CTA Page** → start flow
2. **Form Page** → collect name + contact info
3. **Time Entry Page** → input time
4. **Photo Decide Page** → choose whether to take photo
5. **Camera Page** → capture avatar via AI face detection
6. **Review Page** → preview + share result
7. **Thanks Page** → success + restart flow

---

## API Behavior

- Endpoint: `/api/send`
- Input: `{ channel, to, name, time, attachmentDataUrl }`

---

## Path Alias Setup

In `jsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```

Restart the Next.js dev server after adding or changing this.

---

## Common Errors

- **404 /api/send** — File missing or misplaced (ensure `src/app/api/send/route.js` exists).
- **Unexpected token '<'** — Trying to parse HTML error as JSON; check `share.js` for improved error handling.
- **getContext is null** — Canvas ref not yet mounted; fixed in `useAIFaceCamera.js`.
- **Cannot update component while rendering** — Fixed in `useCountdown.js`.

---

## Run Locally

```bash
npm install
npm run dev
```

Then open: [http://localhost:3000](http://localhost:3000)

---

## Extending

- Add input validation with **zod**.
- Replace `/api/send` with real SendGrid/Twilio integration.

---

