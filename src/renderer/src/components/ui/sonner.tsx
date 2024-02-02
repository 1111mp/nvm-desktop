import { Toaster as Sonner } from "sonner";
import { useAppContext } from "../../app-context";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useAppContext();

  return (
    <Sonner
      expand
      position="top-center"
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background dark:group-[.toaster]:bg-accent group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          title: "group-[.toaster]:text-foreground",
          success: "group-[.toaster]:text-green-500",
          error: "group-[.toaster]:text-red-500"
        }
      }}
      {...props}
    />
  );
};

export { Toaster };
