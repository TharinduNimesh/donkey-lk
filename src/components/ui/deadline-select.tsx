"use client"

import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { cn } from "@/lib/utils"
import { addDays, addMonths, addWeeks } from "date-fns"

const deadlineOptions = [
  { value: "3d", label: "3 Days", getFutureDate: () => addDays(new Date(), 3) },
  { value: "1w", label: "1 Week", getFutureDate: () => addWeeks(new Date(), 1) },
  { value: "2w", label: "2 Weeks", getFutureDate: () => addWeeks(new Date(), 2) },
  { value: "1m", label: "1 Month", getFutureDate: () => addMonths(new Date(), 1) },
  { value: "2m", label: "2 Months", getFutureDate: () => addMonths(new Date(), 2) },
  { value: "3m", label: "3 Months", getFutureDate: () => addMonths(new Date(), 3) },
  { value: "6m", label: "6 Months", getFutureDate: () => addMonths(new Date(), 6) },
  { value: "flexible", label: "Flexible", getFutureDate: () => addMonths(new Date(), 12) },
] as const

type DeadlineOption = typeof deadlineOptions[number]['value']

const DeadlineSelect = React.forwardRef<
  HTMLButtonElement,
  {
    value?: DeadlineOption
    onValueChange?: (value: DeadlineOption, date: Date) => void
    disabled?: boolean
  }
>(({ value, onValueChange, disabled }, ref) => {
  return (
    <SelectPrimitive.Root 
      value={value} 
      onValueChange={(val: string) => {
        const option = deadlineOptions.find(opt => opt.value === val);
        if (option) {
          onValueChange?.(option.value, option.getFutureDate());
        }
      }}
    >
      <SelectPrimitive.Trigger
        ref={ref}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          "group"
        )}
        disabled={disabled}
      >
        <SelectPrimitive.Value placeholder="Select deadline">
          {value ? deadlineOptions.find(opt => opt.value === value)?.label : "Select deadline"}
        </SelectPrimitive.Value>
        <SelectPrimitive.Icon>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content className="relative z-50 min-w-[200px] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80">
          <SelectPrimitive.Viewport className="p-1">
            {deadlineOptions.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
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
DeadlineSelect.displayName = "DeadlineSelect"

export { DeadlineSelect, deadlineOptions }