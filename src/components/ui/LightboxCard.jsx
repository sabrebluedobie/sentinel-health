import './LightboxCard.css';

export default function LightboxCard({ kind = 'sleep', title, children, footer }) {
  return (
    <section className={`lightbox ${kind}`} role="region" aria-label={title} style={{ padding: 16 }}>
      {title && <h3 style={{ margin: 0 }}>{title}</h3>}
      <div style={{ height: 8 }} />
      {children}
      {footer && <div style={{ marginTop: 12 }}>{footer}</div>}
    </section>
  );
}