import React, { useEffect, useState } from 'react';

interface BottomSheetModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function BottomSheetModal({ isOpen, onClose, title, subtitle, children }: BottomSheetModalProps) {
  const [render, setRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) setRender(true);
  }, [isOpen]);

  const handleAnimationEnd = () => {
    if (!isOpen) setRender(false);
  };

  if (!render) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        pointerEvents: isOpen ? 'auto' : 'none'
      }}
    >
      {/* Backdrop */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.3s ease-out'
        }}
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div 
        style={{
          position: 'relative',
          backgroundColor: 'rgba(20, 30, 20, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(221, 237, 210, 0.2)',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          padding: '24px',
          paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
          width: '100%',
          maxWidth: '600px',
          margin: '0 auto'
        }}
        onTransitionEnd={handleAnimationEnd}
      >
        {/* Handle bar */}
        <div style={{
          width: '40px',
          height: '4px',
          backgroundColor: 'rgba(221, 237, 210, 0.3)',
          borderRadius: '2px',
          margin: '0 auto 20px auto'
        }} />

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>
            {title}
          </h2>
          {subtitle && (
            <p style={{ fontSize: '1rem', color: 'var(--text-primary)', opacity: 0.7 }}>
              {subtitle}
            </p>
          )}
        </div>

        {children}
      </div>
    </div>
  );
}
