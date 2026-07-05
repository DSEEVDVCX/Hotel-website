"use client";

import { useEffect, useRef, useState } from "react";

interface Thread {
  pos: { x: number; y: number };
  prevPos: { x: number; y: number };
  angle: number;
  speed: number;
  life: number;
  maxLife: number;
  width: number;
}

export default function GenerativeHeroBackground({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let sketchRef: { remove: () => void } | null = null;
    let p5Instance:
      | { remove: () => void; loop: () => void; noLoop: () => void; draw: () => void }
      | null = null;
    let io: IntersectionObserver | null = null;
    let onVisibility: (() => void) | null = null;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    (async () => {
      if (!containerRef.current) return;
      const { default: P5 } = await import("p5");

      const sketch = (p: InstanceType<typeof P5>) => {
      let threads: Thread[] = [];
      let seed = 7321;
      let t = 0;

      const THREAD_COUNT = 60;

      function respawn(thread: Thread) {
        thread.pos = { x: p.random(p.width), y: p.random(p.height) };
        thread.prevPos = { x: thread.pos.x, y: thread.pos.y };
        thread.angle = p.random(p.TWO_PI);
        thread.speed = p.random(0.5, 2.2);
        thread.maxLife = p.random(150, 400);
        thread.life = thread.maxLife;
        thread.width = p.random(0.4, 1.8);
      }

      // Smooth curl-noise field — silk-like flowing currents
      function curlAngle(x: number, y: number): number {
        const scale = 0.0025;
        const n = p.noise(x * scale, y * scale, t * 0.0008);
        return n * p.TWO_PI * 2;
      }

      p.setup = () => {
        const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
        canvas.parent(containerRef.current!);
        // Cap to 1 logical pixel per CSS pixel — a background field doesn't
        // need Retina density, and 2x density means 4x the per-frame cost.
        p.pixelDensity(1);
        p.randomSeed(seed);
        p.noiseSeed(seed);
        p.background(12, 10, 7);
        threads = [];
        for (let i = 0; i < THREAD_COUNT; i++) {
          const thread: Thread = {
            pos: { x: 0, y: 0 },
            prevPos: { x: 0, y: 0 },
            angle: 0,
            speed: 0,
            life: 0,
            maxLife: 0,
            width: 0,
          };
          respawn(thread);
          threads.push(thread);
        }
      };

      p.draw = () => {
        t++;

        // Very slow fade — trails persist elegantly
        p.noStroke();
        p.fill(12, 10, 7, 8);
        p.blendMode(p.BLEND);
        p.rect(0, 0, p.width, p.height);
        p.blendMode(p.ADD);

        for (const thread of threads) {
          thread.prevPos = { x: thread.pos.x, y: thread.pos.y };

          // Follow curl-noise field for silk-like flow
          const targetAngle = curlAngle(thread.pos.x, thread.pos.y);
          // Smooth steering
          let diff = targetAngle - thread.angle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          thread.angle += diff * 0.08;

          thread.pos.x += Math.cos(thread.angle) * thread.speed;
          thread.pos.y += Math.sin(thread.angle) * thread.speed;
          thread.life--;

          const lifeRatio = thread.life / thread.maxLife;
          // Smooth fade in and out
          const alpha = Math.sin(lifeRatio * Math.PI) * 70;

          // Color: mostly gold, some emerald, varies by position
          const noiseVal = p.noise(thread.pos.x * 0.002, thread.pos.y * 0.002);
          let r: number, g: number, b: number;
          if (noiseVal > 0.6) {
            // Emerald threads
            r = 26; g = 92; b = 69;
          } else if (noiseVal > 0.45) {
            // Mixed gold-emerald
            r = 120; g = 140; b = 95;
          } else {
            // Gold threads (majority)
            r = 212; g = 184; b = 120;
          }

          p.stroke(r, g, b, alpha);
          p.strokeWeight(thread.width);
          p.line(thread.prevPos.x, thread.prevPos.y, thread.pos.x, thread.pos.y);

          if (thread.life <= 0 || thread.pos.x < -50 || thread.pos.x > p.width + 50 || thread.pos.y < -50 || thread.pos.y > p.height + 50) {
            respawn(thread);
          }
        }
      };

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        p.background(12, 10, 7);
      };
    };

      const node = containerRef.current;
      p5Instance = new P5(sketch, node ?? undefined);
      sketchRef = p5Instance;

      // Honor reduced-motion: render a single static frame, no loop.
      if (prefersReducedMotion) {
        p5Instance.draw();
        p5Instance.noLoop();
        setLoaded(true);
        return;
      }

      // Only animate while the hero is actually on-screen. Scrolling past it
      // (or backgrounding the tab) stops the loop so it never burns a core
      // in the background.
      let onScreen = true;
      const syncRunning = () => {
        const shouldRun = onScreen && !document.hidden;
        if (!p5Instance) return;
        if (shouldRun) p5Instance.loop();
        else p5Instance.noLoop();
      };

      if (node && "IntersectionObserver" in window) {
        io = new IntersectionObserver(
          ([entry]) => {
            onScreen = entry.isIntersecting;
            syncRunning();
          },
          { threshold: 0 }
        );
        io.observe(node);
      }

      onVisibility = () => syncRunning();
      document.addEventListener("visibilitychange", onVisibility);

      setLoaded(true);
    })();

    return () => {
      io?.disconnect();
      if (onVisibility) document.removeEventListener("visibilitychange", onVisibility);
      sketchRef?.remove();
      sketchRef = null;
      p5Instance = null;
    };
  }, []);

  return <div ref={containerRef} className={`${className} ${loaded ? "" : "opacity-0"}`} aria-hidden />;
}
