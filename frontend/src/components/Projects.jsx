import { Link } from 'react-router-dom';
import PixelWindow from './ui/PixelWindow';
import { MountainScene } from './ui/PixelScene';
import './Projects.css';

const projects = [
  {
    title: 'Personal KAMBan (get it? KANBAN? KAM!BAN....okay)',
    emoji: '🏗️',
    desc: 'Basic Sticky-note kanban.',
    tags: ['Java', 'Spring Boot', 'React'],
    to: '/kamban',
  },
  {
    title: '(TODO://ᯓ★🎧ྀི) Playlist Player!',
    emoji: '🔄',
    desc: 'Python scripts + SQL stored procedures for ETL workflows and automated reporting.',
    tags: ['Python', 'SQL', 'PostgreSQL'],
  },
  {
    title: '(TODO://.𖥔 ݁ ˖⋆⭒˚｡⋆) Coffee Shop Dashboard',
    emoji: '📊',
    desc: 'React front-end backed by Java APIs.',
    tags: ['React', 'Java', 'REST'],
  },
  {
    title: 'Personal Site (ur looking at it!)',
    emoji: '🐱',
    desc: 'Look at the clouds! They move, fun?!.',
    tags: ['Java', 'React', 'PostgreSQL','Cursor API','Fun'],
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
            const inner = (
              <article className="project-card">
                <span className="project-emoji">{project.emoji}</span>
                <h3>{project.title}</h3>
                <p>{project.desc}</p>
                <div className="project-tags">
                  {project.tags.map((tag) => (
                    <span key={tag} className="project-tag">{tag}</span>
                  ))}
                </div>
                {project.to ? (
                  <span className="project-open">open kamban →</span>
                ) : null}
              </article>
            );

            return (
              <PixelWindow
                key={project.title}
                title={`project_${i + 1}.exe`}
                compact
                className={`project-window ${project.to ? 'project-window-link' : ''}`}
              >
                {project.to ? (
                  <Link to={project.to} className="project-link">
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </PixelWindow>
            );
          })}
        </div>
      </div>
    </MountainScene>
  );
}
