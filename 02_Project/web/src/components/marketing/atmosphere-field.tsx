"use client";

import { useEffect, useRef } from "react";

const PARTICLE_COUNT = 180;

// Mostly calm teal, a few amber, a rare orange — this isn't decorative
// color variety, it's the product's own severity language (teal = normal,
// amber = monitor, orange = escalate). A sea of quiet signals with a rare
// one that flares up is literally what the detection engine looks for.
const TEAL = "94, 216, 200";
const AMBER = "244, 185, 66";
const ORANGE = "242, 121, 60";

type Particle = {
  x: number;
  y: number;
  depth: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
};

function pickColor(): string {
  const r = Math.random();
  if (r < 0.82) return TEAL;
  if (r < 0.96) return AMBER;
  return ORANGE;
}

export default function AtmosphereField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = 1;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => {
      const depth = 0.2 + Math.random() * 0.8;
      return {
        x: Math.random(),
        y: Math.random(),
        depth,
        vx: (Math.random() - 0.5) * 0.00015 * depth,
        vy: (Math.random() - 0.5) * 0.00015 * depth,
        radius: 0.6 + depth * 1.4,
        color: pickColor(),
      };
    });

    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    const onPointerMove = (e: PointerEvent) => {
      targetMouseX = (e.clientX / width - 0.5) * 2;
      targetMouseY = (e.clientY / height - 0.5) * 2;
    };

    let scrollT = 0;
    let targetScrollT = 0;
    let scrollTicking = false;
    const readScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      targetScrollT = max > 0 ? doc.scrollTop / max : 0;
      scrollTicking = false;
    };
    const onScroll = () => {
      if (scrollTicking) return;
      scrollTicking = true;
      requestAnimationFrame(readScroll);
    };

    let rafId = 0;
    let frame = 0;
    const draw = () => {
      rafId = requestAnimationFrame(draw);
      frame++;
      if (frame % 2 !== 0) return;

      mouseX += (targetMouseX - mouseX) * 0.03;
      mouseY += (targetMouseY - mouseY) * 0.03;
      scrollT += (targetScrollT - scrollT) * 0.06;

      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.vx * 2;
        p.y += p.vy * 2;
        if (p.x < 0) p.x = 1;
        if (p.x > 1) p.x = 0;
        if (p.y < 0) p.y = 1;
        if (p.y > 1) p.y = 0;

        const parallaxX = mouseX * 0.015 * p.depth;
        const parallaxY = mouseY * 0.008 * p.depth - scrollT * 0.05 * p.depth;

        const px = (p.x + parallaxX) * width;
        const py = (p.y + parallaxY) * height;

        ctx.beginPath();
        ctx.arc(px, py, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${0.25 + p.depth * 0.4})`;
        ctx.fill();
      }
    };

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    readScroll();
    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
    />
  );
}
