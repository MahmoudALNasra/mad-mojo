/**
 * The Mad Mojo mark: a small sun with a calm face and circles on its cheeks.
 * Recreated as an SVG from the embroidered emblem — swap with the final
 * artwork file anytime by editing this component.
 */
export function SunLogo({
  className = "h-9 w-9",
  color = "currentColor",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      {/* rays */}
      <g stroke={color} strokeWidth="4.5" strokeLinecap="round">
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          const x1 = 50 + Math.cos(angle) * 34;
          const y1 = 50 + Math.sin(angle) * 34;
          const x2 = 50 + Math.cos(angle) * (i % 2 === 0 ? 46 : 42);
          const y2 = 50 + Math.sin(angle) * (i % 2 === 0 ? 46 : 42);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
      </g>
      {/* face disc */}
      <circle cx="50" cy="50" r="27" stroke={color} strokeWidth="4.5" />
      {/* closed happy eyes */}
      <path
        d="M38 47 q4 5 8 0"
        stroke={color}
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <path
        d="M54 47 q4 5 8 0"
        stroke={color}
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      {/* circles on the cheeks */}
      <circle cx="37.5" cy="57" r="4.4" stroke={color} strokeWidth="2.6" />
      <circle cx="62.5" cy="57" r="4.4" stroke={color} strokeWidth="2.6" />
      {/* small smile */}
      <path
        d="M45.5 63 q4.5 4 9 0"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
