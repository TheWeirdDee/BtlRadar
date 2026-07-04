'use client';

import { useEffect, useRef } from 'react';

interface Blip {
  x: number;
  y: number;
  angle: number;
  distance: number;
  intensity: number;
  size: number;
  flagged: boolean;
  label: string;
}

export default function SonarRadarBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let sweepAngle = 0;
    const sweepSpeed = 0.015; // Radians per frame
    let blips: Blip[] = [];
    const maxBlips = 12;

    const resizeCanvas = () => {
      if (!canvas) return;
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
      initBlips();
    };

    const initBlips = () => {
      if (!canvas) return;
      blips = [];
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxDistance = Math.min(centerX, centerY) * 0.9;

      const labels = [
        'TX_BLOCK_EVM', 'TX_BLOCK_SOL', 'API_ROUTE_PAY', 
        'ESCROW_PDA_INIT', 'REPUTATION_SAS_ATTEST', 'ERC_8004_FEEDBACK',
        'SPL_TRANSFER_STREAM', 'MPP_AGENT_PAY', 'VERDICT_JUDGE'
      ];

      for (let i = 0; i < maxBlips; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = (0.2 + Math.random() * 0.75) * maxDistance;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        blips.push({
          x,
          y,
          angle,
          distance,
          intensity: 0,
          size: Math.random() * 3 + 2,
          flagged: Math.random() < 0.25, // 25% chance of being flagged (burgundy)
          label: labels[i % labels.length] + `_${Math.floor(1000 + Math.random() * 9000)}`,
        });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    canvas.parentElement?.addEventListener('mousemove', handleMouseMove);
    canvas.parentElement?.addEventListener('mouseleave', handleMouseLeave);

    const animate = () => {
      if (!canvas || !ctx) return;

      // Note: We use a trailing clear rect rather than full clear
      // to create a smooth radar fading trail!
      ctx.fillStyle = 'rgba(12, 11, 8, 0.08)'; // Matches --bg #0c0b08
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxRadius = Math.min(centerX, centerY) * 0.95;
      const mouse = mouseRef.current;

      // Draw concentric radar range circles
      ctx.strokeStyle = 'rgba(209, 188, 106, 0.012)'; // Dimmed mustard gold
      ctx.lineWidth = 1;
      
      const rings = [0.2, 0.4, 0.6, 0.8, 1.0];
      rings.forEach((scale) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, maxRadius * scale, 0, Math.PI * 2);
        ctx.stroke();

        // Draw distance marker text
        ctx.fillStyle = 'rgba(209, 188, 106, 0.06)'; // Dimmed text marker
        ctx.font = '7px IBM Plex Mono, monospace';
        ctx.fillText(`${Math.round(scale * 100)}m`, centerX + maxRadius * scale + 4, centerY + 3);
      });

      // Draw horizontal, vertical, and diagonal axis gridlines
      ctx.strokeStyle = 'rgba(209, 188, 106, 0.006)'; // Dimmed gridlines
      const angles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4];
      angles.forEach((ang) => {
        ctx.beginPath();
        ctx.moveTo(centerX - Math.cos(ang) * maxRadius, centerY - Math.sin(ang) * maxRadius);
        ctx.lineTo(centerX + Math.cos(ang) * maxRadius, centerY + Math.sin(ang) * maxRadius);
        ctx.stroke();
      });

      // Rotate radar sweep angle
      sweepAngle = (sweepAngle + sweepSpeed) % (Math.PI * 2);

      // Draw the rotating sweep line
      const sweepX = centerX + Math.cos(sweepAngle) * maxRadius;
      const sweepY = centerY + Math.sin(sweepAngle) * maxRadius;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(sweepX, sweepY);
      ctx.strokeStyle = 'rgba(209, 188, 106, 0.25)'; // Sweep ray
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw fading sweep gradient trail behind the ray
      const trailWidth = 25; // Number of trail slices
      for (let i = 0; i < trailWidth; i++) {
        const offsetAngle = sweepAngle - (i * 0.005);
        const alpha = (1 - i / trailWidth) * 0.08;
        const trailX = centerX + Math.cos(offsetAngle) * maxRadius;
        const trailY = centerY + Math.sin(offsetAngle) * maxRadius;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(trailX, trailY);
        ctx.strokeStyle = `rgba(209, 188, 106, ${alpha})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // Draw and update blips (targets)
      blips.forEach((blip) => {
        // Calculate shortest angle difference between sweep and blip
        let diff = sweepAngle - blip.angle;
        // Normalize angle to [-PI, PI]
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;

        // If sweep line passes over blip, light it up!
        if (Math.abs(diff) < 0.05) {
          blip.intensity = 1.0;
        } else {
          // Slow decay over time
          blip.intensity = Math.max(0, blip.intensity - 0.008);
        }

        if (blip.intensity > 0) {
          const bx = centerX + blip.x;
          const by = centerY + blip.y;
          
          // Draw target circle glow
          ctx.beginPath();
          ctx.arc(bx, by, blip.size * (1 + (1 - blip.intensity) * 1.5), 0, Math.PI * 2);
          
          if (blip.flagged) {
            // Burgundy warning blip
            ctx.fillStyle = `rgba(142, 45, 78, ${blip.intensity * 0.4})`;
            ctx.fill();

            // Core dot
            ctx.beginPath();
            ctx.arc(bx, by, blip.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(142, 45, 78, ${blip.intensity})`;
            ctx.fill();

            // Text Label
            ctx.fillStyle = `rgba(142, 45, 78, ${blip.intensity * 0.8})`;
          } else {
            // Mustard gold blip
            ctx.fillStyle = `rgba(209, 188, 106, ${blip.intensity * 0.4})`;
            ctx.fill();

            // Core dot
            ctx.beginPath();
            ctx.arc(bx, by, blip.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(209, 188, 106, ${blip.intensity})`;
            ctx.fill();

            // Text Label
            ctx.fillStyle = `rgba(209, 188, 106, ${blip.intensity * 0.8})`;
          }

          ctx.font = '6px IBM Plex Mono, monospace';
          ctx.fillText(blip.label, bx + blip.size + 4, by + 2);
        }
      });

      // Interactive mouse HUD crosshair
      if (mouse.x > 0 && mouse.x < canvas.width && mouse.y > 0 && mouse.y < canvas.height) {
        const dx = mouse.x - centerX;
        const dy = mouse.y - centerY;
        const mouseDist = Math.sqrt(dx * dx + dy * dy);

        if (mouseDist < maxRadius) {
          ctx.strokeStyle = 'rgba(142, 45, 78, 0.4)'; // Burgundy crosshair
          ctx.lineWidth = 0.5;

          // Crosshair circle
          ctx.beginPath();
          ctx.arc(mouse.x, mouse.y, 8, 0, Math.PI * 2);
          ctx.stroke();

          // Horizontal lines
          ctx.beginPath();
          ctx.moveTo(mouse.x - 15, mouse.y);
          ctx.lineTo(mouse.x - 4, mouse.y);
          ctx.moveTo(mouse.x + 4, mouse.y);
          ctx.lineTo(mouse.x + 15, mouse.y);
          // Vertical lines
          ctx.moveTo(mouse.x, mouse.y - 15);
          ctx.lineTo(mouse.x, mouse.y - 4);
          ctx.moveTo(mouse.x, mouse.y + 4);
          ctx.lineTo(mouse.x, mouse.y + 15);
          ctx.stroke();

          // Calculate angular telemetry
          let mouseAngleRad = Math.atan2(dy, dx);
          if (mouseAngleRad < 0) mouseAngleRad += Math.PI * 2;
          const mouseAngleDeg = Math.round((mouseAngleRad * 180) / Math.PI);

          // Render coordinate labels
          ctx.fillStyle = 'rgba(142, 45, 78, 0.8)';
          ctx.font = '8px IBM Plex Mono, monospace';
          ctx.fillText(
            `AZIMUTH: ${mouseAngleDeg}° | RANGE: ${Math.round(mouseDist)}m`,
            mouse.x + 12,
            mouse.y - 12
          );
          ctx.fillText(
            `TARGET_LOCK_VAL`,
            mouse.x + 12,
            mouse.y - 4
          );
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.parentElement?.removeEventListener('mousemove', handleMouseMove);
      canvas.parentElement?.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Sonar sweep canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full opacity-35" />

      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.005]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #d1bc6a 1px, transparent 1px),
            linear-gradient(to bottom, #d1bc6a 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Vignette dark shadowing to focus center */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,#0c0b08_85%)]" />

      {/* Subtle organic glowing rings in the background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-zinc-900/10 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-zinc-900/5 pointer-events-none" />
    </div>
  );
}
