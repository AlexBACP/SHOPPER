'use client'

import { useEffect, useRef, type RefObject } from 'react'
import {
  useScroll,
  useTransform,
  useSpring,
  useInView,
  useMotionValue,
  useReducedMotion,
  type MotionValue,
} from 'framer-motion'

/**
 * useParallaxY
 * Vertical parallax driven by scroll progress over the element.
 * - distance: pixels to travel from start to end (start: +distance, end: -distance).
 * - Respects prefers-reduced-motion: returns a static MotionValue(0).
 */
export function useParallaxY<T extends HTMLElement = HTMLDivElement>(
  distance: number = 100,
): { ref: RefObject<T | null>; y: MotionValue<number> } {
  const ref = useRef<T>(null)
  const prefersReducedMotion = useReducedMotion() ?? false

  const { scrollYProgress } = useScroll({
    target: ref as RefObject<HTMLElement>,
    offset: ['start end', 'end start'],
  })

  const yAnimated = useTransform(scrollYProgress, [0, 1], [distance, -distance])
  const yStatic = useMotionValue(0)

  return { ref, y: prefersReducedMotion ? yStatic : yAnimated }
}

/**
 * useStickyReveal
 * Boolean reveal when the element crosses a portion of the viewport.
 * - triggerOffset: 0..1 amount of element that must be visible (mapped to framer's `amount`).
 * - Triggers once; safe under reduced-motion (consumer decides how to animate).
 */
export function useStickyReveal<T extends HTMLElement = HTMLDivElement>(
  triggerOffset: number = 0.3,
): { ref: RefObject<T | null>; isRevealed: boolean } {
  const ref = useRef<T>(null)
  const clamped = Math.max(0, Math.min(1, triggerOffset))
  const isRevealed = useInView(ref as RefObject<HTMLElement>, {
    amount: clamped,
    once: true,
  })
  return { ref, isRevealed }
}

/**
 * useSectionScrollProgress
 * Scroll progress (0..1) over the referenced section.
 */
export function useSectionScrollProgress<T extends HTMLElement = HTMLDivElement>(): {
  ref: RefObject<T | null>
  scrollYProgress: MotionValue<number>
} {
  const ref = useRef<T>(null)
  const { scrollYProgress } = useScroll({
    target: ref as RefObject<HTMLElement>,
    offset: ['start end', 'end start'],
  })
  return { ref, scrollYProgress }
}

/**
 * useMouseParallax
 * Tracks the global mouse position and returns spring-smoothed {x, y} offsets.
 * - intensity: max pixel offset at the screen edges.
 * - Respects prefers-reduced-motion: no listener is attached and values stay at 0.
 */
export function useMouseParallax(intensity: number = 20): {
  x: MotionValue<number>
  y: MotionValue<number>
} {
  const prefersReducedMotion = useReducedMotion() ?? false

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const x = useSpring(mouseX, { stiffness: 150, damping: 15 })
  const y = useSpring(mouseY, { stiffness: 150, damping: 15 })

  useEffect(() => {
    if (prefersReducedMotion) return
    if (typeof window === 'undefined') return

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window
      const nx = (e.clientX / innerWidth - 0.5) * intensity
      const ny = (e.clientY / innerHeight - 0.5) * intensity
      mouseX.set(nx)
      mouseY.set(ny)
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [intensity, mouseX, mouseY, prefersReducedMotion])

  return { x, y }
}
