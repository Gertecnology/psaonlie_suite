import * as React from 'react'
import { CheckIcon, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

type Option = {
  value: string
  label: string
  icon?: React.ElementType
}

/**
 * The button's own props ride along so the field can be labelled.
 *
 * `FormControl` hands its child an `id` and the `aria-describedby` that points
 * at the label, the description and the error message. The previous version
 * declared a closed prop list, so all of that was dropped on the floor: the
 * `<label>` pointed at an id nothing carried, and a screen reader announced the
 * selector without its name or its validation error.
 */
interface MultiSelectProps
  extends Omit<
    React.ComponentPropsWithoutRef<'button'>,
    'value' | 'defaultValue' | 'onChange'
  > {
  options: Option[]
  /**
   * The current selection. This component is controlled on purpose.
   *
   * It used to keep its own copy in state, seeded from a `defaultValue` prop,
   * and mirror the two with effects. Inside react-hook-form that meant the box
   * ignored anything the form loaded after mount — an edit form filled from the
   * server showed an empty selector — and the mirroring effect fired
   * `onValueChange` on every mount, marking a pristine form as dirty.
   */
  value: string[]
  onValueChange: (values: string[]) => void
  placeholder?: string
  /** How many chips to show before the rest collapse into a counter. */
  maxCount?: number
  disabled?: boolean
  className?: string
}

export const MultiSelect = React.forwardRef<HTMLButtonElement, MultiSelectProps>(
  function MultiSelect(
    {
      options,
      value,
      onValueChange,
      placeholder = 'Selecciona opciones',
      maxCount = 3,
      disabled = false,
      className,
      ...buttonProps
    },
    ref,
  ) {
    const [isOpen, setIsOpen] = React.useState(false)
    const [query, setQuery] = React.useState('')

    const toggle = (optionValue: string) => {
      onValueChange(
        value.includes(optionValue)
          ? value.filter((selected) => selected !== optionValue)
          : [...value, optionValue],
      )
    }

    /**
     * Selected options stay in the list instead of being filtered out of it.
     *
     * They used to disappear once picked, so the checkbox next to them could
     * never be ticked and the only way to undo a choice was a tiny `svg` with
     * an `onClick` — unreachable with the keyboard. Toggling from the list
     * works with Enter, so the icon is gone.
     */
    const visibleOptions = React.useMemo(() => {
      const termino = query.trim().toLowerCase()
      if (!termino) return options
      return options.filter((option) =>
        option.label.toLowerCase().includes(termino),
      )
    }, [options, query])

    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            {...buttonProps}
            ref={ref}
            type='button'
            variant='outline'
            role='combobox'
            aria-expanded={isOpen}
            disabled={disabled}
            className={cn(
              'flex h-auto min-h-10 w-full items-center justify-between gap-2 px-3 py-2 text-left font-normal',
              className,
            )}
          >
            {value.length > 0 ? (
              <span className='flex flex-wrap items-center gap-1'>
                {value.slice(0, maxCount).map((selected) => (
                  <Badge key={selected} variant='secondary'>
                    {options.find((option) => option.value === selected)
                      ?.label ?? selected}
                  </Badge>
                ))}
                {value.length > maxCount && (
                  <Badge variant='outline'>
                    +{value.length - maxCount} más
                  </Badge>
                )}
              </span>
            ) : (
              <span className='text-muted-foreground'>{placeholder}</span>
            )}
            <ChevronDown className='h-4 w-4 shrink-0 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className='w-[--radix-popover-trigger-width] p-0'
          align='start'
        >
          {/* La búsqueda la resuelve `visibleOptions`; sin esto cmdk filtraría
              otra vez por su cuenta y las dos reglas se pisarían. */}
          <Command shouldFilter={false}>
            <CommandInput
              placeholder='Buscar...'
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty>No hay resultados.</CommandEmpty>
              <CommandGroup>
                {visibleOptions.map((option) => {
                  const isSelected = value.includes(option.value)
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => toggle(option.value)}
                      className='cursor-pointer'
                    >
                      <span
                        aria-hidden='true'
                        className={cn(
                          'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border',
                          isSelected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-input',
                        )}
                      >
                        <CheckIcon
                          className={cn('h-3.5 w-3.5', !isSelected && 'invisible')}
                        />
                      </span>
                      {option.icon && (
                        <option.icon className='text-muted-foreground mr-2 h-4 w-4' />
                      )}
                      <span>{option.label}</span>
                      <span className='sr-only'>
                        {isSelected ? '(seleccionado)' : ''}
                      </span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
              {value.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => onValueChange([])}
                      className='cursor-pointer justify-center'
                    >
                      Limpiar selección
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  },
)
