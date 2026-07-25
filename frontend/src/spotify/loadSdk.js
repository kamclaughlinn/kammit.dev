let loading = null;

export function loadSpotifySdk() {
  if (window.Spotify?.Player) return Promise.resolve();
  if (loading) return loading;

  loading = new Promise((resolve, reject) => {
    const prev = window.onSpotifyWebPlaybackSDKReady;
    const timer = setTimeout(() => {
      reject(new Error('Spotify player SDK failed to load'));
    }, 10000);

    window.onSpotifyWebPlaybackSDKReady = () => {
      clearTimeout(timer);
      if (typeof prev === 'function') prev();
      resolve();
    };

    const script = document.createElement('script');
    script.src = `${import.meta.env.BASE_URL}spotify/spotify-player.js`;
    script.async = true;
    script.onerror = () => {
      clearTimeout(timer);
      loading = null;
      reject(new Error('Could not load spotify-player.js'));
    };
    document.head.appendChild(script);

    // SDK may have already fired if script was cached oddly
    if (window.Spotify?.Player) {
      clearTimeout(timer);
      resolve();
    }
  });

  return loading;
}
