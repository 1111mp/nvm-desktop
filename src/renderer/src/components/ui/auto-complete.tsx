import { memo, useCallback, useRef, useState } from "react";
import {
  Command,
  CommandInput,
  CommandGroup,
  CommandList,
  CommandItem,
  CommandEmpty
} from "./command";
import { motion, AnimatePresence } from "framer-motion";
import { CheckIcon } from "@radix-ui/react-icons";
import { useI18n } from "@renderer/app-context";

type AutoCompleteProps = {
  value?: string;
  options?: string[];
  placeholder?: string;
  shouldFilter?: boolean;
  onChange?: (value: string) => void;
};

const DefMirrors = ["https://nodejs.org/dist", "https://npmmirror.com/mirrors/node"];

const AutoComplete: React.FC<AutoCompleteProps> = memo(
  ({ value: valueProp = "", options = [], placeholder = "", shouldFilter = true, onChange }) => {
    const [open, setOpen] = useState<boolean>(false);
    const [value, setValue] = useState<string>(valueProp);

    const input = useRef<HTMLInputElement>(null);
    const i18n = useI18n();

    const onKeyDown = useCallback(
      (evt: React.KeyboardEvent<HTMLDivElement>) => {
        evt.stopPropagation();

        if (!input.current) return;

        switch (evt.key) {
          case "Enter": {
            if (![...DefMirrors, ...options].includes(value)) {
              evt.preventDefault();
            }
          }
          case "Escape": {
            input.current?.blur();
          }
        }
      },
      [value, options]
    );

    const onValueChange = useCallback(
      (value: string) => {
        setValue(value);
        onChange?.(value);
      },
      [onChange]
    );

    const onSelect = useCallback(
      (value: string) => {
        setValue(value);
        onChange?.(value);

        setTimeout(() => {
          input.current?.blur();
        });
      },
      [onChange]
    );

    return (
      <Command shouldFilter={shouldFilter} className="overflow-visible" onKeyDown={onKeyDown}>
        <CommandInput
          ref={input}
          value={value}
          className="h-8"
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onValueChange={onValueChange}
        />
        <div className="relative mt-1">
          <AnimatePresence>
            {open && (
              <motion.div
                className="absolute top-0 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md"
                initial={{ opacity: 0, translateY: "-0.5rem" }}
                animate={{ opacity: 1, translateY: "0" }}
                exit={{ opacity: 0, translateY: "-0.5rem" }}
                transition={{ duration: 0.3 }}
              >
                <CommandList className="max-h-56 [overflow:overlay]">
                  <CommandEmpty>No results found.</CommandEmpty>
                  {options.length ? (
                    <CommandGroup heading={i18n("Custom")}>
                      {options.map((optValue) => (
                        <CommandItem
                          key={optValue}
                          value={optValue}
                          title={optValue}
                          className="gap-1"
                          onSelect={onSelect}
                        >
                          <span className="flex-1 truncate">{optValue}</span>
                          {optValue === value ? <CheckIcon /> : null}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ) : null}
                  <CommandGroup heading={i18n("Default")}>
                    {DefMirrors.map((optValue) => (
                      <CommandItem
                        key={optValue}
                        value={optValue}
                        title={optValue}
                        className="gap-1"
                        onSelect={onSelect}
                      >
                        <span className="flex-1 truncate">{optValue}</span>
                        {optValue === value ? <CheckIcon /> : null}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Command>
    );
  }
);

export { DefMirrors, AutoComplete, type AutoCompleteProps };
