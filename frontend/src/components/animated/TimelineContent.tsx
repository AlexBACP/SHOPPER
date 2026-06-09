'use client';

/**
 * TimelineContent — Adaptado de "timeline-animation" (21st.dev / ui-layouts).
 *
 * Wrapper genérico que revela su contenido con una secuencia kinética
 * (blur → focus, y desplazamiento sutil) cuando entra al viewport, usando
 * `useInView` de framer-motion. Cada hijo de la misma `timelineRef` puede
 * recibir un `animationNum` distinto para escalonar la entrada.
 *
 * Defaults ajustados a las guidelines ui-ux-pro-max:
 *   · stagger 120 ms por item (en lugar de los 500 ms originales que se sentían lentos)
 *   · easing natural ease-out  (cubic-bezier .22 .61 .36 1)
 *   · duración 550 ms — entra "in 300 ms" cumple regla micro-interactions
 *   · respeta `prefers-reduced-motion` vía MotionConfig del layout padre
 */

import { type HTMLMotionProps, motion, useInView } from 'framer-motion';
import type React from 'react';
import type { Variants } from 'framer-motion';

type TimelineContentProps<T extends keyof HTMLElementTagNameMap> = {
  children?:       React.ReactNode;
  animationNum:    number;
  className?:      string;
  timelineRef:     React.RefObject<HTMLElement | null>;
  as?:             T;
  customVariants?: Variants;
  /** Si true, sólo se anima la primera vez que entra al viewport (no se repite). */
  once?:           boolean;
  /** Margen para activar (ej: '-80px' para activar antes de tocar el borde) */
  viewportMargin?: string;
} & HTMLMotionProps<T>;

export function TimelineContent<T extends keyof HTMLElementTagNameMap = 'div'>({
  children,
  animationNum,
  timelineRef,
  className,
  as,
  customVariants,
  once = true,
  viewportMargin = '0px',
  ...props
}: TimelineContentProps<T>) {
  const defaultSequenceVariants: Variants = {
    visible: (i: number) => ({
      filter: 'blur(0px)',
      y: 0,
      opacity: 1,
      transition: {
        delay: i * 0.12,
        duration: 0.55,
        ease: [0.22, 0.61, 0.36, 1],
      },
    }),
    hidden: {
      filter: 'blur(12px)',
      y: 18,
      opacity: 0,
    },
  };

  const sequenceVariants = customVariants || defaultSequenceVariants;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isInView = useInView(timelineRef as any, { once, margin: viewportMargin as any });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MotionComponent = motion[(as ?? 'div') as keyof typeof motion] as React.ElementType;

  return (
    <MotionComponent
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      custom={animationNum}
      variants={sequenceVariants}
      className={className}
      {...props}
    >
      {children}
    </MotionComponent>
  );
}

export default TimelineContent;
