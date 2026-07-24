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
              that don't keep me up at night (a girl can dream).
            </p>
            <p>
              When I'm not deep in backend logic, you'll find me watching random YouTube videos,
               playing video games, or hanging out with my cat Elvis. I also enjoy learning new programming languages and
                frameworks, and I'm currently learning Python...or trying to.
            </p>
          </PixelWindow>

          <PixelWindow title="Fun Facts.dat" compact className="facts-window">
            <ul className="facts-list">
              <li><span className="fact-icon">🐱</span> Proud owner of Elvis</li>
              <li><span className="fact-icon">🐛</span> Favorite game: Elden Ring</li>
              <li><span className="fact-icon">☕</span> Favorite coffee: Iced Banana Bread Latte (trust me)</li>
              <li><span className="fact-icon">📚</span> Currently learning: Python</li>
              <li><span className="fact-icon">🎵</span> Currently Listening to: The Sign - Ace of Base</li>
            </ul>
          </PixelWindow>
        </div>
      </div>
    </MountainScene>
  );
}
