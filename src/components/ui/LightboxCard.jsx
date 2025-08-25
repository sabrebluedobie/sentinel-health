import React from 'react';
import './lightbox.css';

export default function LightboxCard({ kind = 'default', title, children }) {
  return (
    <section className={`lightbox lightbox--${kind}`}>
      {title ? <header className="lightbox__title">{title}</header> : null}
      <div className="lightbox__body">{children}</div>
    </section>
  );
}