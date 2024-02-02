import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { useRouteError } from "react-router-dom";

export function ErrorBoundary() {
  let error = useRouteError() as Error;

  return (
    <div className="h-80 flex flex-col items-center justify-center gap-2">
      <p className="flex items-center gap-2 text-destructive text-lg font-medium">
        <ExclamationTriangleIcon className="text-destructive scale-150" />
        Sorry, something went wrong.
      </p>
      <p className="text-muted-foreground">{error.message}</p>
    </div>
  );
}
