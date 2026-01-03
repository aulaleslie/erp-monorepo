'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const NO_MATCHES = 'No matching options';

interface SearchableDropdownProps extends Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange'> {
  label: string;
  value: string;
  options: string[];
  placeholder?: string;
  helperText?: string;
  onChange: (value: string) => void;
}

export function SearchableDropdown({
  label,
  value,
  options,
  placeholder,
  helperText,
  onChange,
  id,
  className,
  ...rest
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const generatedId = React.useId();
  const inputId = id ?? `searchable-dropdown-${generatedId}`;
  const listboxId = `${inputId}-listbox`;

  const normalizedOptions = React.useMemo(
    () => Array.from(new Set(options)).filter(Boolean),
    [options],
  );

  const filteredOptions = React.useMemo(() => {
    if (!value) {
      return normalizedOptions;
    }
    const normalizedQuery = value.trim().toLowerCase();
    return normalizedOptions.filter((option) => option.toLowerCase().includes(normalizedQuery));
  }, [normalizedOptions, value]);

  React.useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div className={cn('space-y-1 relative', className)} ref={containerRef}>
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        <Label htmlFor={inputId} className="text-sm text-foreground">
          {label}
        </Label>
        {helperText ? <span>{helperText}</span> : null}
      </div>
      <div className="relative">
        <Input
          id={inputId}
          role="combobox"
          aria-controls={listboxId}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          value={value}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            setIsOpen(true);
            onChange(event.target.value);
          }}
          autoComplete="off"
          className="pr-3"
          {...rest}
        />
        {isOpen && (
          <div
            id={listboxId}
            role="listbox"
            className="absolute left-0 right-0 z-50 mt-1 max-h-44 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-lg"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  type="button"
                  key={option}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent/70"
                  onMouseDown={() => handleSelect(option)}
                >
                  {option}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-xs text-muted-foreground">{NO_MATCHES}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
