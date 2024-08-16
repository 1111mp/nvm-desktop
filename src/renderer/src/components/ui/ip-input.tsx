import { forwardRef, memo, useRef, useState } from "react";
import { cn } from "@renderer/lib/utils";

type IpInputProps = {
  className?: string;
  disabled?: boolean;
  value?: string;
  onChange?: (value: string) => void;
};

const IpInput: React.FC<IpInputProps> = memo(
  forwardRef<HTMLDivElement, IpInputProps>(
    ({ className, disabled = false, value: propValue = "...", onChange }, ref) => {
      const [value, setValue] = useState<string[]>(() =>
        (propValue === null ? "..." : propValue)?.split(".")
      );
      const [focus, setFocus] = useState<boolean>(false);

      const inputs = useRef<{ [key: number]: HTMLInputElement | null }>({});

      const onValueChange = (val: string[]) => {
        const value = val.join(".");
        onChange?.(value === "..." ? "" : value);
      };

      const onchangeHandle = (evt: React.ChangeEvent<HTMLInputElement>, index: number) => {
        let val = parseInt(evt.target.value);
        if (evt.target.value !== "" && isNaN(val)) {
          return evt.preventDefault();
        }

        if (evt.target.value !== "" && !isValidIPItemValue(val)) {
          val = 255;
        }

        let dValue = [...value];
        dValue[index] = evt.target.value;
        setValue(dValue);
        onValueChange(dValue);

        if (!isNaN(val) && String(val).length === 3 && index < 3) {
          inputs.current[index + 1]?.focus();
        }
      };

      const onKeyDownHandle = (evt: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        let domId = index;
        const cursorPosition = getRange(evt.currentTarget);
        if (
          (evt.key === "ArrowLeft" || evt.key === "Backspace") &&
          cursorPosition.end === 0 &&
          index > 0
        ) {
          domId = index - 1;
        }
        if (
          evt.key === "ArrowRight" &&
          cursorPosition.end === evt.currentTarget.value.length &&
          index < 3
        ) {
          domId = index + 1;
        }
        if (evt.key === "." || evt.key === "Decimal") {
          evt.preventDefault();
          if (index < 3) {
            domId = index + 1;
          }
        }
        inputs.current[domId]?.focus();
      };

      const onPasteHandle = (evt: React.ClipboardEvent<HTMLInputElement>, index: number) => {
        if (!evt.clipboardData || !evt.clipboardData.getData) {
          return;
        }

        const pasteData = evt.clipboardData.getData("text/plain");
        if (!pasteData) {
          return;
        }

        const pValue = pasteData.split(".").map((v) => parseInt(v));
        if (pValue.length !== 4 - index) {
          return;
        }

        if (!pValue.every(isValidIPItemValue)) {
          return;
        }

        const dValue = [...value];
        pValue.forEach((val, j) => {
          dValue[index + j] = String(val);
        });

        setValue(dValue);
        onValueChange(dValue);
        return evt.preventDefault();
      };

      return (
        <div
          ref={ref}
          className={cn(
            "flex h-8 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm transition-colors ring-1 ring-transparent",
            focus && "ring-ring",
            className
          )}
        >
          {value.map((val, i) => (
            <div key={i} className="inline-block ">
              <input
                disabled={disabled}
                type="text"
                ref={(ref) => (inputs.current[i] = ref)}
                value={isNaN(parseInt(val)) ? "" : val}
                className="w-8 border-none outline-none bg-transparent focus:border-none focus:outline-none text-center disabled:cursor-not-allowed disabled:opacity-50"
                onFocus={() => setFocus(true)}
                onBlur={() => setFocus(false)}
                onChange={(evt) => onchangeHandle(evt, i)}
                onKeyDown={(evt) => onKeyDownHandle(evt, i)}
                onPaste={(evt) => onPasteHandle(evt, i)}
              />
              {i !== 3 ? <i>.</i> : false}
            </div>
          ))}
        </div>
      );
    }
  )
);

/**
 * Function to get cursor position
 */
function getRange(el: HTMLInputElement | HTMLTextAreaElement): {
  begin: number;
  end: number;
  result: string;
} {
  const ret = { begin: 0, end: 0, result: "" };
  // Standard
  ret.begin = el.selectionStart ?? 0;
  ret.end = el.selectionEnd ?? 0;
  ret.result = el.value.substring(ret.begin, ret.end);

  el.focus();
  return ret;
}

function isValidIPItemValue(val: number) {
  return !isNaN(val) && val >= 0 && val <= 255;
}

export { IpInput };
