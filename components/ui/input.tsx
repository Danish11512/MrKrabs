import * as React from "react"

import { cn } from "@/lib/utils"

const Input = ({ className, type, ...props }: React.ComponentProps<"input">): React.JSX.Element => {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground backdrop-blur-xl backdrop-saturate-150 border-[var(--glass-border-light)] dark:border-[var(--glass-border-dark)] h-9 w-full min-w-0 rounded-lg border bg-[var(--glass-bg-light)] dark:bg-[var(--glass-bg-dark)] px-3 py-1 text-base shadow-lg dark:shadow-[var(--shadow-dark)] transition-[color,box-shadow,backdrop-filter] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:backdrop-blur-2xl",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
