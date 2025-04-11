"use client"

import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { cn } from "@/lib/utils"

const viewOptions = [
  { value: 5000, label: "5K views" },
  { value: 10000, label: "10K views" },
  { value: 25000, label: "25K views" },
  { value: 50000, label: "50K views" },
  { value: 100000, label: "100K views" },
  { value: 250000, label: "250K views" },
  { value: 500000, label: "500K views" },
  { value: 1000000, label: "1M views" },
] as const

const ViewsSelect = React.forwardRef<
  HTMLButtonElement,
  {
    value?: number
    onValueChange?: (value: number) => void
    disabled?: boolean
  }
>(({ value, onValueChange, disabled }, ref) => {
  return (
    <SelectPrimitive.Root 
      value={value?.toString()} 
      onValueChange={(val: string) => onValueChange?.(parseInt(val))}
    >
      <SelectPrimitive.Trigger
        ref={ref}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          "group"
        )}
        disabled={disabled}
      >
        <SelectPrimitive.Value placeholder="Select target views">
          {value ? viewOptions.find(opt => opt.value === value)?.label : "Select target views"}
        </SelectPrimitive.Value>
        <SelectPrimitive.Icon>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content className="relative z-50 min-w-[200px] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80">
          <SelectPrimitive.Viewport className="p-1">
            {viewOptions.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value.toString()}
                className={cn(
                  "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                  "cursor-pointer"
                )}
              >
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                  <SelectPrimitive.ItemIndicator>
                    <Check className="h-4 w-4" />
                  </SelectPrimitive.ItemIndicator>
                </span>
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
})
ViewsSelect.displayName = "ViewsSelect"

export { ViewsSelect, viewOptions }