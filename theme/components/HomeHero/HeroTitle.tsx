import { Fragment } from 'react';

/**
 * A hero title: its text (an explicit line break is kept: `\n` in the
 * frontmatter), then the highlighted word in the DOCS gradient and the
 * terminal cursor `_`, as in the prototype ("… in the DOCS_").
 */
export function HeroTitle({
  text,
  highlight,
}: {
  text?: string;
  highlight?: string;
}) {
  const lines = (text ?? '').split('\n');
  return (
    <>
      {lines.map((line, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static title lines, never reordered
        <Fragment key={`${i}-${line}`}>
          {i > 0 && <br />}
          {line}
        </Fragment>
      ))}
      {highlight && (
        <>
          {text ? ' ' : null}
          <span className="ovh-hero__hl">{highlight}</span>
          <span className="ovh-hero__cursor" aria-hidden="true">
            _
          </span>
        </>
      )}
    </>
  );
}
