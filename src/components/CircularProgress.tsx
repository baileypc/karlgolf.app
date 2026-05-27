

interface CircularProgressProps {
  value: number; // Percentage (0-100)
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  sublabel?: string;
}

export default function CircularProgress({
  value,
  size = 180,
  strokeWidth = 14,
  color = '#DDEDD2',
  label,
  sublabel
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(221, 237, 210, 0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 1s ease-in-out',
            filter: 'drop-shadow(0 0 8px rgba(221, 237, 210, 0.6))'
          }}
        />
      </svg>
      {/* Content inside the ring */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {label && (
          <span style={{ fontSize: `${size * 0.22}px`, fontWeight: '700', color: '#DDEDD2', lineHeight: '1.1' }}>
            {label}
          </span>
        )}
        {sublabel && (
          <span style={{ fontSize: `${size * 0.08}px`, opacity: 0.6, marginTop: '4px' }}>
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
