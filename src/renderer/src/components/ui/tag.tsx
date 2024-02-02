import { forwardRef } from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@renderer/lib/utils";

const labelVariants = cva("px-2 text-xs leading-5 rounded", {
  variants: {
    color: {
      default: "bg-accent",
      amber: "text-amber-800 bg-amber-200 dark:text-amber-200 dark:bg-amber-800",
      emerald: "text-emerald-800 bg-emerald-200 dark:text-emerald-200 dark:bg-emerald-800",
      lime: "text-lime-800 bg-lime-200 dark:text-lime-200 dark:bg-lime-800",
      purple: "text-purple-800 bg-purple-200 dark:text-purple-200 dark:bg-purple-800",
      neutral: "text-neutral-800 bg-neutral-200 dark:text-neutral-200 dark:bg-neutral-800",
      rose: "text-rose-800 bg-rose-200 dark:text-rose-200 dark:bg-rose-800",
      sky: "text-sky-800 bg-sky-200 dark:text-sky-200 dark:bg-sky-800",
      indigo: "text-indigo-800 bg-indigo-200 dark:text-indigo-200 dark:bg-indigo-800",
      zinc: "text-zinc-800 bg-zinc-200 dark:text-zinc-200 dark:bg-zinc-800",
      green: "text-green-800 bg-green-200 dark:text-green-200 dark:bg-green-800"
    }
  },
  defaultVariants: {
    color: "default"
  }
});

const Tag = forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>
>(({ className, color, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn(labelVariants({ color }), className)} {...props} />
));
Tag.displayName = "Tag";

export { Tag };
