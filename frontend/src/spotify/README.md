# Playlist player (YouTube embed)

Floating vinyl uses a **YouTube playlist** embed so visitors get full tracks without Spotify login/allowlist.

1. Create a playlist on [youtube.com](https://www.youtube.com/playlist_create) (not only Music).
2. Copy the `list=` value, e.g. `PLxxxxxxxx`.
3. Paste it into `embedConfig.js` as `YOUTUBE_PLAYLIST_ID`, or set `VITE_YOUTUBE_PLAYLIST_ID` in `.env`.
