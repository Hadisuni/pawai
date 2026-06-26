'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function InteractionEngine() {
  const pathname = usePathname();
  const globalInit = useRef(false);
  const ringHWRef = useRef(17);

  // Global, page-independent setup (cursor, particles, scroll parallax) — runs once.
  useEffect(() => {
    if (globalInit.current) return;
    globalInit.current = true;

    const NO_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const HAS_FINE_POINTER = window.matchMedia('(pointer: fine)').matches;

    const cDot = document.getElementById('c-dot');
    const cRing = document.getElementById('c-ring');
    const cGlow = document.getElementById('glow');

    if (cDot && cRing && cGlow && HAS_FINE_POINTER) {
      let mx = window.innerWidth / 2;
      let my = window.innerHeight / 2;
      let rx = mx, ry = my;

      document.addEventListener('mousemove', (e) => {
        mx = e.clientX;
        my = e.clientY;
        cDot.style.transform = `translate(${mx - 3.5}px,${my - 3.5}px)`;
        cGlow.style.transform = `translate(${mx - 450}px,${my - 450}px)`;
      }, { passive: true });

      const animRing = () => {
        rx += (mx - rx) * 0.11;
        ry += (my - ry) * 0.11;
        cRing.style.transform = `translate(${rx - ringHWRef.current}px,${ry - ringHWRef.current}px)`;
        requestAnimationFrame(animRing);
      };
      animRing();

      document.addEventListener('mousedown', () => { cRing.classList.add('press'); ringHWRef.current = 13; });
      document.addEventListener('mouseup', () => { cRing.classList.remove('press'); ringHWRef.current = 17; });
    }

    // Particles
    if (!NO_MOTION) {
      const canvas = document.getElementById('pts') as HTMLCanvasElement | null;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        let W = 0, H = 0;
        const isMobile = window.innerWidth < 768;
        const N = isMobile ? 14 : 28;
        const MAX_D = 80;
        const MAX_D2 = MAX_D * MAX_D;
        let paused = false;

        const rootStyle = getComputedStyle(document.documentElement);
        const tealC = rootStyle.getPropertyValue('--teal-rgb').trim() || '46,220,168';
        const peachC = rootStyle.getPropertyValue('--peach-rgb').trim() || '240,145,90';

        const resize = () => {
          W = canvas.width = window.innerWidth;
          H = canvas.height = window.innerHeight;
        };
        resize();

        let resizeRaf: number | null = null;
        window.addEventListener('resize', () => {
          if (!resizeRaf) resizeRaf = requestAnimationFrame(() => { resize(); resizeRaf = null; });
        }, { passive: true });

        document.addEventListener('visibilitychange', () => { paused = document.hidden; });

        class Pt {
          x = 0; y = 0; r = 0; vx = 0; vy = 0; a = 0; c = '';
          constructor() { this.reset(); }
          reset() {
            this.x = Math.random() * W;
            this.y = Math.random() * H;
            this.r = Math.random() * 1.4 + 0.4;
            this.vx = (Math.random() - 0.5) * 0.28;
            this.vy = (Math.random() - 0.5) * 0.28;
            this.a = Math.random() * 0.38 + 0.08;
            this.c = Math.random() > 0.62 ? peachC : tealC;
          }
          step() {
            this.x += this.vx; this.y += this.vy;
            if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
          }
          draw() {
            ctx!.beginPath();
            ctx!.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx!.fillStyle = `rgba(${this.c},${this.a})`;
            ctx!.fill();
          }
        }

        const pts: Pt[] = [];
        for (let i = 0; i < N; i++) pts.push(new Pt());

        // Purely decorative — capped well under display refresh rate so it doesn't
        // compete with real work on 120Hz+ screens.
        const FRAME_MS = 1000 / 30;
        let lastFrame = 0;

        const animPts = (now: number) => {
          requestAnimationFrame(animPts);
          if (paused) return;
          if (now - lastFrame < FRAME_MS) return;
          lastFrame = now;
          ctx.clearRect(0, 0, W, H);
          for (let i = 0; i < pts.length; i++) { pts[i].step(); pts[i].draw(); }
          if (!isMobile) {
            for (let i = 0; i < pts.length; i++) {
              for (let j = i + 1; j < pts.length; j++) {
                const ddx = pts[i].x - pts[j].x;
                const ddy = pts[i].y - pts[j].y;
                const d2 = ddx * ddx + ddy * ddy;
                if (d2 < MAX_D2) {
                  ctx.beginPath();
                  ctx.moveTo(pts[i].x, pts[i].y);
                  ctx.lineTo(pts[j].x, pts[j].y);
                  ctx.strokeStyle = `rgba(${tealC},${(1 - Math.sqrt(d2) / MAX_D) * 0.07})`;
                  ctx.lineWidth = 0.5;
                  ctx.stroke();
                }
              }
            }
          }
        };
        requestAnimationFrame(animPts);
      }
    } else {
      const cv = document.getElementById('pts');
      if (cv) cv.style.display = 'none';
    }

    // Scroll parallax (hero) — re-queries the element on every scroll, harmless on pages without it.
    if (!NO_MOTION) {
      let pending = false;
      window.addEventListener('scroll', () => {
        if (!pending) {
          pending = true;
          requestAnimationFrame(() => {
            const heroGrid = document.querySelector<HTMLElement>('.hero__grid');
            if (heroGrid) heroGrid.style.transform = `translateY(${window.scrollY * 0.06}px)`;
            pending = false;
          });
        }
      }, { passive: true });
    }
  }, []);

  // Element bindings (hover targets, magnetic buttons, tilt cards, scroll reveal).
  // Re-scans on every route change AND whenever new matching elements are added to the
  // DOM later (e.g. a component that mounts behind a button click, not at page load).
  useEffect(() => {
    const NO_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cRing = document.getElementById('c-ring');
    const cleanups: Array<() => void> = [];
    const bound = new WeakSet<Element>();

    const revObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('vis'); revObs.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -36px 0px' });

    function bindHover(el: HTMLElement) {
      if (!cRing) return;
      const onEnter = () => { cRing.classList.add('hov'); ringHWRef.current = 27; };
      const onLeave = () => { cRing.classList.remove('hov'); ringHWRef.current = 17; };
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
      cleanups.push(() => {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
      });
    }

    function bindMagnetic(el: HTMLElement) {
      let dx = 0, dy = 0, raf: number | null = null;
      const onMove = (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        dx = e.clientX - (r.left + r.width / 2);
        dy = e.clientY - (r.top + r.height / 2);
        if (!raf) raf = requestAnimationFrame(() => {
          el.style.transform = `translate(${dx * 0.2}px,${dy * 0.2}px)`;
          el.style.transition = 'transform .08s';
          raf = null;
        });
      };
      const onLeave = () => {
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        el.style.transform = '';
        el.style.transition = 'transform .6s cubic-bezier(.34,1.56,.64,1)';
      };
      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', onLeave);
      cleanups.push(() => {
        el.removeEventListener('mousemove', onMove);
        el.removeEventListener('mouseleave', onLeave);
      });
    }

    function bindTilt(el: HTMLElement) {
      let lx = 0, ly = 0, raf: number | null = null;
      const onMove = (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        lx = (e.clientX - r.left) / r.width - 0.5;
        ly = (e.clientY - r.top) / r.height - 0.5;
        if (!raf) raf = requestAnimationFrame(() => {
          el.style.transform = `perspective(900px) rotateX(${-ly * 7}deg) rotateY(${lx * 7}deg) translateY(-4px) scale(1.01)`;
          el.style.transition = 'transform .06s';
          const cg = el.querySelector<HTMLElement>('.cg');
          if (cg) { cg.style.left = `${(lx + 0.5) * 100}%`; cg.style.top = `${(ly + 0.5) * 100}%`; }
          raf = null;
        });
      };
      const onLeave = () => {
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        el.style.transform = '';
        el.style.transition = 'transform .75s cubic-bezier(.34,1.56,.64,1)';
      };
      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', onLeave);
      cleanups.push(() => {
        el.removeEventListener('mousemove', onMove);
        el.removeEventListener('mouseleave', onLeave);
      });
    }

    function bindReveal(el: Element) {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight + 60) {
        el.classList.add('instant', 'vis');
        requestAnimationFrame(() => el.classList.remove('instant'));
      } else {
        revObs.observe(el);
      }
    }

    // `root` itself is included in matches (not just descendants) so a mutation-added
    // node that itself has e.g. [data-r] gets caught, not only its children.
    function matchesIncludingSelf(root: Document | Element, selector: string): Element[] {
      const found = Array.from(root.querySelectorAll(selector));
      if (root instanceof Element && root.matches(selector)) found.push(root);
      return found;
    }

    function scan(root: Document | Element) {
      matchesIncludingSelf(root, 'a,button,[data-tilt]').forEach((el) => {
        if (bound.has(el) || !(el instanceof HTMLElement)) return;
        bound.add(el);
        bindHover(el);
        if (!NO_MOTION && el.hasAttribute('data-tilt')) bindTilt(el);
      });
      if (!NO_MOTION) {
        matchesIncludingSelf(root, '[data-mag]').forEach((el) => {
          if (bound.has(el) || !(el instanceof HTMLElement)) return;
          bound.add(el);
          bindMagnetic(el);
        });
      }
      matchesIncludingSelf(root, '[data-r]').forEach((el) => {
        if (bound.has(el)) return;
        bound.add(el);
        bindReveal(el);
      });
    }

    scan(document);

    const mutObs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;
          scan(node as Element);
        });
      }
    });
    mutObs.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutObs.disconnect();
      cleanups.forEach((fn) => fn());
      revObs.disconnect();
    };
  }, [pathname]);

  return null;
}
