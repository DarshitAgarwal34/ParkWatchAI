import * as React from "react"

export function Dialog({ open, onClose, children }) {
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      {/* Dialog Wrapper */}
      <div className="relative w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-lg z-10 transition-all transform scale-100">
        {children}
      </div>
    </div>
  )
}

export function DialogHeader({ className, ...props }) {
  return <div className="flex flex-col space-y-1.5 text-center sm:text-left pb-4 border-b border-border" {...props} />
}

export function DialogTitle({ className, ...props }) {
  return <h2 className="text-lg font-semibold leading-none tracking-tight text-foreground" {...props} />
}

export function DialogDescription({ className, ...props }) {
  return <p className="text-sm text-muted-foreground mt-1" {...props} />
}

export function DialogFooter({ className, ...props }) {
  return <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4 border-t border-border mt-4" {...props} />
}
