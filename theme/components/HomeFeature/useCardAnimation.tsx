import { type HTMLAttributes, useCallback, useRef, useState } from 'react';

interface Dimensions {
  width: number;
  height: number;
  top: number;
  left: number;
}

export const useCardAnimation = () => {
  const [pageX, setPageX] = useState<null | number>(null);
  const [pageY, setPageY] = useState<null | number>(null);
  const [isHovering, setIsHovering] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  // Cache layout reads performed once on hover enter — avoids forced reflow
  // on every mouse move (read during render caused ~150ms reflow per frame).
  const dimsRef = useRef<Dimensions | null>(null);

  const measureCard = useCallback(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    dimsRef.current = {
      width: rect.width,
      height: rect.height,
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
    };
  }, []);

  const handleMove = ({ pageX, pageY }: { pageX: number; pageY: number }) => {
    setPageX(pageX);
    setPageY(pageY);
  };

  const handleTouchMove = (evt: TouchEvent) => {
    evt.preventDefault();
    const { pageX, pageY } = evt.touches[0];
    handleMove({ pageX, pageY });
  };

  const handleEnter = () => {
    measureCard();
    setIsHovering(true);
  };
  const handleLeave = () => {
    setIsHovering(false);
  };

  let shine = '';
  let shineBg = '';
  let container = '';
  let outerContainer = '';

  const dims = dimsRef.current;
  if (pageX && pageY && dims && isHovering) {
    const { width: rootElemWidth, height: rootElemHeight, top, left } = dims;

    const wMultiple = 320 / rootElemWidth;
    const multiple = wMultiple * 0.05;
    const offsetX = 0.52 - (pageX - left) / rootElemWidth;
    const offsetY = 0.52 - (pageY - top) / rootElemHeight;
    const dy = pageY - top - rootElemHeight / 2;
    const dx = pageX - left - rootElemWidth / 2;
    const yRotate = (offsetX - dx) * multiple;
    const xRotate =
      (dy - offsetY) * (Math.min(rootElemWidth / rootElemHeight, 1) * multiple);
    const arad = Math.atan2(dy, dx);
    const rawAngle = (arad * 180) / Math.PI - 90;
    const angle = rawAngle < 0 ? rawAngle + 360 : rawAngle;

    shine = `translateX(${offsetX - 0.1}px) translateY(${offsetY - 0.1}px)`;
    shineBg = `linear-gradient(${angle}deg, rgba(255, 255, 255, ${
      ((pageY - top) / rootElemHeight) * 0.2
    }) 0%, rgba(255, 255, 255, 0) 50%)`;

    container = `rotateX(${xRotate}deg) rotateY(${yRotate}deg)`;
    outerContainer = `perspective(${rootElemWidth * 2}px)`;
  }

  const outerProps: HTMLAttributes<HTMLDivElement> = {
    style: {
      transform: outerContainer,
      transformStyle: 'preserve-3d',
    },
    onMouseEnter: handleEnter,
    onMouseLeave: handleLeave,
    onMouseMove: handleMove,
    onTouchMove: handleTouchMove,
    onTouchStart: handleEnter,
    onTouchEnd: handleLeave,
  };
  const outerRef = ref;

  const innerProps = {
    style: {
      transform: container,
    },
  };

  const shineDom = (
    <div
      className="rp-home-feature__item__shine"
      style={{
        position: 'absolute',
        userSelect: 'none',
        pointerEvents: 'none',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        borderRadius: '20px',
        zIndex: '8',
        ...(shine
          ? {
              transform: shine,
            }
          : {}),
        ...(shineBg
          ? {
              background: shineBg,
            }
          : {}),
      }}
    />
  );

  return {
    outerProps,
    outerRef,
    innerProps,
    shineDom,
  };
};
