import { Slot } from '@radix-ui/react-slot';
import { LoaderCircle } from 'lucide-react';

import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  "cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[background-color,color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 ring-ring/10 dark:ring-ring/20 dark:outline-ring/40 outline-ring/50 focus-visible:ring-4 focus-visible:outline-1 aria-invalid:focus-visible:ring-0",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90',
        outline:
          'border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        tag: 'border border-primary text-primary hover:text-primary/80 hover:border-primary/80',
      },
      size: {
        sm: 'h-6 rounded-md px-2 text-xs',
        md: 'h-8 px-3 py-2 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'size-9',
      },
      animate: {
        true: 'active:scale-[0.97]',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      animate: true,
    },
  },
);

function Button({
  className,
  variant,
  animate = true,
  disabled = false,
  loading = false,
  icon = null,
  size,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot='button'
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, animate, size, className }))}
      {...props}
    >
      {loading ? <LoaderCircle className='animate-spin' /> : icon}
      {children}
    </Comp>
  );
}
Button.displayName = 'Button';

export { Button, buttonVariants };
