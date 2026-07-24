import './PixelScene.css';

const CLOUDS = [
  { id: 'a', top: '8%', size: 'md', duration: 48, delay: 0 },
  { id: 'b', top: '18%', size: 'lg', duration: 62, delay: -18 },
  { id: 'c', top: '5%', size: 'sm', duration: 38, delay: -8 },
  { id: 'd', top: '14%', size: 'md', duration: 55, delay: -30 },
  { id: 'e', top: '22%', size: 'sm', duration: 42, delay: -22 },
];

function FloatingClouds({ className = '' }) {
  return (
    <div className={`floating-clouds ${className}`} aria-hidden="true">
      {CLOUDS.map((cloud) => (
        <div
          key={cloud.id}
          className={`drift-cloud drift-cloud-${cloud.size}`}
          style={{
            top: cloud.top,
            animationDuration: `${cloud.duration}s`,
            animationDelay: `${cloud.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

export function SkyScene({ children, className = '', ...props }) {
  return (
    <div className={`pixel-scene sky-scene ${className}`} {...props}>
      <FloatingClouds />
      {children}
    </div>
  );
}

export function MountainScene({ children, className = '', ...props }) {
  return (
    <div className={`pixel-scene mountain-scene ${className}`} {...props}>
      <FloatingClouds className="clouds-subtle" />
      <div className="scene-mountains" aria-hidden="true">
        <div className="mountain m1" />
        <div className="mountain m2" />
        <div className="mountain m3" />
        <div className="scene-water" />
      </div>
      {children}
    </div>
  );
}

export function SunsetScene({ children, className = '', ...props }) {
  return (
    <div className={`pixel-scene sunset-scene ${className}`} {...props}>
      <FloatingClouds className="clouds-faded" />
      <div className="scene-sunset" aria-hidden="true">
        <div className="star s1" />
        <div className="star s2" />
        <div className="star s3" />
        <div className="sun" />
        <div className="horizon" />
      </div>
      {children}
    </div>
  );
}
