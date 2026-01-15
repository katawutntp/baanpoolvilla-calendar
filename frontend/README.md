# Frontend (Next.js + Tailwind)

How to run locally:

1. cd frontend
2. npm install
3. npm run dev  # runs on http://localhost:3001

Note: backend runs on http://localhost:3000. Environment variable `NEXT_PUBLIC_API_BASE` points to the backend API.

Files:
- `pages/` — Next.js pages (`index.js` is main)
- `components/` — UI components (Header, HouseCard)
- `lib/api.js` — wrapper for backend API
- `styles/globals.css` — Tailwind config

Next steps: implement detailed components for BookingModal, WeeklyModal and calendar rendering (I can migrate these next).