import { Button } from '@/components/ui/button';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { Check, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function CodeSnippet({ children }: { children: string }) {
  const [copied, copy] = useCopyToClipboard();
  const { t } = useTranslation();
  return (
    <div className='flex min-w-0 items-start gap-3 rounded-lg border border-border/70 bg-inset-70 p-3 text-popover-foreground'>
      <code
        className='min-w-0 flex-1 whitespace-pre-wrap break-all text-xs leading-6 select-text'
        // Accent themes may omit the font token; commands still need a monospace fallback.
        style={{
          fontFamily:
            'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace)',
        }}
      >
        {children}
      </code>
      <Button
        variant='secondary'
        size='icon-sm'
        className='shrink-0'
        aria-label={t(copied === children ? 'Code-Copied' : 'Code-Copy')}
        title={t(copied === children ? 'Code-Copied' : 'Code-Copy')}
        onClick={() => copy(children)}
      >
        {copied === children ? <Check /> : <Copy />}
      </Button>
    </div>
  );
}
