'use client';

/**
 * AnimatedNumber — contador animado que cuenta desde 0 hasta `value`
 * cuando entra al viewport. Para estadísticas de marketplace.
 *
 * <AnimatedNumber value={12000} prefix="" suffix="+" duration={2} />
 */

import { useEffect, useRef, useState } from 'react';
import { useInView, useMotionValue, useSpring } from 'framer-motion';

interface Props {
  value:     number;
  prefix?:   string;
  suffix?:   string;
  duration?: number;
  /** Formatear con miles (1.000) */
  format?:   boolean;
  className?: string;
}

export default function AnimatedNumber({
  value, prefix = '', suffix = '', duration = 1.8, format = true, className,
}: Props) {
  const ref       = useRef<HTMLSpanElement>(null);
  const inView    = useInView(ref, { once: true, margin: '-50px' });
  const motionVal = useMotionValue(0);
  const spring    = useSpring(motionVal, { duration: duration * 1000, bounce: 0 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (inView) motionVal.set(value);
  }, [inView, value, motionVal]);

  useEffect(() => spring.on('change', (v) => setDisplay(Math.round(v))), [spring]);

  const formatted = format
    ? new Intl.NumberFormat('es-CO').format(display)
    : String(display);

  return (
    <span ref={ref} className={className}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
