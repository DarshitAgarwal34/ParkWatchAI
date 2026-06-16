import * as React from "react"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

const Button = React.forwardRef(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
          // Variants
          variant === "default" && "bg-primary text-primary-foreground hover:bg-primary/90 shadow",
          variant === "destructive" && "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
          variant === "outline" && "border border-border bg-transparent hover:bg-card hover:text-foreground",
          variant === "secondary" && "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm",
          variant === "ghost" && "hover:bg-card hover:text-foreground",
          variant === "link" && "text-primary underline-offset-4 hover:underline",
          // Sizes
          size === "default" && "h-9 px-4 py-2",
          size === "sm" && "h-8 rounded-md px-3 text-xs",
          size === "lg" && "h-10 rounded-md px-8",
          size === "icon" && "h-9 w-9",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
