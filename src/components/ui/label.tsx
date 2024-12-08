import { useEffect, useRef, useState } from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cva, type VariantProps } from 'class-variance-authority';
import { CopyIcon } from '@radix-ui/react-icons';
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from './tooltip';

import { useCopyToClipboard } from '@/hooks';
import { cn } from '@/lib/utils';

const labelVariants = cva(
  'text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
);

export type LabelProps = React.ComponentProps<typeof LabelPrimitive.Root> &
  VariantProps<typeof labelVariants>;

const Label: React.FC<LabelProps> = ({ ref, className, ...props }) => {
  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(labelVariants(), className)}
      {...props}
    />
  );
};
Label.displayName = LabelPrimitive.Root.displayName;

const LabelCopyable: React.FC<
  LabelProps & { rootClassName?: string; title?: string }
> = ({ ref, className, children, rootClassName, title, ...props }) => {
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
              className='inline-block text-primary cursor-pointer hover:opacity-70 active:opacity-80'
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
          <TooltipPortal>
            <TooltipContent className='text-accent-foreground bg-accent'>
              {did ? 'Copied' : 'Copy'}
            </TooltipContent>
          </TooltipPortal>
        </Tooltip>
      </>
    </span>
  );
};

LabelCopyable.displayName = 'LabelCopyable';

export { Label, LabelCopyable };
