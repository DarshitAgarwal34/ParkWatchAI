import * as React from "react"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

function Badge({ className, variant = "default", ...props }) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        // Variants
        variant === "default" && "border-transparent bg-primary text-primary-foreground shadow",
        variant === "secondary" && "border-transparent bg-secondary text-secondary-foreground",
        variant === "destructive" && "border-transparent bg-destructive/20 text-destructive border-destructive/30",
        variant === "success" && "border-transparent bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        variant === "warning" && "border-transparent bg-amber-500/20 text-amber-400 border-amber-500/30",
        variant === "info" && "border-transparent bg-blue-500/20 text-blue-400 border-blue-500/30",
        variant === "outline" && "text-foreground border-border bg-transparent",
        className
      )}
      {...props}
    />
  )
}

export { Badge }
