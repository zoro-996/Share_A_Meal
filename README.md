# Share a Meal 🍲

**Share a Meal** connects people and businesses with surplus food to volunteers and NGOs who collect and distribute it to people in need.

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
| Backend (dev) | Node.js Vite plugin (in-process API handler) |
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
