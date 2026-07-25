import { Link } from 'react-router-dom';
import PixelWindow from './ui/PixelWindow';
import { MountainScene } from './ui/PixelScene';
import './Projects.css';

function openPlaylistPlayer() {
  window.dispatchEvent(new CustomEvent('kammit:open-player'));
  window.postMessage({ type: 'KAMMIT_OPEN_PLAYER' }, '*');
}

const projects = [
  {
    title: 'Personal KAMBan (get it? KANBAN? KAM!BAN....okay)',
    emoji: '📝',
    desc: 'Shared roadmap board — Java/Spring + Postgres POC. View what kammit is shipping next.',
    tags: ['Java', 'Spring Boot', 'React'],
    to: '/kamban',
    openLabel: 'open kamban →',
  },
  {
    title: 'Playlist Player!',
    emoji: '🎵',
    desc: 'Floating vinyl shrine — kammit’s playlist via Spotify embed. No login, no extension.',
    tags: ['Spotify', 'React', 'Embed'],
    openPlayer: true,
    openLabel: 'open player →',
  },
  {
    title: '(TODO://.𖥔 ݁ ˖⋆⭒˚｡⋆) Coffee Shop Dashboard',
    emoji: '☕',
    desc: 'TBC.',
    tags: ['React', 'Java', 'REST'],
  },
  {
    title: 'Personal Site (ur looking at it!)',
    emoji: '🖥️',
    desc: 'Look at the clouds! They move, fun?!.',
    tags: ['Java', 'React', 'PostgreSQL', 'Cursor AI', 'Fun'],
  },
];

export default function Projects() {
  return (
    <MountainScene className="projects section-zone" id="projects">
      <div className="container">
        <h2 className="section-title">Projects</h2>
        <p className="section-subtitle">Things I've built (Elvis approved)</p>

        <div className="projects-grid">
          {projects.map((project, i) => {
            const interactive = Boolean(project.to || project.openPlayer);
            const inner = (
              <article className="project-card">
                <span className="project-emoji">{project.emoji}</span>
                <h3>{project.title}</h3>
                <p>{project.desc}</p>
                <div className="project-tags">
                  {project.tags.map((tag) => (
                    <span key={tag} className="project-tag">
                      {tag}
                    </span>
                  ))}
                </div>
                {project.openLabel ? (
                  <span className="project-open">{project.openLabel}</span>
                ) : null}
              </article>
            );

            let body = inner;
            if (project.to) {
              body = (
                <Link to={project.to} className="project-link">
                  {inner}
                </Link>
              );
            } else if (project.openPlayer) {
              body = (
                <button
                  type="button"
                  className="project-link project-link-btn"
                  onClick={openPlaylistPlayer}
                >
                  {inner}
                </button>
              );
            }

            return (
              <PixelWindow
                key={project.title}
                title={`project_${i + 1}.exe`}
                compact
                className={`project-window ${interactive ? 'project-window-link' : ''}`}
              >
                {body}
              </PixelWindow>
            );
          })}
        </div>
      </div>
    </MountainScene>
  );
}
