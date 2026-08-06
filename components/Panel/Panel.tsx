import type { ReactNode } from 'react';
import './Panel.css';

interface PanelProps {
  children: ReactNode;
}

/**
 * A lightly shaded, rounded container that visually delimits a self-contained
 * block of content (e.g. the "Identify your email technology" zone). Uses
 * Rspress CSS variables so it adapts to the light/dark theme. Inner cards get
 * an opaque background so they stand out against the panel's tint.
 */
export function Panel({ children }: PanelProps) {
  return <section className="doc-panel">{children}</section>;
}

export default Panel;
