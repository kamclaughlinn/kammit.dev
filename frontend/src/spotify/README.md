# In-site Spotify record player

Add these **Redirect URIs** in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) for your app:

- `http://127.0.0.1:5173/spotify-callback`
- `https://kammit.dev/spotify-callback`
- `https://www.kammit.dev/spotify-callback`
- `https://kamclaughlinn.github.io/kammit.dev/spotify-callback`

Optional: set `VITE_SPOTIFY_CLIENT_ID` in `frontend/.env` (defaults to the shared app Client ID).

Requires **Spotify Premium**. Development-mode apps only allow listed Spotify emails until you request Extended Quota.
