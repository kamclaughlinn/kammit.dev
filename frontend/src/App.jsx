import Hero from './components/Hero';
import About from './components/About';
import Skills from './components/Skills';
import Projects from './components/Projects';
import ElvisDigipet from './components/ElvisDigipet';
import ElvisChat from './components/ElvisChat';
import Contact from './components/Contact';
import Nav from './components/Nav';
import TouchCrosshair from './components/TouchCrosshair';
import './App.css';

export default function App() {
  return (
    <>
      <TouchCrosshair />
      <Nav />
      <main>
        <Hero />
        <About />
        <Skills />
        <Projects />
        <ElvisDigipet />
        <ElvisChat />
        <Contact />
      </main>
      <footer className="footer">
        <div className="container footer-inner">
          <span>Made with ☕, Java, and cat hair</span>
          <span className="paw">🐾</span>
          <span>© {new Date().getFullYear()} kammit.dev</span>
        </div>
      </footer>
    </>
  );
}
