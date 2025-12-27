import { Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvailabilityIndicatorProps {
  isAvailable: boolean | null;
  loading: boolean;
  itemName: string;
  errorMessage?: string | null;
  className?: string;
}

export const AvailabilityIndicator = ({
  isAvailable,
  loading,
  itemName,
  errorMessage,
  className,
}: AvailabilityIndicatorProps) => {
  if (loading) {
    return (
      <div className={cn("flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200", className)}>
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        <span className="text-sm text-slate-500 font-medium">Checking availability for {itemName}...</span>
      </div>
    );
  }

  if (isAvailable === null) {
    return null;
  }

  if (isAvailable) {
    return (
      <div className={cn("flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-200", className)}>
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500">
          <Check className="h-4 w-4 text-white" />
        </div>
        <div>
          <span className="text-sm font-bold text-green-700">{itemName}</span>
          <span className="text-sm text-green-600 ml-1">- Available for selected dates</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2 p-3 rounded-xl bg-red-50 border border-red-200", className)}>
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500">
          <X className="h-4 w-4 text-white" />
        </div>
        <div>
          <span className="text-sm font-bold text-red-700">{itemName}</span>
          <span className="text-sm text-red-600 ml-1">- Not available</span>
        </div>
      </div>
      {errorMessage && (
        <p className="text-xs text-red-600 ml-8">{errorMessage}</p>
      )}
      <p className="text-xs text-red-500 ml-8 font-medium">Please select different dates to continue.</p>
    </div>
  );
};
