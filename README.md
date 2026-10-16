# Share a Meal 🍲

### Connecting Surplus Food with Communities in Need

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Cloudflare%20Workers-orange?style=flat-square)](https://share-a-meal-live.codeenma1440.workers.dev)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Enabled-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Deployment-Cloudflare%20Workers-F38020?style=flat-square&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

**Share a Meal** is a food-sharing platform that connects surplus-food donors with volunteers and NGOs who can collect and distribute food to people in need.

**Live application:** [share-a-meal-live.codeenma1440.workers.dev](https://share-a-meal-live.codeenma1440.workers.dev)

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Key Features](#key-features)
- [Donation and Collection Workflow](#donation-and-collection-workflow)
- [Technology Stack](#technology-stack)
- [Live Demo](#live-demo)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Development Commands](#development-commands)
- [Cloudflare Deployment](#cloudflare-deployment)
- [Security and Privacy](#security-and-privacy)
- [Known Limitations](#known-limitations)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Food waste and food insecurity can exist in the same community. Share a Meal provides one workflow for publishing food donations, finding a suitable collection, tracking pickup progress, and verifying the physical handover.

The platform supports two roles:

- **Donors** publish surplus food, provide collection details, and follow progress.
- **Volunteers and NGOs** browse suitable donations, claim them, navigate to pickup, and update collection progress.

## Problem Statement

Surplus-food redistribution often relies on phone calls and informal coordination. This makes availability, pickup status, food details, and collection confirmation difficult to manage. Share a Meal centralizes those steps in one application.

## Key Features

### Donor dashboard

- Registration and profile management.
- Donation forms with item details, quantities, photographs, and food-safety timing.
- Donation status and volunteer pickup visibility.

### Volunteer and NGO dashboard

- Registration and profile management.
- Browse and claim available donations.
- Pickup controls, map navigation, and collection-status updates.

### Maps, GPS, and privacy

- Leaflet map visualization for collection tracking.
- Device-location support and OpenStreetMap Nominatim reverse geocoding for address assistance.
- Pickup information is intended to be exposed only after a valid claim; this must always be enforced by the backend.

### Handover verification

A six-digit handover OTP is used to verify pickup. A secure production setup should generate and validate codes on the server, enforce expiry and attempt limits, and never expose provider secrets to the browser.

## Donation and Collection Workflow

`Claimed → En Route → Arrived → Handover OTP Verified → Collected → Completed`

| Stage | Description |
|---|---|
| Registration | A donor or volunteer completes the appropriate account flow. |
| Donation creation | The donor supplies food, quantity, pickup, and timing information. |
| Discovery and claim | A volunteer or NGO finds and claims a suitable donation. |
| Pickup coordination | Status and location updates are shared where enabled. |
| Handover verification | The pickup OTP is verified in person. |
| Completion | The donation is marked collected and completed. |

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 19, TypeScript, Vite 8 | Component-based application UI |
| Styling | Tailwind CSS v4 | Utility-first styling |
| Maps | Leaflet.js | Interactive map rendering |
| Backend | Cloudflare Worker API routes | Server-side API handling |
| Authentication | Supabase Auth and profiles | Authentication and profile support |
| Phone verification | Phone.Email endpoint | Phone-verification integration |
| SMS verification | Twilio Verify v2 | Optional configurable SMS verification |
| Geocoding | OpenStreetMap Nominatim | Coordinate-to-address lookup |

## Live Demo

**Application URL:** [https://share-a-meal-live.codeenma1440.workers.dev](https://share-a-meal-live.codeenma1440.workers.dev)

The current demo includes three Tirupati collection cases for one sample donor:

| Case | Sample food | Status |
|---|---|---|
| Tata Nagar | 20 chapatis, mixed vegetable curry, 2 sweet boxes | Available |
| Ashok Nagar, Korlagunta | 9 biryani plates, 2 ice-cream boxes | En route / claimed |
| SV University Campus Area | Vegetable pulao, dal, dessert boxes | Completed history |

This is sample data, not verified live inventory. Confirm availability, food safety, and pickup details before any real-world collection.

## Getting Started

### Prerequisites

Install Node.js, npm, and optionally Git. Cloudflare deployment also requires a Cloudflare account and Wrangler authentication.

### Install and run locally

```bash
git clone <YOUR_REPOSITORY_URL>
cd <YOUR_PROJECT_DIRECTORY>
npm install
```

Copy the environment template and add only the credentials you need:

```powershell
Copy-Item .env.example .env
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Environment Configuration

Use [`.env.example`](.env.example) as the source of truth for environment-variable names. Depending on enabled features, configuration can include Supabase, Phone.Email, Twilio Verify, OTP validation, and Cloudflare Worker secrets.

Do not commit real credentials, API tokens, OTP secrets, or personal information.

## Development Commands

| Command | Purpose |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run Oxlint |
| `node test/verificationSuite.mjs` | Run core verification tests |
| `node test/registrationDemoModeSuite.mjs` | Run registration demo-mode tests |
| `node test/gpsAutofillSuite.mjs` | Run GPS and reverse-geocoding tests |
| `node test/functionalityFixesSuite.mjs` | Run functionality-fixes tests |

## Project Structure

```text
src/
├── components/       Shared, donor, volunteer, dashboard, and tracking views
├── services/         Donation, geocoding, authentication, and OTP services
└── types/            TypeScript definitions
functions/api/        Cloudflare Worker API route
server/               Local-development API helpers
test/                 Node.js validation suites
```

## Cloudflare Deployment

```bash
npm install
npx wrangler login
npm run build
npm run deploy
```

Set sensitive Worker values using secrets, never frontend source files:

```bash
npx wrangler secret put SMS_ACCOUNT_SID
npx wrangler secret put SMS_AUTH_TOKEN
npx wrangler secret put SMS_VERIFY_SERVICE_SID
npx wrangler secret put OTP_SECRET
```

After deployment, confirm HTTPS loading, authentication, API routes, map rendering, role-specific access, OTP behavior, and that logs do not expose private values.

## Security and Privacy

- Enforce donor and volunteer permissions in backend APIs, not only in the UI.
- Validate OTPs on the server and enforce expiry, attempt limits, and replay protection.
- Reveal pickup addresses only at the appropriate workflow stage.
- Use durable storage and safe concurrent-claim handling before production use.
- Respect external-service availability and location permissions.

## Known Limitations

1. The deployed Worker demo uses sample data and is not proof of real-world food availability.
2. Live location, geocoding, SMS, and authentication depend on permissions, configuration, connectivity, and third-party services.
3. The current Worker route uses in-memory demo data. It is not durable shared database storage and must be replaced with durable storage for real multi-user production coordination.
4. Demo verification behavior must not be treated as production-grade authentication or OTP security.

## Contributing

Create a focused branch, make and validate your change, run relevant tests and `npm run build`, document configuration changes, and submit it for review. Never include credentials, personal data, or sensitive precise locations in commits.

## License

This project is distributed under the MIT License. See [`LICENSE`](LICENSE) for the full license text.

---

**Share a Meal — Turning surplus food into an opportunity to serve communities.**
