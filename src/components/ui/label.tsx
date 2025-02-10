import { useEffect, useRef, useState } from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cva, type VariantProps } from 'class-variance-authority';
import { CopyIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

import { useCopyToClipboard } from '@/hooks';
import { cn } from '@/lib/utils';

const labelVariants = cva(
  'text-sm leading-none font-normal select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
);

export type LabelProps = React.ComponentProps<typeof LabelPrimitive.Root> &
  VariantProps<typeof labelVariants>;

function Label({ className, ...props }: LabelProps) {
  return (
    <LabelPrimitive.Root
      data-slot='label'
      className={cn(labelVariants(), className)}
      {...props}
    />
  );
}
Label.displayName = LabelPrimitive.Root.displayName;

function LabelCopyable({
  ref,
  className,
  children,
  rootClassName,
  title,
  ...props
}: LabelProps & { rootClassName?: string; title?: string }) {
  const [open, setOpen] = useState<boolean>(false);
  const [did, setDid] = useState<boolean>(false);

  const [, copy] = useCopyToClipboard();

  const timer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <span className={cn('inline-block items-center space-x-1', rootClassName)}>
      <>
        <LabelPrimitive.Root
          ref={ref}
          className={cn(labelVariants(), className)}
          {...props}
        >
          {children}
        </LabelPrimitive.Root>
        <Tooltip open={open}>
          <TooltipTrigger asChild>
            <CopyIcon
              className='inline-block size-4 text-primary cursor-pointer hover:opacity-70 active:opacity-80'
              onClick={(evt) => {
                evt.stopPropagation();
                copy((children as unknown as string) || title || '');
                setDid(true);

                if (timer.current) clearTimeout(timer.current);
                timer.current = setTimeout(() => {
                  setDid(false);
                }, 3000);
              }}
              onMouseOver={() => {
                setOpen(true);
              }}
              onMouseLeave={() => {
                setOpen(false);
              }}
            />
          </TooltipTrigger>
          <TooltipContent className='text-accent-foreground bg-accent'>
            {did ? 'Copied' : 'Copy'}
          </TooltipContent>
        </Tooltip>
      </>
    </span>
  );
}
LabelCopyable.displayName = 'LabelCopyable';

export { Label, LabelCopyable };
