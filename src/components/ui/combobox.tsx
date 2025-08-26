
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
  CommandList
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type Option = {
    value: string
    label: string
}

type ComboboxProps = {
    options: Option[]
    value: string | null
    onValueChange: (value: string | null) => void
    placeholder?: string
    searchPlaceholder?: string
    notFoundMessage?: string
    disabled?: boolean
}

export function Combobox({ 
    options,
    value, 
    onValueChange, 
    placeholder = "Select an option", 
    searchPlaceholder = "Search...", 
    notFoundMessage = "No options found.",
    disabled = false
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const selectedOption = options.find((option) => option.value === value)

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
          {selectedOption
            ? selectedOption.label
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" >
        <Command
            filter={(value, search) => {
                const option = options.find(o => o.value.toLowerCase() === value.toLowerCase());
                if (option) {
                    // Normalize search and label for better matching
                    const normalizedSearch = search.trim().toLowerCase();
                    const normalizedLabel = option.label.trim().toLowerCase();
                    return normalizedLabel.includes(normalizedSearch) ? 1 : 0;
                }
                return 0;
            }}
        >
          <CommandInput placeholder={searchPlaceholder} />
           <CommandList onMouseDown={(e) => e.preventDefault()}>
            <CommandEmpty>{notFoundMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? null : currentValue)
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
