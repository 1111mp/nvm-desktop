import { cn } from '@/lib/utils';

const Table: React.FC<React.ComponentProps<'table'>> = ({
  ref,
  className,
  ...props
}) => (
  <table
    ref={ref}
    className={cn('w-full caption-bottom text-sm', className)}
    {...props}
  />
);
Table.displayName = 'Table';

const TableHeader: React.FC<React.ComponentProps<'thead'>> = ({
  ref,
  className,
  ...props
}) => (
  <thead
    ref={ref}
    className={cn('[&_tr]:border-b bg-secondary', className)}
    {...props}
  />
);
TableHeader.displayName = 'TableHeader';

const TableBody: React.FC<React.ComponentProps<'tbody'>> = ({
  ref,
  className,
  ...props
}) => (
  <tbody
    ref={ref}
    className={cn('[&_tr:last-child]:border-0', className)}
    {...props}
  />
);
TableBody.displayName = 'TableBody';

const TableFooter: React.FC<React.ComponentProps<'tfoot'>> = ({
  ref,
  className,
  ...props
}) => (
  <tfoot
    ref={ref}
    className={cn(
      'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0',
      className,
    )}
    {...props}
  />
);
TableFooter.displayName = 'TableFooter';

const TableRow: React.FC<React.ComponentProps<'tr'>> = ({
  ref,
  className,
  ...props
}) => (
  <tr
    ref={ref}
    className={cn(
      'w-full flex border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
      className,
    )}
    {...props}
  />
);
TableRow.displayName = 'TableRow';

const TableHead: React.FC<React.ComponentProps<'th'>> = ({
  ref,
  className,
  ...props
}) => (
  <th
    ref={ref}
    className={cn(
      'h-9 flex flex-1 items-center px-2 text-left align-middle font-light text-secondary-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
      className,
    )}
    {...props}
  />
);
TableHead.displayName = 'TableHead';

const TableCell: React.FC<React.ComponentProps<'td'>> = ({
  ref,
  className,
  ...props
}) => (
  <td
    ref={ref}
    className={cn(
      'flex flex-1 p-2 items-center [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
      className,
    )}
    {...props}
  />
);
TableCell.displayName = 'TableCell';

const TableCaption: React.FC<React.ComponentProps<'caption'>> = ({
  ref,
  className,
  ...props
}) => (
  <caption
    ref={ref}
    className={cn('mt-4 text-sm text-muted-foreground', className)}
    {...props}
  />
);
TableCaption.displayName = 'TableCaption';

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
