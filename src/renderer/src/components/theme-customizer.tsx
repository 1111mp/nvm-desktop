import { Button, Label, Popover, PopoverContent, PopoverTrigger } from "./ui";
import { CheckIcon, ColorWheelIcon } from "@radix-ui/react-icons";

import { cn } from "@renderer/lib/utils";
import { useAppContext } from "@renderer/app-context";

const themes = [
  {
    name: "zinc",
    label: "Zinc",
    activeColor: {
      light: "240 5.9% 10%",
      dark: "240 5.2% 33.9%"
    }
  },
  {
    name: "slate",
    label: "Slate",
    activeColor: {
      light: "215.4 16.3% 46.9%",
      dark: "215.3 19.3% 34.5%"
    }
  },
  {
    name: "stone",
    label: "Stone",
    activeColor: {
      light: "25 5.3% 44.7%",
      dark: "33.3 5.5% 32.4%"
    }
  },
  {
    name: "gray",
    label: "Gray",
    activeColor: {
      light: "220 8.9% 46.1%",
      dark: "215 13.8% 34.1%"
    }
  },
  {
    name: "neutral",
    label: "Neutral",
    activeColor: {
      light: "0 0% 45.1%",
      dark: "0 0% 32.2%"
    }
  },
  {
    name: "red",
    label: "Red",
    activeColor: {
      light: "0 72.2% 50.6%",
      dark: "0 72.2% 50.6%"
    }
  },
  {
    name: "rose",
    label: "Rose",
    activeColor: {
      light: "346.8 77.2% 49.8%",
      dark: "346.8 77.2% 49.8%"
    }
  },
  {
    name: "orange",
    label: "Orange",
    activeColor: {
      light: "24.6 95% 53.1%",
      dark: "20.5 90.2% 48.2%"
    }
  },
  {
    name: "green",
    label: "Green",
    activeColor: {
      light: "142.1 76.2% 36.3%",
      dark: "142.1 70.6% 45.3%"
    }
  },
  {
    name: "blue",
    label: "Blue",
    activeColor: {
      light: "221.2 83.2% 53.3%",
      dark: "217.2 91.2% 59.8%"
    }
  },
  {
    name: "yellow",
    label: "Yellow",
    activeColor: {
      light: "47.9 95.8% 53.1%",
      dark: "47.9 95.8% 53.1%"
    }
  },
  {
    name: "violet",
    label: "Violet",
    activeColor: {
      light: "262.1 83.3% 57.8%",
      dark: "263.4 70% 50.4%"
    }
  }
];

export function ThemeCustomizer() {
  const { theme: mode, color, setColor } = useAppContext();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button className="theme-customizer" size="sm" title="Color" variant="ghost">
          <ColorWheelIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="z-40 w-[340px] rounded-[0.5rem] bg-white p-3 dark:bg-zinc-950"
      >
        <div className="space-y-1.5">
          <Label className="text-xs">Color</Label>
          <div className="grid grid-cols-3 gap-2">
            {themes.map(({ name, label, activeColor }) => {
              const isActive = color === name;

              return (
                <Button
                  key={name}
                  variant="outline"
                  className={cn("justify-start", isActive && "border-2 border-primary")}
                  style={
                    {
                      "--theme-primary": `hsl(${activeColor[mode === "dark" ? "dark" : "light"]})`
                    } as React.CSSProperties
                  }
                  onClick={() => {
                    setColor(name);
                  }}
                >
                  <span
                    className={cn(
                      "mr-1 flex h-5 w-5 shrink-0 -translate-x-1 items-center justify-center rounded-full bg-[--theme-primary]"
                    )}
                  >
                    {isActive && <CheckIcon className="h-4 w-4 text-white" />}
                  </span>
                  {label}
                </Button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
