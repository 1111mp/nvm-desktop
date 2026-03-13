import { useEffect, useRef, useState } from 'react';
import { Label as LabelPrimitive } from 'radix-ui';
import { CopyIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

import { useCopyToClipboard } from '@/hooks';
import { cn } from '@/lib/utils';

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot='label'
      className={cn(
        'flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

function LabelCopyable({
  ref,
  className,
  children,
  rootClassName,
  title,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root> & {
  rootClassName?: string;
  title?: string;
}) {
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
          className={cn(
            'text-sm leading-none font-normal select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
            className,
          )}
          title={title}
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
          <TooltipContent>{did ? 'Copied' : 'Copy'}</TooltipContent>
        </Tooltip>
      </>
    </span>
  );
}

export { Label, LabelCopyable };
