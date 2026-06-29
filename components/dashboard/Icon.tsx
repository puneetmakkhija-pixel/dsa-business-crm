type IconProps = {
  path: string;
  size?: number;
  stroke?: string;
  strokeWidth?: number;
};

/** Stroked, line-style icon matching the design's inline SVGs. */
export default function Icon({
  path,
  size = 20,
  stroke = "currentColor",
  strokeWidth = 2,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={path} />
    </svg>
  );
}
