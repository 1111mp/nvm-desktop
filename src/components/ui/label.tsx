import { useEffect, useRef, useState } from 'react';
import { CheckIcon, CopyIcon } from 'lucide-react';
import { Button } from './button';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

import { useCopyToClipboard } from '@/hooks';
import { cn } from '@/lib/utils';
function Label({ className, ...props }: React.ComponentProps<'label'>) {
  return (
    <label
      data-slot='label'
      className={cn(
        'flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 peer-data-disabled:cursor-not-allowed peer-data-disabled:opacity-50',
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
}: React.ComponentProps<'label'> & {
  rootClassName?: string;
  title?: string;
}) {
  const { t } = useTranslation();
  const [did, setDid] = useState<boolean>(false);

  const [, copy] = useCopyToClipboard();

  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <span
      className={cn('inline-flex min-w-0 items-center gap-1.5', rootClassName)}
    >
      <>
        <label
          ref={ref}
          className={cn(
            'text-sm leading-none font-normal select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 peer-data-disabled:cursor-not-allowed peer-data-disabled:opacity-50',
            className,
          )}
          title={title}
          {...props}
        >
          {children}
        </label>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type='button'
                variant='ghost'
                size='icon-xs'
                className='shrink-0 text-muted-foreground'
                aria-label={t(did ? 'Clipboard-Copied' : 'Clipboard-Copy')}
                onClick={async (event) => {
                  event.stopPropagation();
                  const text =
                    typeof children === 'string' ? children : title || '';
                  if (!(await copy(text))) return;
                  setDid(true);
                  if (timer.current) clearTimeout(timer.current);
                  timer.current = setTimeout(() => setDid(false), 3000);
                }}
              >
                {did ? <CheckIcon /> : <CopyIcon />}
              </Button>
            }
          />
          <TooltipContent>
            {t(did ? 'Clipboard-Copied' : 'Clipboard-Copy')}
          </TooltipContent>
        </Tooltip>
      </>
    </span>
  );
}

export { Label, LabelCopyable };
