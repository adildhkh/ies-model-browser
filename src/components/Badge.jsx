export default function Badge({ label, color, title }) {
  return (
    <span
      className="badge"
      title={title}
      style={{
        background: color + "22",
        color,
        borderColor: color + "44",
      }}
    >
      {label}
    </span>
  );
}
