# Share a Meal 🍲

**Share a Meal** connects people and businesses with surplus food to volunteers and NGOs who collect and distribute it to people in need.

## Live demo

The current Cloudflare Worker deployment is available at:

[https://share-a-meal-live.codeenma1440.workers.dev](https://share-a-meal-live.codeenma1440.workers.dev)

The demo starts with four available food listings from one Tirupati donor:

- Tata Nagar — 30 portions
- Ashok Nagar, Korlagunta — 35 portions
- SV University Campus Area — 40 portions
- Srinivasa Nagar / Varadaraja Nagar — 30 portions

## Features

- **Donor registration & dashboard** — Restaurants, households, and event organizers can list surplus food with itemized details, photos, and expiry windows.
- **Volunteer registration & dashboard** — Individual volunteers and NGOs browse and claim available donations.
- **Real-time pickup tracking** — Volunteers broadcast live GPS coordinates; donors see their position on a live map.
- **Rapido-style status workflow** — Claimed → En Route → Arrived → Handover OTP verified → Collected → Completed.
- **Handover OTP gate** — A 6-digit one-time code is required at pickup to confirm secure food handover.
- **Privacy masking** — Pickup address is only revealed to a volunteer after they claim a donation.
- **GPS address autofill** — Donors and volunteers can use their current device location to auto-fill address fields via reverse geocoding (OpenStreetMap Nominatim).
- **Profile management** — Both donors and volunteers can view and edit their profile data.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 8 |
| Styling | Tailwind CSS v4 |
| Maps | Leaflet.js |
| Backend | Cloudflare Worker API routes |
| Authentication | Supabase Auth and profiles |
| Phone verification | Phone.Email backend verification endpoint |
| SMS OTP | Twilio Verify v2 (configurable; demo mode bypasses OTP) |
| Geocoding | OpenStreetMap Nominatim |

## Getting Started

```bash
# Install dependencies
npm install

# Copy env template and fill in credentials (optional for demo mode)
cp .env.example .env

# Start development server with API proxy
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173).

## Cloudflare deployment

```bash
npm install
npx wrangler login
npm run deploy
```

Keep SMS/OTP provider credentials out of source control and add them as Cloudflare Worker secrets:

```bash
npx wrangler secret put SMS_ACCOUNT_SID
npx wrangler secret put SMS_AUTH_TOKEN
npx wrangler secret put SMS_VERIFY_SERVICE_SID
npx wrangler secret put OTP_SECRET
```

## Environment Variables

See [`.env.example`](.env.example) for the full list.  
Real SMS requires Twilio credentials. The app works without them in demo mode (OTP step is skipped).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with API |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run oxlint across all source files |
| `node test/verificationSuite.mjs` | Core backend logic tests |
| `node test/registrationDemoModeSuite.mjs` | Demo-mode OTP bypass tests |
| `node test/gpsAutofillSuite.mjs` | GPS & reverse geocoding tests |
| `node test/functionalityFixesSuite.mjs` | Full functionality fixes test suite |

## Project Structure

```
src/
  components/
    common/          # Shared components (AppHeader, ProfileModal, FoodItemsTable, …)
    dashboard/       # DonorDashboard, VolunteerDashboard
    donor/           # DonorRegistration, DonateNowForm, CollectionLocationMap
    volunteer/       # VolunteerRegistration
    tracking/        # PickupTracker (live GPS map view)
  services/          # donationService, geocodingService, otpService
  types/             # TypeScript type definitions
server/
  apiHandler.ts      # In-process Vite API handler
  donationStore.ts   # In-memory data store
  otpProvider.ts     # SMS OTP provider (Twilio Verify)
test/                # Node.js test suites (no test runner required)
```

## License

MIT
