import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  speed: number;
}

interface Planet {
  x: number;
  y: number;
  radius: number;
  color: string;
  orbitRadius: number;
  orbitSpeed: number;
  orbitAngle: number;
}

export const UniverseBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stars = useRef<Star[]>([]);
  const planets = useRef<Planet[]>([]);
  const animationFrameId = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    // Init stars
    stars.current = Array.from({ length: 150 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      z: Math.random(),
      size: Math.random() * 2 + 1,
      speed: Math.random() * 1.5 + 0.5,
    }));

    // Init planets
    const colors = ['#6495ED', '#FF4500', '#9400D3', '#FFD700', '#32CD32'];
    planets.current = Array.from({ length: 5 }, () => ({
      x: Math.random() * (canvas.width - 200) + 100,
      y: Math.random() * (canvas.height - 200) + 100,
      radius: Math.random() * 40 + 20,
      color: colors[Math.floor(Math.random() * colors.length)],
      orbitRadius: Math.random() * 70 + 80,
      orbitSpeed: Math.random() * 0.02 + 0.01,
      orbitAngle: Math.random() * Math.PI * 2,
    }));

    let angle = 0;

    const animate = () => {
      angle += 0.02;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#05050F');
      gradient.addColorStop(0.5, '#0F0F23');
      gradient.addColorStop(1, '#19192D');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw stars
      stars.current.forEach((s) => {
        const opacity = (Math.sin(angle * s.speed + s.x * 0.01) + 1) / 2 * 0.7 + 0.3;
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size / 2, 0, Math.PI * 2);
        ctx.fill();

        if (opacity > 0.8) {
          ctx.fillStyle = `rgba(135, 206, 250, ${opacity * 0.3})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size * 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw planets
      planets.current.forEach((p) => {
        p.orbitAngle += p.orbitSpeed;
        const ox = p.x + p.orbitRadius * Math.cos(p.orbitAngle);
        const oy = p.y + p.orbitRadius * Math.sin(p.orbitAngle);

        // Glow
        const glow = ctx.createRadialGradient(ox, oy, p.radius, ox, oy, p.radius + 10);
        glow.addColorStop(0, p.color + '32'); // 50 opacity in hex
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(ox, oy, p.radius + 10, 0, Math.PI * 2);
        ctx.fill();

        // Planet body
        const pg = ctx.createRadialGradient(ox - p.radius / 3, oy - p.radius / 3, p.radius / 4, ox, oy, p.radius);
        pg.addColorStop(0, p.color);
        pg.addColorStop(1, p.color); // Simplified for now, could use lighter/darker logic
        ctx.fillStyle = pg;
        ctx.beginPath();
        ctx.arc(ox, oy, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none"
    />
  );
};
