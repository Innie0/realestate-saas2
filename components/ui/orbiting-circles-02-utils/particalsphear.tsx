'use client';

import { useEffect, useRef } from 'react';
import { useMotionReduced } from '@/lib/motion';

type Point3D = { x: number; y: number; z: number };

function fibonacciSphere(count: number, radius: number): Point3D[] {
  const points: Point3D[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i += 1) {
    const y = 1 - (i / (count - 1)) * 2;
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = golden * i;
    points.push({
      x: Math.cos(theta) * radiusAtY * radius,
      y: y * radius,
      z: Math.sin(theta) * radiusAtY * radius,
    });
  }

  return points;
}

export default function ParticleSphereAnimation() {
  const reduced = useMotionReduced();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const points = fibonacciSphere(140, 1);
    let frame = 0;
    let raf = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const size = Math.min(parent.clientWidth, parent.clientHeight);
      const dpr = window.devicePixelRatio || 1;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const size = canvas.clientWidth;
      const cx = size / 2;
      const cy = size / 2;
      const scale = size * 0.38;

      ctx.clearRect(0, 0, size, size);

      const rotY = frame * 0.004;
      const rotX = 0.35;

      const projected = points
        .map((p) => {
          const x1 = p.x * Math.cos(rotY) - p.z * Math.sin(rotY);
          const z1 = p.x * Math.sin(rotY) + p.z * Math.cos(rotY);
          const y2 = p.y * Math.cos(rotX) - z1 * Math.sin(rotX);
          const z2 = p.y * Math.sin(rotX) + z1 * Math.cos(rotX);
          return { x: x1, y: y2, z: z2 };
        })
        .sort((a, b) => a.z - b.z);

      for (const p of projected) {
        const depth = (p.z + 1.2) / 2.2;
        const alpha = 0.15 + depth * 0.55;
        const radius = 1 + depth * 2.2;
        ctx.beginPath();
        ctx.fillStyle = `rgba(28, 29, 34, ${alpha})`;
        ctx.arc(cx + p.x * scale, cy + p.y * scale, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduced) frame += 1;
      raf = window.requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.cancelAnimationFrame(raf);
    };
  }, [reduced]);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full"
      aria-hidden
    />
  );
}
