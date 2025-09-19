"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type ComboboxProps = {
    options: { value: string; label: string }[];
    value: string | null | undefined;
    onValueChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    notFoundMessage?: string;
    disabled?: boolean;
}

export function Combobox({ 
    options, 
    value, 
    onValueChange, 
    placeholder = "Select option...",
    searchPlaceholder = "Search...",
    notFoundMessage = "No option found.",
    disabled = false
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {value
            ? options.find((option) => option.value === value)?.label
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
                <CommandEmpty>{notFoundMessage}</CommandEmpty>
                <CommandGroup>
                    {options.map((option) => (
                    <CommandItem
                        key={option.value}
                        value={option.value}
                        onSelect={(currentValue) => {
                            // This ensures that if the user re-selects the same item, it stays selected.
                            // If they select a different item, it updates.
                            // The `currentValue` from onSelect is the `value` prop of CommandItem.
                            onValueChange(currentValue === value ? value : currentValue)
                            setOpen(false)
                        }}
                    >
                        <Check
                        className={cn(
                            "mr-2 h-4 w-4",
                            value === option.value ? "opacity-100" : "opacity-0"
                        )}
                        />
                        {option.label}
                    </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
