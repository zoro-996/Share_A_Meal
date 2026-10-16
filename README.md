# Share a Meal 🍲

### Surplus Food, Shared with Communities

Share a Meal connects people and businesses with surplus food to volunteers and NGOs for distribution.

**Live Demo:** [https://share-a-meal-live.codeenma1440.workers.dev](https://share-a-meal-live.codeenma1440.workers.dev)

## Features

- **Donors:** Publish food details, quantities, photos, and expiry information.
- **Volunteers/NGOs:** Browse and claim donations.
- **GPS Tracking:** View volunteer locations on a map.
- **Pickup Flow:** Claimed → En Route → Arrived → OTP Verified → Collected → Completed.
- **Handover OTP:** Six-digit verification during collection.
- **Privacy:** Pickup address is intended to stay hidden until a claim.
- **GPS Autofill:** Device location and reverse geocoding.
- **Profiles:** View and edit user information.

## Tech Stack

React 19, TypeScript, Vite 8, Tailwind CSS v4, Leaflet, Cloudflare Workers, Supabase Auth, Phone.Email, Twilio Verify, and OpenStreetMap Nominatim.

## Setup

Prerequisites: Node.js and npm.

```bash
npm install
```

Configure `.env` using `.env.example`, then run:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Deploy

```bash
npx wrangler login
npm run build
npm run deploy
```

Store credentials as Cloudflare Worker secrets. Never commit secrets.

## Tests

```bash
npm run build
npm run lint
node test/verificationSuite.mjs
node test/registrationDemoModeSuite.mjs
node test/gpsAutofillSuite.mjs
node test/functionalityFixesSuite.mjs
```

## Security

Demo mode may bypass OTP. Production must enforce server-side authentication, authorization, OTP validation, and address access controls. Verify persistent storage and cross-device sync before launch.

## License

MIT. See [`LICENSE`](LICENSE).

**Share a Meal — Turning surplus food into an opportunity to serve communities.**
