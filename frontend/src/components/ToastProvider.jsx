import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ToastContext = createContext(null)

let idSeq = 1

export function ToastProvider({ children }){
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter(t => t.id !== id))
  }, [])

  const show = useCallback((toast) => {
    const id = idSeq++
    const duration = toast.duration ?? 3000
    const item = { id, type: toast.type || 'info', title: toast.title, message: toast.message, duration }
    setToasts((prev) => [...prev, item])
    if (duration > 0) {
      setTimeout(() => remove(id), duration)
    }
    return id
  }, [remove])

  const value = useMemo(() => ({ show, remove }), [show, remove])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast viewport */}
      <div className="fixed z-[100] bottom-4 right-4 left-4 md:left-auto flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function iconByType(type){
  // simple emojis to avoid extra deps; replace with icons if desired
  switch(type){
    case 'success': return '✅'
    case 'error': return '❌'
    case 'warning': return '⚠️'
    default: return 'ℹ️'
  }
}

function colorByType(type){
  switch(type){
    case 'success': return { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-800' }
    case 'error': return { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800' }
    case 'warning': return { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-800' }
    default: return { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-800' }
  }
}

function ToastItem({ toast, onClose }){
  const colors = colorByType(toast.type)
  return (
    <div className={`pointer-events-auto shadow-lg rounded-xl border ${colors.border} ${colors.bg} ${colors.text} p-3 md:p-4 flex items-start gap-3 animate-slideIn`}> 
      <div className="text-lg md:text-xl leading-none">{iconByType(toast.type)}</div>
      <div className="flex-1 min-w-0">
        {toast.title && <div className="font-semibold text-sm md:text-base truncate">{toast.title}</div>}
        {toast.message && <div className="text-xs md:text-sm break-words">{toast.message}</div>}
      </div>
      <button onClick={onClose} className="text-xs md:text-sm px-2 py-1 rounded-lg border bg-white/70 hover:bg-white">Close</button>
      <style jsx>{`
        @keyframes slideIn { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
        .animate-slideIn { animation: slideIn .2s ease-out }
      `}</style>
    </div>
  )
}

export function useToast(){
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
