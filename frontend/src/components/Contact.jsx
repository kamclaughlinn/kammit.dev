import PixelWindow from './ui/PixelWindow';
import { SunsetScene } from './ui/PixelScene';
import './Contact.css';

const links = [
  { label: 'Email', href: 'mailto:kerryannemclaughlin6@gmail.com', value: 'kerryannemclaughlin6@gmail.com' },
  { label: 'LeetCode', href: 'https://leetcode.com/u/Robobleep/', value: 'https://leetcode.com/u/Robobleep/' },
  { label: 'LinkedIn', href: 'https://linkedin.com/', value: 'cba getting that rn' },
  { label: 'Codedex', href: 'https://www.codedex.io/@robobleep', value: 'https://www.codedex.io/@robobleep' },
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
          <p className="contact-ps">P.S. Elvis says hire my human. Mrrrp~.</p>
        </PixelWindow>
      </div>
    </SunsetScene>
  );
}
