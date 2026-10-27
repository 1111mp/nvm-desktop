import { Search, X } from 'lucide-react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from './input-group';

export function DataTableSearch({
  value,
  onChange,
  placeholder,
  className,
  autoFocus = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  autoFocus?: boolean;
}) {
  const { t } = useTranslation();
  const input = useRef<HTMLInputElement>(null);
  return (
    <InputGroup
      className={cn(
        'h-8 w-56 max-w-full rounded-lg border-0 bg-muted/50 shadow-none transition-colors hover:bg-muted/70 has-[[data-slot=input-group-control]:focus-visible]:ring-2 has-[[data-slot=input-group-control]:focus-visible]:ring-primary/20 dark:bg-muted/40',
        className,
      )}
    >
      <InputGroupAddon>
        <Search className='size-3.5 text-muted-foreground' />
      </InputGroupAddon>
      <InputGroupInput
        ref={input}
        type='text'
        autoFocus={autoFocus}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className='h-8 text-xs md:text-xs'
      />
      {value && (
        <InputGroupAddon align='inline-end'>
          <InputGroupButton
            size='icon-xs'
            aria-label={t('Table-Clear-Search')}
            title={t('Table-Clear-Search')}
            onClick={() => {
              onChange('');
              input.current?.focus();
            }}
          >
            <X className='size-3' />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}
