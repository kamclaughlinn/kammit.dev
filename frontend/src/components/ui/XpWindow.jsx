import './XpWindow.css';

export default function XpWindow({ title, children, className = '' }) {
  return (
    <div className={`xp-window ${className}`}>
      <div className="xp-titlebar">
        <span className="xp-title">{title}</span>
        <div className="xp-controls" aria-hidden="true">
          <button type="button" className="xp-btn xp-min" tabIndex={-1}>_</button>
          <button type="button" className="xp-btn xp-max" tabIndex={-1}>□</button>
          <button type="button" className="xp-btn xp-close" tabIndex={-1}>×</button>
        </div>
      </div>
      <div className="xp-body">{children}</div>
    </div>
  );
}
