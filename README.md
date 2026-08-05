# AutoReels

Premium personal dashboard for pasting a YouTube Shorts link, generating a caption with default hashtags, and uploading to Instagram Reels, TikTok, and YouTube Shorts.

## Features

- **Dual roles**
  - **Admin** — dashboard graphs, upload studio, platforms, history, settings, user management
  - **Submitter** — paste a Shorts URL and track their own upload status
- **Modular providers** — Instagram / TikTok / YouTube isolated under `UploadService`
- **Demo mode** — full upload flow works without platform API keys
- **Glassmorphism UI** — dark-by-default Apple-inspired dashboard (React + Vite + Tailwind + Framer Motion)
- **Realtime progress** — Socket.IO per-platform status bars
- **Secure storage** — JWT auth, bcrypt passwords, AES-GCM encrypted platform credentials

## Default hashtags

Every caption appends (editable in Settings):

```text
#drdonut
#donutsmp
#dream
#viral
#minecraft
```

## Quick start

### Prerequisites

- Node.js 20+
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) on `PATH`

### Setup

```bash
git clone git@github.com:neonjava/AutoReels.git
cd AutoReels
npm run install:all
cp backend/.env.example backend/.env
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:4000

### Default admin

From `backend/.env`:

- Username: `admin`
- Password: `REDACTED_PASSWORD`

Create submitter accounts under **Users** in the admin UI.

## Architecture

```text
frontend/          React + Vite + Tailwind + Framer Motion
backend/
  src/services/
    download/      yt-dlp
    caption/       title + hashtags
    upload/
      instagram/
      tiktok/
      youtube/
```

## Environment

See [backend/.env.example](backend/.env.example).

| Variable | Purpose |
|---|---|
| `JWT_SECRET` | Auth token signing |
| `ENCRYPTION_KEY` | 64-char hex key for credential encryption |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Seeded on first boot |
| `DEMO_MODE` | Simulate uploads when true |

## License

Private
