"use client"

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

export interface Toast {
  id: string
  title?: string
  description?: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  dismissible?: boolean
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  removeAllToasts: () => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: React.ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const removeAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: Toast = {
      id,
      duration: 4000,
      dismissible: true,
      type: 'info',
      ...toast,
    }
    
    setToasts(prev => [newToast, ...prev])

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
    }
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, removeAllToasts }}>
      {children}
      <ToastViewport />
    </ToastContext.Provider>
  )
}

function ToastViewport() {
  const { toasts } = useToast()

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
      {toasts.map((toast) => (
        <ToastComponent key={toast.id} toast={toast} />
      ))}
    </div>
  )
}

interface ToastComponentProps {
  toast: Toast
}

function ToastComponent({ toast }: ToastComponentProps) {
  const { removeToast } = useToast()
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    setIsLeaving(true)
    setTimeout(() => removeToast(toast.id), 150)
  }

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="h-4 w-4" />
      case 'error':
        return <AlertCircle className="h-4 w-4" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />
      case 'info':
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getColorClasses = () => {
    switch (toast.type) {
      case 'success':
        return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10 text-green-900 dark:text-green-100'
      case 'error':
        return 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 text-red-900 dark:text-red-100'
      case 'warning':
        return 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/10 text-yellow-900 dark:text-yellow-100'
      case 'info':
      default:
        return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10 text-blue-900 dark:text-blue-100'
    }
  }

  const getIconColorClasses = () => {
    switch (toast.type) {
      case 'success':
        return 'text-green-600 dark:text-green-400'
      case 'error':
        return 'text-red-600 dark:text-red-400'
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'info':
      default:
        return 'text-blue-600 dark:text-blue-400'
    }
  }

  return (
    <div
      className={cn(
        'pointer-events-auto relative flex w-full items-start gap-3 rounded-lg border p-4 shadow-lg backdrop-blur transition-all duration-200 ease-in-out',
        getColorClasses(),
        isVisible && !isLeaving && 'translate-x-0 opacity-100',
        !isVisible && 'translate-x-full opacity-0',
        isLeaving && 'translate-x-full opacity-0 scale-95'
      )}
    >
      {/* Icon */}
      <div className={cn('flex-shrink-0 mt-0.5', getIconColorClasses())}>
        {getIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {toast.title && (
          <div className="font-medium text-sm leading-5">
            {toast.title}
          </div>
        )}
        {toast.description && (
          <div className={cn(
            'text-sm leading-5',
            toast.title ? 'mt-1 opacity-90' : ''
          )}>
            {toast.description}
          </div>
        )}
      </div>

      {/* Dismiss button */}
      {toast.dismissible && (
        <button
          onClick={handleDismiss}
          className={cn(
            'flex-shrink-0 rounded-md p-1 hover:bg-black/10 dark:hover:bg-white/10 transition-colors',
            getIconColorClasses()
          )}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

// Hook that returns toast functions
export function useToastActions() {
  const { addToast } = useToast()
  
  return {
    success: (title: string, description?: string) => {
      addToast({ type: 'success', title, description })
    },
    error: (title: string, description?: string) => {
      addToast({ type: 'error', title, description })
    },
    warning: (title: string, description?: string) => {
      addToast({ type: 'warning', title, description })
    },
    info: (title: string, description?: string) => {
      addToast({ type: 'info', title, description })
    },
  }
}
