import PixelWindow from './ui/PixelWindow';
import DigitalMeFlip from './DigitalMeFlip';
import { SkyScene } from './ui/PixelScene';
import './Hero.css';

export default function Hero() {
  return (
    <SkyScene className="hero section-zone">
      <div className="container">
        <PixelWindow title="Kerry Anne's Portfolio.exe" className="hero-window">
          <div className="hero-inner">
            <div className="hero-left">
              <PixelWindow title="Digital Me" compact className="digital-me-window">
                <DigitalMeFlip />
              </PixelWindow>
              <div className="hero-speech">
                <p>Hi! Welcome to my portfolio!</p>
              </div>
            </div>

            <div className="hero-right">
              <p className="hero-greeting">hey, i'm</p>
              <h1 className="hero-name">Kerry Anne</h1>
              <p className="hero-tagline">
                Software engineer · Java enjoyer · professional cat botherer
              </p>
              <p className="hero-blurb">
                I build backend systems that (mostly) behave, wrangle databases,
                and occasionally convince CSS to do what I want. My cat Elvis
                is my apprentice — he supervises all commits.
              </p>
              <div className="hero-actions">
                <a href="#projects" className="btn">See my work</a>
                <a href="#elvis" className="btn btn-secondary">Meet Elvis</a>
              </div>
            </div>
          </div>
        </PixelWindow>
      </div>
    </SkyScene>
  );
}
