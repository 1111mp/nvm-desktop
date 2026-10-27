import { Button } from '@/components/ui/button';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { Check, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function CodeSnippet({ children }: { children: string }) {
  const [copied, copy] = useCopyToClipboard();
  const { t } = useTranslation();
  return (
    <div className='flex min-w-0 items-start gap-2 rounded-lg bg-background/80 p-3'>
      <code className='min-w-0 flex-1 whitespace-pre-wrap break-all font-mono text-xs leading-6 text-foreground select-text'>
        {children}
      </code>
      <Button
        variant='ghost'
        size='icon-xs'
        className='shrink-0 text-muted-foreground'
        aria-label={t(copied === children ? 'Code-Copied' : 'Code-Copy')}
        title={t(copied === children ? 'Code-Copied' : 'Code-Copy')}
        onClick={() => copy(children)}
      >
        {copied === children ? <Check /> : <Copy />}
      </Button>
    </div>
  );
}
