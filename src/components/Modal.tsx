// Karl's GIR - Standardized Modal Component
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExclamationTriangle, faInfoCircle, faXmark } from '@fortawesome/free-solid-svg-icons';

export type ModalType = 'success' | 'warning' | 'info' | 'confirm';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void | Promise<void>;
  title: string;
  message: string | React.ReactNode;
  type?: ModalType;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancel = true
}: ModalProps) {
  console.log('🔘 Modal rendering - isOpen:', isOpen, 'title:', title);
  if (!isOpen) return null;
  console.log('🔘 Modal VISIBLE - rendering content');

  const getIcon = () => {
    switch (type) {
      case 'success':
        return faCheckCircle;
      case 'warning':
        return faExclamationTriangle;
      case 'confirm':
        return faExclamationTriangle;
      case 'info':
      default:
        return faInfoCircle;
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = async () => {
    console.log('🔘 Modal handleConfirm START');
    if (onConfirm) {
      console.log('🔘 Calling onConfirm...');
      await onConfirm();
      console.log('🔘 onConfirm complete');
    }
    console.log('🔘 Calling onClose...');
    onClose();
    console.log('🔘 Modal handleConfirm END');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleBackdropClick}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}
      >
        {/* Solid Black Background Layer */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#000000',
            zIndex: -1,
          }}
        />

        {/* Modal Card Container */}
        <div
          style={{
            maxWidth: '500px',
            width: '100%',
            position: 'relative',
            animation: 'modalSlideIn 0.2s ease-out',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Solid Black Card Background */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: '#000000',
              borderRadius: '8px',
              zIndex: 0,
            }}
          />

          {/* Modal Card (semi-transparent overlay) */}
          <div
            className="card"
            style={{
              position: 'relative',
              zIndex: 1,
            }}
          >
          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.5rem',
              opacity: 0.7,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
            aria-label="Close"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>

          {/* Icon */}
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <FontAwesomeIcon
              icon={getIcon()}
              style={{
                fontSize: '3rem',
                color: 'var(--color-interactive)',
              }}
            />
          </div>

          {/* Title */}
          <h2
            style={{
              fontSize: 'var(--font-xl)',
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: '1rem',
              color: 'var(--text-primary)',
            }}
          >
            {title}
          </h2>

          {/* Message */}
          <div
            style={{
              fontSize: 'var(--font-base)',
              textAlign: 'center',
              marginBottom: '1.5rem',
              color: 'var(--text-primary)',
              opacity: 0.9,
              lineHeight: '1.6',
            }}
          >
            {message}
          </div>

          {/* Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              flexDirection: showCancel ? 'row' : 'column',
            }}
          >
            {showCancel && (
              <button
                onClick={onClose}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={() => {
                console.log('🔘 BUTTON CLICKED!');
                handleConfirm();
              }}
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              {confirmText}
            </button>
          </div>
          </div>
        </div>
      </div>

      {/* Animation Keyframes */}
      <style>
        {`
          @keyframes modalSlideIn {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </>
  );
}

// Convenience hook for modal state management
export function useModal() {
  const [isOpen, setIsOpen] = useState(false);
  
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  
  return { isOpen, open, close };
}
