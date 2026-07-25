import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { completeSpotifyLogin, getSpotifyRedirectUri } from '../spotify/auth';

export default function SpotifyCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    const code = params.get('code');

    if (err) {
      setError(`Spotify said: ${err}`);
      return;
    }
    if (!code) {
      setError('No auth code from Spotify');
      return;
    }

    // Guard against React StrictMode double-invoke
    const guardKey = `kammit_spotify_code_${code}`;
    if (sessionStorage.getItem(guardKey)) return;
    sessionStorage.setItem(guardKey, '1');

    completeSpotifyLogin(code)
      .then((returnTo) => {
        sessionStorage.setItem('kammit_open_player', '1');
        navigate(returnTo.startsWith('/') ? returnTo : '/', { replace: true });
      })
      .catch((e) => {
        sessionStorage.removeItem(guardKey);
        setError(e.message || 'Login failed');
      });
  }, [navigate]);

  if (error) {
    return (
      <main style={{ padding: '2rem', fontFamily: 'DM Sans, sans-serif', maxWidth: 480 }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Spotify login hiccup</h1>
        <p style={{ whiteSpace: 'pre-wrap', marginTop: '1rem' }}>{error}</p>
        <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#555' }}>
          In Spotify Dashboard → Redirect URIs, add exactly:
          <br />
          <code>{getSpotifyRedirectUri()}</code>
        </p>
        <a href={import.meta.env.BASE_URL} style={{ display: 'inline-block', marginTop: '1.25rem' }}>
          ← back to kammit
        </a>
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'DM Sans, sans-serif' }}>
      Connecting Spotify…
    </main>
  );
}
