import PixelWindow from './ui/PixelWindow';
import { MountainScene } from './ui/PixelScene';
import './Skills.css';

const skillGroups = [
  {
    title: 'Primary Stack',
    file: 'java_core.sys',
    skills: [
      { name: 'Java', level: 95 },
      { name: 'Spring Boot', level: 90 },
      { name: 'REST APIs', level: 88 },
      { name: 'Microservices', level: 82 },
    ],
  },
  {
    title: 'Data Layer',
    file: 'database.db',
    skills: [
      { name: 'SQL', level: 85 },
      { name: 'PostgreSQL', level: 80 },
      { name: 'JPA/Hibernate', level: 78 },
      { name: 'Database Design', level: 75 },
    ],
  },
  {
    title: 'Front-end (Light)',
    file: 'frontend.ui',
    skills: [
      { name: 'HTML/CSS', level: 70 },
      { name: 'JavaScript', level: 65 },
      { name: 'React', level: 60 },
      { name: 'TypeScript', level: 45 },
    ],
  },
  {
    title: 'Also in Toolbox',
    file: 'misc_tools.bin',
    skills: [
      { name: 'Python', level: 55 },
      { name: 'Git', level: 85 },
      { name: 'Docker', level: 65 },
      { name: 'CI/CD', level: 60 },
    ],
  },
];

export default function Skills() {
  return (
    <MountainScene className="skills section-zone" id="skills">
      <div className="container">
        <h2 className="section-title">Software List</h2>
        <p className="section-subtitle">Mostly Java. Occasionally chaos.</p>

        <div className="skills-grid">
          {skillGroups.map((group) => (
            <PixelWindow key={group.title} title={group.file} compact className="skill-window">
              <h3 className="skill-group-title">{group.title}</h3>
              <div className="skill-bars">
                {group.skills.map((skill) => (
                  <div key={skill.name} className="skill-row">
                    <span className="skill-name">{skill.name}</span>
                    <div className="progress-bar">
                      <div
                        className={`progress-fill ${skill.level > 75 ? 'good' : skill.level > 50 ? 'ok' : 'low'}`}
                        style={{ width: `${skill.level}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </PixelWindow>
          ))}
        </div>
      </div>
    </MountainScene>
  );
}
