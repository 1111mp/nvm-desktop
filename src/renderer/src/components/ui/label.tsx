import { forwardRef, useEffect, useRef, useState } from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { CopyIcon } from "@radix-ui/react-icons";
import { Tooltip, TooltipContent, TooltipPortal, TooltipTrigger } from "./tooltip";

import { cn } from "@renderer/lib/utils";
import { useCopyToClipboard } from "@renderer/hooks";

const labelVariants = cva(
  "text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

export type LabelProps = React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
  VariantProps<typeof labelVariants>;

const Label = forwardRef<React.ElementRef<typeof LabelPrimitive.Root>, LabelProps>(
  ({ className, ...props }, ref) => {
    return <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props} />;
  }
);
Label.displayName = LabelPrimitive.Root.displayName;

const LabelCopyable = forwardRef<React.ElementRef<typeof LabelPrimitive.Root>, LabelProps>(
  ({ className, children, ...props }, ref) => {
    const [open, setOpen] = useState<boolean>(false);
    const [did, setDid] = useState<boolean>(false);

    const [, copy] = useCopyToClipboard();

    let timer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
      return () => {
        timer.current && clearTimeout(timer.current);
      };
    }, []);

    return (
      <span className="flex items-center space-x-1">
        <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props}>
          {children}
        </LabelPrimitive.Root>
        <Tooltip open={open}>
          <TooltipTrigger asChild>
            <CopyIcon
              className="inline-block text-primary cursor-pointer hover:opacity-70 active:opacity-80"
              onClick={(evt) => {
                evt.stopPropagation();
                copy(children as unknown as string);
                setDid(true);

                timer.current && clearTimeout(timer.current);
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
            <TooltipContent className="text-accent-foreground bg-accent">
              {did ? "Copied" : "Copy"}
            </TooltipContent>
          </TooltipPortal>
        </Tooltip>
      </span>
    );
  }
);

LabelCopyable.displayName = "LabelCopyable";

export { Label, LabelCopyable };
