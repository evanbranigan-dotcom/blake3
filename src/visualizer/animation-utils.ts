/**
 * Shared animation utilities for all three visualizers.
 * Easing, canvas helpers, autoplay, reduced motion, watermark.
 */

// ── Easing functions ──

/** Decelerate into the finish — effortless, smooth landing */
export function easeOutQuad(t: number): number {
  return t * (2 - t);
}

/** Slight overshoot then settle — bouncy arrival */
export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

// ── Reduced motion ──

let _reducedMotion: boolean | null = null;

export function prefersReducedMotion(): boolean {
  if (_reducedMotion === null) {
    _reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return _reducedMotion;
}

// ── Canvas helpers ──

/** Set canvas dimensions for sharp rendering on HiDPI screens */
export function sizeCanvas(canvas: HTMLCanvasElement): void {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
}

/** Draw attribution watermark in bottom-right corner */
export function drawWatermark(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#444';
  ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText('blake3.loonlabs.dev', w - 8, h - 6);
  ctx.restore();
}

// ── Autoplay on scroll ──

/**
 * Trigger a callback once when an element scrolls into view.
 * Respects reduced motion: if enabled, fires callback immediately
 * with `instant: true` so the visualizer can skip to final state.
 */
export function autoplayOnScroll(
  el: HTMLElement,
  callback: (instant: boolean) => void,
  options?: { threshold?: number }
): void {
  const threshold = options?.threshold ?? 0.5;
  let fired = false;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !fired) {
          fired = true;
          observer.disconnect();
          callback(prefersReducedMotion());
        }
      }
    },
    { threshold }
  );

  observer.observe(el);
}

/**
 * Delayed autoplay for the hero section (top of page).
 * Fires after `delayMs` unless the user interacts first.
 * Returns a cancel function.
 */
export function autoplayWithDelay(
  delayMs: number,
  callback: (instant: boolean) => void,
  cancelOnFocus?: HTMLElement
): () => void {
  let fired = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const cancel = () => {
    fired = true;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  if (prefersReducedMotion()) {
    // Reduced motion: fire immediately with instant flag
    callback(true);
    fired = true;
    return cancel;
  }

  timer = setTimeout(() => {
    if (!fired) {
      fired = true;
      callback(false);
    }
  }, delayMs);

  // Cancel autoplay if user focuses the input
  if (cancelOnFocus) {
    cancelOnFocus.addEventListener('focus', cancel, { once: true });
  }

  return cancel;
}

// ── Section fade-in on scroll ──

export function fadeInOnScroll(elements: HTMLElement[]): void {
  if (prefersReducedMotion()) {
    elements.forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement;
          el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
          observer.unobserve(el);
        }
      }
    },
    { threshold: 0.3 }
  );

  elements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    observer.observe(el);
  });
}
