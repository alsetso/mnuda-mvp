'use client';

import React, { useState, useEffect } from 'react';
import { ToastData } from '../services/toast';
import { useToastContext } from '../contexts/ToastContext';

interface ToastProps {
  toast: ToastData;
}

export function Toast({ toast }: ToastProps) {
  const { removeToast } = useToastContext();
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Auto-dismiss for non-loading toasts
  useEffect(() => {
    if (toast.type !== 'loading' && toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        setIsLeaving(true);
        setTimeout(() => removeToast(toast.id), 200);
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, toast.type, toast.id, removeToast]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => removeToast(toast.id), 200);
  };

  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-white text-emerald-700 shadow-emerald-100';
      case 'error':
        return 'bg-white text-red-700 shadow-red-100';
      case 'loading':
        return 'bg-white text-blue-700 shadow-blue-100';
      case 'info':
        return 'bg-white text-slate-700 shadow-slate-100';
      default:
        return 'bg-white text-slate-700 shadow-slate-100';
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return (
          <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0"></div>
        );
      case 'error':
        return (
          <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
        );
      case 'loading':
        return (
          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 animate-pulse"></div>
        );
      case 'info':
        return (
          <div className="w-2 h-2 bg-slate-500 rounded-full flex-shrink-0"></div>
        );
    }
  };

  return (
    <div
      className={`
        relative flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg border border-gray-100
        transition-all duration-300 ease-out transform
        ${getToastStyles()}
        ${isVisible && !isLeaving ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-8 scale-95'}
        ${isLeaving ? 'opacity-0 translate-x-8 scale-95' : ''}
        backdrop-blur-sm
      `}
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        {getIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">
          {toast.title}
        </div>
        
        {toast.message && (
          <div className="mt-0.5 text-xs text-gray-600 truncate">
            {toast.message}
          </div>
        )}
        
        {toast.apiCall && (
          <div className="mt-1 text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded">
            {toast.apiCall}
          </div>
        )}
      </div>

      {/* Close Button */}
      <button
        onClick={handleClose}
        className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-full transition-colors"
      >
        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// Toast Container Component
export function ToastContainer() {
  const { toasts } = useToastContext();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 space-y-3 max-w-sm">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
