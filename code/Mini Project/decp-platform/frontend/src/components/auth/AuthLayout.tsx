import React, { useEffect, useRef } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Outlet } from 'react-router-dom';

// ─── Animated particle canvas ─────────────────────────────────────────────────
const ParticleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = (canvas.width = canvas.offsetWidth);
    let h = (canvas.height = canvas.offsetHeight);

    const resize = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', resize);

    const PARTICLE_COUNT = 60;
    type Particle = { x: number; y: number; vx: number; vy: number; r: number; alpha: number };
    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.5 + 0.2,
    }));

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(74, 222, 128, ${p.alpha})`;
        ctx.fill();
      });

      // Draw connecting lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(74, 222, 128, ${0.12 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
};

// ─── Left branding panel ───────────────────────────────────────────────────────
const features = [
  { emoji: '🎓', title: 'Academic Network', desc: 'Connect with students, faculty & alumni across departments' },
  { emoji: '💼', title: 'Career Launchpad', desc: 'Discover jobs, internships & career opportunities tailored for you' },
  { emoji: '🔬', title: 'Research Hub', desc: 'Collaborate on research projects and share academic insights' },
  { emoji: '📅', title: 'Events & Talks', desc: 'Stay up-to-date with department seminars, hackathons & workshops' },
];

const stats = [
  { value: '1,200+', label: 'Active Members' },
  { value: '340+', label: 'Jobs Posted' },
  { value: '80+', label: 'Research Projects' },
  { value: '200+', label: 'Events Hosted' },
];

const BrandPanel: React.FC = () => (
  <Box
    sx={{
      flex: '0 0 52%',
      display: { xs: 'none', lg: 'flex' },
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(150deg, #052e16 0%, #14532d 35%, #166534 65%, #0f3520 100%)',
      p: 6,
    }}
  >
    <ParticleCanvas />

    {/* Background decoration orbs */}
    <Box sx={{ position: 'absolute', top: '-80px', right: '-80px', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
    <Box sx={{ position: 'absolute', bottom: '60px', left: '-60px', width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,184,166,0.14) 0%, transparent 70%)', pointerEvents: 'none' }} />
    <Box sx={{ position: 'absolute', top: '45%', right: '10%', width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 70%)', pointerEvents: 'none' }} />

    {/* Top: Logo + tagline */}
    <Box sx={{ position: 'relative', zIndex: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #22c55e 0%, #14b8a6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(34,197,94,0.4)',
            flexShrink: 0,
          }}
        >
          <Typography sx={{ color: '#052e16', fontWeight: 900, fontSize: '1.4rem', lineHeight: 1 }}>D</Typography>
        </Box>
        <Box>
          <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1.5rem', lineHeight: 1, letterSpacing: '-0.5px' }}>
            DECP
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Department Engagement & Career Platform
          </Typography>
        </Box>
      </Box>

      <Typography
        sx={{
          color: 'white',
          fontWeight: 800,
          fontSize: { lg: '2.1rem', xl: '2.5rem' },
          lineHeight: 1.18,
          letterSpacing: '-1px',
          mb: 1.5,
        }}
      >
        Where Academics{' '}
        <Box
          component="span"
          sx={{
            background: 'linear-gradient(90deg, #4ade80 0%, #2dd4bf 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Meet Opportunity
        </Box>
      </Typography>
      <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: 400 }}>
        Join the university's premier platform connecting students, faculty and alumni for academic and professional growth.
      </Typography>
    </Box>

    {/* Middle: Feature cards */}
    <Box sx={{ position: 'relative', zIndex: 1, my: 4 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
        {features.map((f, i) => (
          <Box
            key={f.title}
            sx={{
              p: 2,
              borderRadius: '14px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.10)',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.3s ease',
              animation: `fadeInUp 0.5s ease-out ${0.1 + i * 0.1}s both`,
              '&:hover': {
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(74,222,128,0.3)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            <Typography sx={{ fontSize: '1.4rem', mb: 0.75 }}>{f.emoji}</Typography>
            <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '0.82rem', mb: 0.4, lineHeight: 1.2 }}>
              {f.title}
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', lineHeight: 1.45 }}>
              {f.desc}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>

    {/* Bottom: Stats bar */}
    <Box sx={{ position: 'relative', zIndex: 1 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 0,
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {stats.map((s, i) => (
          <Box
            key={s.label}
            sx={{
              py: 2,
              px: 1.5,
              textAlign: 'center',
              borderRight: i < stats.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
            }}
          >
            <Typography
              sx={{
                color: 'white',
                fontWeight: 800,
                fontSize: '1.15rem',
                lineHeight: 1,
                mb: 0.3,
                background: 'linear-gradient(135deg, #4ade80, #2dd4bf)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {s.value}
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {s.label}
            </Typography>
          </Box>
        ))}
      </Box>

      <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', textAlign: 'center', mt: 2, letterSpacing: '0.03em' }}>
        University of Peradeniya · Department of Computer Engineering · CO528
      </Typography>
    </Box>
  </Box>
);

// ─── Auth Layout ───────────────────────────────────────────────────────────────
export const AuthLayout: React.FC = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1f0f 50%, #0a0f1e 100%)',
      }}
    >
      {/* Left branding panel (desktop only) */}
      <BrandPanel />

      {/* Right: form panel */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          px: { xs: 2, sm: 4, md: 6 },
          py: 4,
          minHeight: '100vh',
        }}
      >
        {/* Mobile background (only on small screens) */}
        <Box
          sx={{
            display: { xs: 'block', lg: 'none' },
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(150deg, #052e16 0%, #14532d 50%, #0a0f1e 100%)',
            zIndex: 0,
          }}
        />
        <Box
          sx={{
            display: { xs: 'block', lg: 'none' },
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: 240,
            height: 240,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />

        <Box
          sx={{
            width: '100%',
            maxWidth: 440,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Mobile-only logo */}
          <Box
            sx={{
              display: { xs: 'flex', lg: 'none' },
              flexDirection: 'column',
              alignItems: 'center',
              mb: 5,
            }}
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '22px',
                background: 'linear-gradient(135deg, #22c55e 0%, #14b8a6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 12px 32px rgba(34,197,94,0.45)',
                mb: 2,
              }}
            >
              <Typography sx={{ color: '#052e16', fontWeight: 900, fontSize: '2rem', lineHeight: 1 }}>D</Typography>
            </Box>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: '1.8rem',
                letterSpacing: '-1px',
                background: 'linear-gradient(90deg, #4ade80 0%, #2dd4bf 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              DECP
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', mt: 0.5, textAlign: 'center' }}>
              Department Engagement & Career Platform
            </Typography>
          </Box>

          {/* Form card */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3.5, sm: 5 },
              borderRadius: '24px',
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 32px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(74,222,128,0.08)',
              animation: 'fadeInUp 0.4s ease-out both',
            }}
          >
            <Outlet />
          </Paper>

          {/* Footer */}
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'center',
              color: 'rgba(255,255,255,0.25)',
              mt: 3,
              fontSize: '0.7rem',
            }}
          >
            © 2025 DECP Platform · University of Peradeniya
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default AuthLayout;
