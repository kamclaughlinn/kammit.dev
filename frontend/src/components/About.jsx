import PixelWindow from './ui/PixelWindow';
import { MountainScene } from './ui/PixelScene';
import './About.css';

export default function About() {
  return (
    <MountainScene className="about section-zone" id="about">
      <div className="container">
        <h2 className="section-title">Installed Programs</h2>
        <p className="section-subtitle">About me &amp; fun facts</p>

        <div className="about-grid">
          <PixelWindow title="About Me.exe" className="about-window">
            <p>
              I'm a software engineer who lives mostly in the Java ecosystem —
              Spring Boot, microservices, REST APIs, the whole enterprise
              sandwich. I like clean architecture, readable code, and systems
              that don't wake me up at 3am (a girl can dream).
            </p>
            <p>
              When I'm not deep in backend logic, you'll find me dabbling in
              front-end tech, writing SQL that actually performs, or scripting
              little Python helpers. I believe good software should be reliable
              <em> and</em> a bit fun — much like this website.
            </p>
          </PixelWindow>

          <PixelWindow title="Fun Facts.dat" compact className="facts-window">
            <ul className="facts-list">
              <li><span className="fact-icon">☕</span> Minimum viable coffee: 2 cups</li>
              <li><span className="fact-icon">🐱</span> Elvis has veto power on deploys</li>
              <li><span className="fact-icon">🐛</span> Favorite bug: the "impossible" one</li>
              <li><span className="fact-icon">📚</span> Currently learning: whatever breaks next</li>
            </ul>
          </PixelWindow>
        </div>
      </div>
    </MountainScene>
  );
}
