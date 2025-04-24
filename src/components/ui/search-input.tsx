"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  iconClassName?: string;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, iconClassName, type, ...props }, ref) => {
    return (
      <div className="relative group">
        <Search 
          className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors duration-200 group-hover:text-foreground/70 group-focus-within:text-pink-500",
            iconClassName
          )} 
        />
        <input
          type={type}
          ref={ref}
          className={cn(
            "h-9 w-full rounded-md border border-input bg-background px-9 py-2 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground hover:bg-accent/5 focus:bg-background focus:outline-none focus:ring-2 focus:ring-pink-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-input/30 dark:hover:bg-accent/10 dark:focus:bg-background/5",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";

export { SearchInput }