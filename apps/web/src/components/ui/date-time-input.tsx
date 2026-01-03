'use client';

import * as React from 'react';
import { CalendarClock, CalendarDays } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export interface DateTimeInputProps
  extends Omit<React.ComponentProps<typeof Input>, 'type'> {
  enableTime?: boolean;
  showIcon?: boolean;
  icon?: React.ReactNode;
}

const DateTimeInput = React.forwardRef<HTMLInputElement, DateTimeInputProps>(
  ({ enableTime = true, showIcon = true, icon, className, ...props }, ref) => {
    const inputType = enableTime ? 'datetime-local' : 'date';
    const iconNode =
      icon ?? (enableTime ? <CalendarClock className="h-4 w-4" /> : <CalendarDays className="h-4 w-4" />);

    return (
      <div className="relative">
        <Input
          {...props}
          ref={ref}
          type={inputType}
          className={cn(className, showIcon ? 'pr-10' : undefined)}
        />
        {showIcon && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {iconNode}
          </span>
        )}
      </div>
    );
  },
);

DateTimeInput.displayName = 'DateTimeInput';

export { DateTimeInput };
