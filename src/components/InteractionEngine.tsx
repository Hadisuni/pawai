'use client';

import { useEffect, useRef } from 'react';

export default function InteractionEngine() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const NO_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const cDot = document.getElementById('c-dot');
    const cRing = document.getElementById('c-ring');
    const cGlow = document.getElementById('glow');

    if (!cDot || !cRing || !cGlow) return;

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx, ry = my;
    let ringHW = 17;

    document.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      cDot.style.transform = `translate(${mx - 3.5}px,${my - 3.5}px)`;
      cGlow.style.transform = `translate(${mx - 450}px,${my - 450}px)`;
    }, { passive: true });

    const animRing = () => {
      rx += (mx - rx) * 0.11;
      ry += (my - ry) * 0.11;
      cRing.style.transform = `translate(${rx - ringHW}px,${ry - ringHW}px)`;
      requestAnimationFrame(animRing);
    };
    animRing();

    document.querySelectorAll<HTMLElement>('a,button,[data-tilt]').forEach((el) => {
      el.addEventListener('mouseenter', () => { cRing.classList.add('hov'); ringHW = 27; });
      el.addEventListener('mouseleave', () => { cRing.classList.remove('hov'); ringHW = 17; });
    });

    document.addEventListener('mousedown', () => { cRing.classList.add('press'); ringHW = 13; });
    document.addEventListener('mouseup', () => { cRing.classList.remove('press'); ringHW = 17; });

    // Magnetic buttons
    if (!NO_MOTION) {
      document.querySelectorAll<HTMLElement>('[data-mag]').forEach((el) => {
        let dx = 0, dy = 0, raf: number | null = null;
        el.addEventListener('mousemove', (e) => {
          const r = el.getBoundingClientRect();
          dx = e.clientX - (r.left + r.width / 2);
          dy = e.clientY - (r.top + r.height / 2);
          if (!raf) raf = requestAnimationFrame(() => {
            el.style.transform = `translate(${dx * 0.2}px,${dy * 0.2}px)`;
            el.style.transition = 'transform .08s';
            raf = null;
          });
        });
        el.addEventListener('mouseleave', () => {
          if (raf) { cancelAnimationFrame(raf); raf = null; }
          el.style.transform = '';
          el.style.transition = 'transform .6s cubic-bezier(.34,1.56,.64,1)';
        });
      });
    }

    // Card tilt
    if (!NO_MOTION) {
      document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((el) => {
        let lx = 0, ly = 0, raf: number | null = null;
        el.addEventListener('mousemove', (e) => {
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
        });
        el.addEventListener('mouseleave', () => {
          if (raf) { cancelAnimationFrame(raf); raf = null; }
          el.style.transform = '';
          el.style.transition = 'transform .75s cubic-bezier(.34,1.56,.64,1)';
        });
      });
    }

    // Scroll reveal
    const revObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('vis'); revObs.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -36px 0px' });

    document.querySelectorAll('[data-r]').forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight + 60) {
        el.classList.add('instant', 'vis');
        requestAnimationFrame(() => el.classList.remove('instant'));
      } else {
        revObs.observe(el);
      }
    });

    // Particles
    if (!NO_MOTION) {
      const canvas = document.getElementById('pts') as HTMLCanvasElement | null;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let W = 0, H = 0;
      const isMobile = window.innerWidth < 768;
      const N = isMobile ? 18 : 42;
      const MAX_D = 80;
      const MAX_D2 = MAX_D * MAX_D;
      let paused = false;

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
          this.c = Math.random() > 0.62 ? '240,145,90' : '46,220,168';
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

      const animPts = () => {
        requestAnimationFrame(animPts);
        if (paused) return;
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
                ctx.strokeStyle = `rgba(46,220,168,${(1 - Math.sqrt(d2) / MAX_D) * 0.07})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
              }
            }
          }
        }
      };
      animPts();
    } else {
      const cv = document.getElementById('pts');
      if (cv) cv.style.display = 'none';
    }

    // Scroll parallax (hero)
    if (!NO_MOTION) {
      const heroGrid = document.querySelector<HTMLElement>('.hero__grid');
      let pending = false;
      window.addEventListener('scroll', () => {
        if (!pending) {
          pending = true;
          requestAnimationFrame(() => {
            const y = window.scrollY;
            if (heroGrid) heroGrid.style.transform = `translateY(${y * 0.06}px)`;
            pending = false;
          });
        }
      }, { passive: true });
    }
  }, []);

  return null;
}
