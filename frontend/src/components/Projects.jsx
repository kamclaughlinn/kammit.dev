import PixelWindow from './ui/PixelWindow';
import { MountainScene } from './ui/PixelScene';
import './Projects.css';

const projects = [
  {
    title: 'Enterprise API Platform',
    emoji: '🏗️',
    desc: 'Spring Boot microservices handling high-volume REST traffic with PostgreSQL and Redis caching.',
    tags: ['Java', 'Spring Boot', 'SQL', 'Docker'],
  },
  {
    title: 'Data Pipeline Toolkit',
    emoji: '🔄',
    desc: 'Python scripts + SQL stored procedures for ETL workflows and automated reporting.',
    tags: ['Python', 'SQL', 'PostgreSQL'],
  },
  {
    title: 'Internal Admin Dashboard',
    emoji: '📊',
    desc: 'React front-end backed by Java APIs — because someone had to make the ops team happy.',
    tags: ['React', 'Java', 'REST'],
  },
  {
    title: 'Elvis Digipet (this site!)',
    emoji: '🐱',
    desc: 'A shared virtual cat you can feed, pet, and teach phrases. He runs the show.',
    tags: ['Java', 'React', 'Fun'],
  },
];

export default function Projects() {
  return (
    <MountainScene className="projects section-zone" id="projects">
      <div className="container">
        <h2 className="section-title">Projects</h2>
        <p className="section-subtitle">Things I've built (Elvis approved)</p>

        <div className="projects-grid">
          {projects.map((project, i) => (
            <PixelWindow
              key={project.title}
              title={`project_${i + 1}.exe`}
              compact
              className="project-window"
            >
              <article className="project-card">
                <span className="project-emoji">{project.emoji}</span>
                <h3>{project.title}</h3>
                <p>{project.desc}</p>
                <div className="project-tags">
                  {project.tags.map((tag) => (
                    <span key={tag} className="project-tag">{tag}</span>
                  ))}
                </div>
              </article>
            </PixelWindow>
          ))}
        </div>
      </div>
    </MountainScene>
  );
}
