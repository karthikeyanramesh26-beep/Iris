import React, { useEffect, useRef } from 'react';

export default function InteractiveGrid({ theme, isChatActive }) {
  const canvasRef = useRef(null);
  const orbitsRef = useRef([]);

  // Generate concentric orbits on initialize or resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxRadius = Math.max(canvas.width, canvas.height) * 0.8;

      // Create a set of concentric orbital rings
      const orbitCount = 7;
      const generated = [];
      for (let i = 0; i < orbitCount; i++) {
        generated.push({
          radius: (i + 1) * (maxRadius / (orbitCount + 1)),
          speed: (Math.random() * 0.0008 + 0.0002) * (i % 2 === 0 ? 1 : -1),
          angle: Math.random() * Math.PI * 2,
          nodeRadius: Math.random() * 4 + 3,
          lineWidth: Math.random() * 1.5 + 0.8
        });
      }
      orbitsRef.current = generated;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId;

    const loop = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      ctx.clearRect(0, 0, width, height);

      orbitsRef.current.forEach(orbit => {
        // If chat is NOT active, update orbital angle
        if (!isChatActive) {
          orbit.angle += orbit.speed;
        }

        // Draw the ring path (very soft gold dash)
        ctx.beginPath();
        ctx.arc(centerX, centerY, orbit.radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(217, 119, 6, 0.04)'; // Light warm gold/bronze
        ctx.lineWidth = orbit.lineWidth;
        ctx.setLineDash([5, 15]);
        ctx.stroke();
        ctx.setLineDash([]); // Reset dash

        // Draw the orbital node
        const nodeX = centerX + Math.cos(orbit.angle) * orbit.radius;
        const nodeY = centerY + Math.sin(orbit.angle) * orbit.radius;

        ctx.beginPath();
        ctx.arc(nodeX, nodeY, orbit.nodeRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(217, 119, 6, 0.09)'; // Soft warm gold fill
        ctx.fill();
        ctx.strokeStyle = 'rgba(217, 119, 6, 0.2)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Soft outer glowing ring around orbital node
        ctx.beginPath();
        ctx.arc(nodeX, nodeY, orbit.nodeRadius * 1.8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(217, 119, 6, 0.03)';
        ctx.fill();
      });

      animFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [isChatActive]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 pointer-events-none z-0 w-full h-full"
    />
  );
}
