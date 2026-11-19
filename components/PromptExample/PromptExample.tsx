import type React from 'react';
import './PromptExample.css';

interface PromptExampleProps {
  /** The wording to show as if it had been typed into the assistant's field. */
  children: React.ReactNode;
}

/**
 * Renders an example request as a replica of the OVHai Workspace assistant
 * field: the thick blue-to-lavender gradient border and the rounded send
 * button the product uses. It shows the reader where the wording goes, which
 * a quoted list cannot do.
 *
 * Purely illustrative: no form control, nothing focusable, so it never
 * competes with the page's real interactive elements for keyboard order.
 */
export function PromptExample({ children }: PromptExampleProps) {
  return (
    <div className="prompt-example">
      <p className="prompt-example__text">{children}</p>
      <span className="prompt-example__send">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden={true}
          focusable="false"
        >
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </span>
    </div>
  );
}

export default PromptExample;
