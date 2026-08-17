import { useState, useEffect, createContext, useContext } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = ({ title, description, type = 'info', duration = 4000 }) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, title, description, type }])
    setTimeout(() => removeToast(id), duration)
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function Toast({ title, description, type, onClose }) {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
  }

  const borders = {
    success: 'border-l-green-500',
    error: 'border-l-red-500',
    info: 'border-l-blue-500',
    warning: 'border-l-yellow-500',
  }

  return (
    <div className={`flex items-start gap-3 p-4 bg-white rounded-lg shadow-lg border-l-4 ${borders[type]} min-w-[300px] max-w-[400px] animate-in slide-in-from-right`}>
      {icons[type]}
      <div className="flex-1">
        {title && <p className="font-medium text-sm text-gray-900">{title}</p>}
        {description && <p className="text-sm text-gray-600 mt-0.5">{description}</p>}
      </div>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    return {
      addToast: () => {},
      success: (title, desc) => {},
      error: (title, desc) => {},
      info: (title, desc) => {},
    }
  }
  return {
    ...context,
    success: (title, description) => context.addToast({ title, description, type: 'success' }),
    error: (title, description) => context.addToast({ title, description, type: 'error' }),
    info: (title, description) => context.addToast({ title, description, type: 'info' }),
  }
}
