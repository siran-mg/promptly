"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface FilterTagProps {
  label: string;
  value: string;
  paramName: string;
  paramValue?: string;
  onClear?: () => void;
}

export function FilterTag({ label, value, paramName, paramValue, onClear }: FilterTagProps) {
  const router = useRouter();
  const t = useTranslations();

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      // Get the current URL
      const url = new URL(window.location.href);

      if (paramValue && paramName === 'type') {
        // For type filters, we need to handle multiple values
        const currentTypes = url.searchParams.get(paramName)?.split(',') || [];
        // Remove the specific type
        const newTypes = currentTypes.filter(t => t !== paramValue);

        if (newTypes.length === 0) {
          // If no types left, remove the parameter
          url.searchParams.delete(paramName);
        } else {
          // Otherwise, update with remaining types
          url.searchParams.set(paramName, newTypes.join(','));
        }
      } else {
        // For other filters, just remove the parameter
        url.searchParams.delete(paramName);
      }

      router.push(url.pathname + url.search);
    }
  };

  return (
    <div className="bg-amber-100 text-amber-800 px-2 md:px-3 py-1 md:py-1.5 rounded-full flex items-center shadow-sm">
      <span className="mr-0.5 md:mr-1 text-[10px] md:text-xs">{label}:</span>
      <span className="text-[10px] md:text-xs font-medium mr-0.5 md:mr-1 truncate max-w-[100px] md:max-w-[150px]">{value}</span>
      <button
        onClick={handleClear}
        className="ml-0.5 md:ml-1 bg-amber-200 hover:bg-amber-300 rounded-full p-0.5 transition-colors"
        aria-label={t('appointments.filter.removeFilter', { label })}
      >
        <X className="h-2.5 w-2.5 md:h-3 md:w-3 text-amber-800" />
      </button>
    </div>
  );
}
