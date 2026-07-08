import { useState, useEffect } from 'react';

interface SplashScreenProps {
  onReady: () => void;
}

export function SplashScreen({ onReady }: SplashScreenProps) {
  const [show, setShow] = useState(false);
  const [hide, setHide] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setShow(true));
    const t1 = setTimeout(() => setHide(true), 1800);
    const t2 = setTimeout(() => onReady(), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onReady]);

  if (hide) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: '#050810',
      opacity: hide ? 0 : 1,
      transition: 'opacity 0.4s ease',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        width: '300px', height: '300px',
        background: 'radial-gradient(circle, rgba(0,212,255,0.12) 0%, transparent 60%)',
        filter: 'blur(60px)',
      }} />

      {/* Logo */}
      <div style={{
        width: '72px', height: '72px',
        background: 'linear-gradient(135deg, #00D4FF, #0080FF)',
        borderRadius: '20px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '32px', fontWeight: 800, color: '#000',
        boxShadow: '0 0 60px rgba(0,212,255,0.5), 0 0 120px rgba(0,212,255,0.2)',
        transform: show ? 'scale(1) translateY(0)' : 'scale(0.6) translateY(20px)',
        opacity: show ? 1 : 0,
        transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        G
      </div>

      {/* Title */}
      <div style={{
        marginTop: '24px',
        textAlign: 'center',
        transform: show ? 'translateY(0)' : 'translateY(15px)',
        opacity: show ? 1 : 0,
        transition: 'all 0.6s ease 0.2s',
      }}>
        <h1 style={{
          fontSize: '28px', fontWeight: 800, margin: 0,
          background: 'linear-gradient(135deg, #ffffff, #00D4FF)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.5px',
        }}>
          GigantVPN
        </h1>
      </div>

      {/* Subtitle */}
      <div style={{
        marginTop: '8px',
        transform: show ? 'translateY(0)' : 'translateY(10px)',
        opacity: show ? 0.5 : 0,
        transition: 'all 0.6s ease 0.35s',
      }}>
        <p style={{
          fontSize: '13px', color: 'rgba(255,255,255,0.5)',
          margin: 0, fontWeight: 400, letterSpacing: '0.5px',
        }}>
          Безопасный интернет
        </p>
      </div>
    </div>
  );
}
