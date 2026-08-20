import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { SkyScene } from '../components/ui/PixelScene';
import XpWindow from '../components/ui/XpWindow';
import ElvisCat from '../components/ElvisCat';
import TouchCrosshair from '../components/TouchCrosshair';
import { runCrawl } from '../api/crawlerApi';
import './CrawlerPage.css';

const DEFAULT_URL = 'https://crawlme.monzo.com/';

const HACK_LINES = [
  'hacking into the mainframe…',
  'bypassing the firewall (politely)…',
  'meow.exe is in the pipes…',
  'enumerating hyperlinks…',
  'almost… don’t look at HR…',
];

const FAKE_BOOT = [
  '> boot crawl_kernel.sys',
  '> mount frontier_queue',
  '> spin worker pool…',
  '> resolve DNS (fingers crossed)',
  '> open sockets… beep boop',
  '> sniffing a[href]…',
  '> staying on exact host (no funny business)',
  '> active++ / active-- ritual engaged',
];

function MatrixRain({ active }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    let frame;
    let running = true;

    const glyphs = 'アイウエオカキクケコｻｼｽｾｿ01カミットCRWL<>/$#*';
    const fontSize = 13;
    let drops = [];

    function resize() {
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      const cols = Math.max(8, Math.floor(canvas.width / fontSize));
      drops = Array.from({ length: cols }, () => Math.random() * -40);
    }

    resize();
    window.addEventListener('resize', resize);

    function draw() {
      if (!running) return;
      ctx.fillStyle = active ? 'rgba(12, 28, 24, 0.14)' : 'rgba(12, 28, 24, 0.28)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px "JetBrains Mono", "Courier New", monospace`;
      for (let i = 0; i < drops.length; i += 1) {
        const ch = glyphs[Math.floor(Math.random() * glyphs.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        ctx.fillStyle = active ? '#7dffc8' : '#3a6b5c';
        ctx.fillText(ch, x, y);
        if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i] += active ? 0.85 : 0.25;
      }
      frame = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      running = false;
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, [active]);

  return <canvas className="crawler-matrix" ref={canvasRef} aria-hidden="true" />;
}

export default function CrawlerPage() {
  const [startUrl, setStartUrl] = useState(DEFAULT_URL);
  const [maxPages, setMaxPages] = useState(12);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [elvisLine, setElvisLine] = useState('gimme a url — i’ll hack the mainframe');
  const [bubbleKey, setBubbleKey] = useState(0);
  const [bootLines, setBootLines] = useState([]);
  const [hackIdx, setHackIdx] = useState(0);

  function say(line) {
    setElvisLine(line);
    setBubbleKey((k) => k + 1);
  }

  useEffect(() => {
    if (!loading) return undefined;
    setBootLines([]);
    let i = 0;
    const bootTimer = setInterval(() => {
      setBootLines((prev) => {
        if (i >= FAKE_BOOT.length) return prev;
        const next = [...prev, FAKE_BOOT[i]];
        i += 1;
        return next;
      });
    }, 280);

    const hackTimer = setInterval(() => {
      setHackIdx((n) => {
        const next = (n + 1) % HACK_LINES.length;
        say(HACK_LINES[next]);
        return next;
      });
    }, 1400);

    say(HACK_LINES[0]);

    return () => {
      clearInterval(bootTimer);
      clearInterval(hackTimer);
    };
  }, [loading]);

  async function handleScan(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await runCrawl({
        startUrl: startUrl.trim(),
        maxPages: Number(maxPages) || 12,
      });
      setResult(data);
      say("i'm in");
    } catch (err) {
      setError(err?.message || 'Crawl failed — is the API awake?');
      say('access denied… backend nap?');
    } finally {
      setLoading(false);
    }
  }

  const elvisMood = loading ? 'ecstatic' : result ? 'content' : error ? 'grumpy' : 'chill';

  return (
    <SkyScene className="crawler-page">
      <TouchCrosshair />

      <header className="crawler-header container">
        <Link to="/" className="crawler-back">← kammit.dev</Link>
        <h1 className="crawler-brand">crawl.exe</h1>
        <p className="crawler-tagline">
          concurrent BFS · same-host only · elvis vs the mainframe
        </p>
      </header>

      <main className="crawler-main container">
        <XpWindow title="url_scanner.exe" className="crawler-scan-window">
          <p className="crawler-blurb">
            Type a start URL — web edition of <code>Scanner.nextLine()</code>. We stay on that exact host.
          </p>
          <form className="crawler-form" onSubmit={handleScan}>
            <label htmlFor="crawler-url">target</label>
            <input
              id="crawler-url"
              type="url"
              required
              value={startUrl}
              onChange={(e) => setStartUrl(e.target.value)}
              placeholder="https://crawlme.monzo.com/"
              disabled={loading}
            />
            <label htmlFor="crawler-pages">max pages (1–20)</label>
            <input
              id="crawler-pages"
              type="number"
              min={1}
              max={20}
              value={maxPages}
              onChange={(e) => setMaxPages(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'hacking…' : 'hack the mainframe →'}
            </button>
          </form>
        </XpWindow>

        <XpWindow title="terminal_out.exe" className="crawler-term-window">
          <div className={`crawler-term ${loading ? 'is-hacking' : ''}`}>
            <MatrixRain active={loading || Boolean(result)} />
            <div className="crawler-term-fg">
              <div className="crawler-term-bar">
                <span>root@kammit:~# crawl</span>
                <span className="crawler-term-blink">█</span>
              </div>

              {loading && (
                <pre className="crawler-boot">
                  {bootLines.join('\n')}
                  {bootLines.length < FAKE_BOOT.length ? '\n> …' : '\n> waiting on workers…'}
                </pre>
              )}

              {error && !loading && (
                <p className="crawler-error">ERROR: {error}</p>
              )}

              {result && !loading && (
                <div className="crawler-results">
                  <p className="crawler-meta">
                    ACCESS GRANTED · host={result.host} · fetched={result.pagesFetched}/{result.maxPages} ·
                    visited={result.visited} · threads={result.threadCount}
                  </p>
                  {(result.pages || []).map((page) => (
                    <article key={page.url} className="crawler-page-block">
                      <h3>URL: {page.url}</h3>
                      <p>Links found:</p>
                      <ul>
                        {(page.links || []).map((link) => (
                          <li key={`${page.url}-${link}`}>{link}</li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              )}

              {!loading && !result && !error && (
                <p className="crawler-idle">
                  awaiting target…
                  <br />
                  tip: try{' '}
                  <button type="button" className="crawler-linkish" onClick={() => setStartUrl(DEFAULT_URL)}>
                    {DEFAULT_URL}
                  </button>
                </p>
              )}
            </div>
          </div>
        </XpWindow>
      </main>

      <aside className="crawler-elvis" aria-live="polite">
        <div key={bubbleKey} className="crawler-elvis-bubble">
          {elvisLine}
        </div>
        <ElvisCat
          mood={elvisMood}
          size="small"
          className={`crawler-elvis-sprite${loading ? ' is-hacking' : ''}${result && !loading ? ' is-in' : ''}`}
        />
        {loading && <span className="crawler-hack-badge">H4X0R</span>}
        {result && !loading && <span className="crawler-hack-badge in">I&apos;M IN</span>}
      </aside>
    </SkyScene>
  );
}
