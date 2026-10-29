import * as React from 'react';
import { Progress as ProgressPrimitive } from '@base-ui/react/progress';

import { cn } from '@/lib/utils';

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot='progress'
      value={value}
      className={cn(
        'relative flex h-1 w-full items-center overflow-x-hidden rounded-full bg-muted',
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Track className='h-full w-full'>
        <ProgressPrimitive.Indicator
          data-slot='progress-indicator'
          // Without an explicit width, an indeterminate block fills its track
          // and looks complete before the server reports the package size.
          className='h-full bg-primary transition-[width] data-indeterminate:w-1/3 data-indeterminate:animate-pulse motion-reduce:animate-none'
        />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  );
}

export { Progress };
