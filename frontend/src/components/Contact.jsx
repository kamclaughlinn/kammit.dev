import PixelWindow from './ui/PixelWindow';
import { SunsetScene } from './ui/PixelScene';
import './Contact.css';

const links = [
  { label: 'Email', href: 'mailto:hello@kammit.dev', value: 'hello@kammit.dev' },
  { label: 'GitHub', href: 'https://github.com/', value: 'github.com/you' },
  { label: 'LinkedIn', href: 'https://linkedin.com/', value: 'linkedin.com/in/you' },
];

export default function Contact() {
  return (
    <SunsetScene className="contact section-zone" id="contact">
      <div className="container">
        <h2 className="section-title">Connect.exe</h2>
        <p className="contact-cta">Want to work together? Let's chat!</p>

        <PixelWindow title="Contact Me.exe" className="contact-window">
          <p className="contact-text">
            Open to interesting projects and good coffee chats.
            Elvis says hire his human.
          </p>
          <ul className="contact-terminal">
            {links.map((link) => (
              <li key={link.label}>
                <a href={link.href} target={link.href.startsWith('mailto') ? undefined : '_blank'} rel="noreferrer">
                  &gt; {link.label}: {link.value}
                </a>
              </li>
            ))}
          </ul>
          <p className="contact-ps">P.S. Elvis says hire my human. Mrrrp.</p>
        </PixelWindow>
      </div>
    </SunsetScene>
  );
}
