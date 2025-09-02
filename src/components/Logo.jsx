export default function Logo({ size = 28 }) {
  return (
    <img
      src="/logo.png"        // put logo.png in /public
      alt="Sentinel Health"
      width={size}
      height={size}
      style={{ display: "block", borderRadius: 6 }}
    />
  );
}
