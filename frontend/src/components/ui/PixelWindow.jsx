import './PixelWindow.css';

export default function PixelWindow({
  title,
  children,
  className = '',
  compact = false,
  icon = '✿',
}) {
  return (
    <div className={`pixel-window ${compact ? 'compact' : ''} ${className}`}>
      <div className="pixel-window-titlebar">
        <span className="pixel-window-title">{title}</span>
        <span className="pixel-window-icon">{icon}</span>
        <div className="pixel-window-controls">
          <span className="ctrl-dot" />
          <span className="ctrl-dot" />
        </div>
      </div>
      <div className="pixel-window-body">{children}</div>
    </div>
  );
}
