# kammit.dev

Personal portfolio with an interactive Elvis digipet and cat-noise chatbot.

## Stack

- **Backend:** Java 17, Spring Boot 3, H2 (phrase storage)
- **Frontend:** React 18, Vite

## Features

- Cute & quirky portfolio (about, skills, projects, contact)
- **Elvis Digipet** — shared virtual cat: feed, pet, play, clean
- **Teach Elvis** — visitors leave phrases (content-filtered)
- **Elvis Chat** — chatbot that only responds with cat noises

## Run locally

### Backend

```bash
cd backend
./mvnw spring-boot:run
```

Or with Maven installed:

```bash
cd backend
mvn spring-boot:run
```

API runs on `http://localhost:8080`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Site runs on `http://localhost:5173` (proxies `/api` to backend)

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/elvis` | Current Elvis state |
| POST | `/api/elvis/feed` | Feed Elvis |
| POST | `/api/elvis/pet` | Pet Elvis |
| POST | `/api/elvis/play` | Play with Elvis |
| POST | `/api/elvis/clean` | Clean Elvis |
| POST | `/api/elvis/heart` | Send love to Elvis ♥ |
| GET | `/api/elvis/phrases` | Known phrases |
| POST | `/api/elvis/teach` | Teach a phrase |
| POST | `/api/elvis/chat` | Cat-noise chatbot |

## Customize

- Update personal info in `frontend/src/components/` (Hero, About, Contact, Projects)
- Swap email/social links in `Contact.jsx`
- Adjust content filter word list in `ContentFilterService.java`

## Deploy live (GitHub Pages + backend)

This site has two parts:

| Part | Host | What it serves |
|------|------|----------------|
| **Frontend** | GitHub Pages | Portfolio UI (free) |
| **Backend** | [Render](https://render.com) (free tier) | Elvis digipet API |

Elvis still works offline in the UI, but feed/pet/teach/chat need the backend online.

### 1. Push to GitHub

```bash
cd /path/to/kammit.dev
git init
git add .
git commit -m "Initial portfolio deploy"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/kammit.dev.git
git push -u origin main
```

### 2. Turn on GitHub Pages

1. Open your repo on GitHub → **Settings** → **Pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions**
3. Push to `main` — the workflow `.github/workflows/deploy-pages.yml` builds and deploys automatically
4. Your site will be at `https://YOUR_USERNAME.github.io/kammit.dev/` (unless you use a custom domain)

**If using the default `github.io/repo-name` URL** (not a custom domain), add a repo secret:

- **Settings → Secrets → Actions → New secret**
- Name: `VITE_BASE_PATH`
- Value: `/kammit.dev/` (slash, repo name, slash)

Skip this if you use a custom domain like `kammit.dev`.

### 3. Deploy the Java backend (Render)

1. Push this repo to GitHub (same repo is fine)
2. Go to [render.com](https://render.com) → **New → Blueprint** (or Web Service)
3. Connect the repo — Render picks up `render.yaml` and builds `backend/Dockerfile`
4. When live, copy your API URL (e.g. `https://kammit-api.onrender.com`)

### 4. Connect frontend to backend

In GitHub → **Settings → Secrets → Actions**, add:

| Secret | Example value |
|--------|----------------|
| `VITE_API_URL` | `https://kammit-api.onrender.com/api` |

Re-run the Pages workflow (**Actions** → **Deploy site to GitHub Pages** → **Run workflow**) or push a commit.

### 5. Custom domain (optional)

1. GitHub **Settings → Pages → Custom domain** → enter `kammit.dev`
2. At your domain registrar, add the DNS records GitHub shows you
3. Add `frontend/public/CNAME` with `kammit.dev` if needed (GitHub often creates this for you)

### Local production preview

```bash
cd frontend
VITE_API_URL=https://your-api.onrender.com/api npm run build
npm run preview
```
