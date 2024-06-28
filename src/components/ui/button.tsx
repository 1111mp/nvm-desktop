import { forwardRef, ReactNode } from "react";
import { Slot } from "@radix-ui/react-slot";
import { ReloadIcon } from "@radix-ui/react-icons";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center gap-1 justify-center whitespace-nowrap rounded-md text-sm font-medium transition duration-200 ease-out active:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        tag: "border border-primary text-primary hover:text-primary/80 hover:border-primary/80"
      },
      size: {
        sm: "h-6 rounded-md px-2 text-xs",
        md: "h-8 px-3 py-2 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9"
      },
      animate: {
        true: "active:scale-[0.97]",
        false: ""
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      animate: true
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
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
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        disabled={disabled || loading}
        className={cn(buttonVariants({ variant, animate, size, className }))}
        ref={ref}
        {...props}
      >
        {loading ? <ReloadIcon className="animate-spin" /> : icon}
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
