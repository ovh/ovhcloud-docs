import { withBase } from '@rspress/core/runtime';
import { useEffect, useRef, useState } from 'react';

interface GuidedTourProps {
  src: string;
  title: string;
}

export function GuidedTour({ src, title }: GuidedTourProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      const data = e.data as { type?: string; height?: number } | null;
      if (
        data?.type === 'ovh-guided-tour:height' &&
        typeof data.height === 'number'
      ) {
        setHeight(data.height);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      src={withBase(src)}
      scrolling="no"
      title={title}
      allowFullScreen
      style={{
        width: '100%',
        ...(height ? { height: `${height}px` } : { aspectRatio: '16 / 10' }),
        borderWidth: '0 0 10px 0',
        borderStyle: 'solid',
        borderColor: '#030712',
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'block',
      }}
    />
  );
}
