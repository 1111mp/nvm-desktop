import "./global.css";

import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { AppProvider } from "./app-context";
import { Toaster, TooltipProvider } from "@renderer/components/ui";

export default function App() {
  return (
    <AppProvider>
      <TooltipProvider delayDuration={200}>
        <RouterProvider router={router} />
      </TooltipProvider>
      <Toaster />
    </AppProvider>
  );
}
