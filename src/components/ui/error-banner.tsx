import { AlertCircle } from "lucide-react";
import { ApiClientError } from "@/api/types";

export function ErrorBanner({ error, testId }: { error: unknown; testId?: string }) {
  if (!error) return null;
  let message: string;
  if (error instanceof ApiClientError) {
    message = `[${error.code}] ${error.message}`;
  } else if (error instanceof Error) {
    message = error.message;
  } else {
    message = String(error);
  }
  return (
    <div
      role="alert"
      data-testid={testId}
      className="flex items-start gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{message}</span>
    </div>
  );
}
