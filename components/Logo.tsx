/** The หมาสนุก brand mark (round teal badge). */
export default function Logo({
  size = 40,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="หมาสนุก"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={`inline-block rounded-full ${className}`}
    />
  );
}
