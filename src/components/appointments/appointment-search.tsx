"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";

interface AppointmentSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function AppointmentSearch({ searchQuery, setSearchQuery }: AppointmentSearchProps) {
  const hasSearch = searchQuery.trim().length > 0;
  const t = useTranslations();

  return (
    <div className="relative flex-1">
      <Search className={`absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 ${hasSearch ? 'text-amber-600' : 'text-indigo-500'}`} />
      <Input
        type="search"
        placeholder={t('appointments.search.placeholder')}
        className={`pl-8 md:pl-10 h-9 md:h-10 text-sm ${hasSearch
          ? 'border-amber-300 bg-amber-50 focus-visible:ring-amber-500'
          : 'border-indigo-200 focus-visible:ring-indigo-500'}`}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      {hasSearch && (
        <button
          className="absolute right-2.5 md:right-3 top-1/2 -translate-y-1/2 text-[10px] md:text-xs font-medium text-amber-700 hover:text-amber-900"
          onClick={() => setSearchQuery('')}
        >
          {t('appointments.search.clear')}
        </button>
      )}
    </div>
  );
}
