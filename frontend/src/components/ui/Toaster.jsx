import { Toaster } from "sonner";

export default function AppToaster() {
  return (
    <Toaster
      richColors
      position="top-right"
      toastOptions={{
        classNames: {
          toast: "bg-card border border-border text-foreground shadow-md",
        },
      }}
    />
  );
}
