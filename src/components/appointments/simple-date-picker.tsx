"use client";

import * as React from "react";
import { format, addDays, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, startOfWeek } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";

interface SimpleDatePickerProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  disabled?: (date: Date) => boolean;
  className?: string;
}

export function SimpleDatePicker({
  selected,
  onSelect,
  disabled,
  className,
}: SimpleDatePickerProps) {
  const currentLocale = useLocale();
  const [currentMonth, setCurrentMonth] = React.useState(selected || new Date());

  // Set up locales for the calendar
  const locales = {
    "en": enUS,
    "fr": fr,
  };

  // Get the current date-fns locale
  const currentDateFnsLocale = locales[currentLocale as "en" | "fr"] || enUS;

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get the first day of the week based on locale (0 for Sunday, 1 for Monday)
  const weekStartsOn = currentLocale === 'fr' ? 1 : 0;

  // Calculate the start day based on the locale's week start
  const firstDayOfWeek = startOfWeek(monthStart, { locale: currentDateFnsLocale, weekStartsOn });
  const daysToFirstDay = Math.round((monthStart.getTime() - firstDayOfWeek.getTime()) / (1000 * 60 * 60 * 24));

  // Add days from previous month based on locale's week start
  const prevDays = Array.from({ length: daysToFirstDay }, (_, i) =>
    addDays(monthStart, -daysToFirstDay + i)
  );

  // Add days from next month to complete the grid
  const totalDaysInGrid = Math.ceil((days.length + daysToFirstDay) / 7) * 7;
  const nextDaysCount = totalDaysInGrid - days.length - daysToFirstDay;
  const nextDays = Array.from({ length: nextDaysCount }, (_, i) =>
    addDays(monthEnd, i + 1)
  );

  const allDays = [...prevDays, ...days, ...nextDays];

  // Create weeks array
  const weeks: Date[][] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }

  const isDisabled = (date: Date) => {
    if (disabled) {
      return disabled(date);
    }
    return false;
  };

  // Get day names based on locale
  const getDayNames = () => {
    const weekDays = [];
    const firstDayOfWeek = weekStartsOn;

    for (let i = 0; i < 7; i++) {
      const dayIndex = (firstDayOfWeek + i) % 7;
      if (currentLocale === 'fr') {
        // French day abbreviations
        weekDays.push(['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'][dayIndex]);
      } else {
        // English day abbreviations
        weekDays.push(['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][dayIndex]);
      }
    }

    return weekDays;
  };

  // Get the localized day names
  const dayNames = getDayNames();

  // Get the localized text for the footer
  const footerText = currentLocale === 'fr'
    ? "Sélectionnez une date pour votre rendez-vous"
    : "Select a date to book your appointment";

  return (
    <div className={cn("p-3 w-full max-w-sm", className)}>
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePreviousMonth}
          className="h-7 w-7"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="font-medium">
          {format(currentMonth, "MMMM yyyy", { locale: currentDateFnsLocale })}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleNextMonth}
          className="h-7 w-7"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-sm text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      <div className="space-y-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1">
            {week.map((day, dayIndex) => {
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelectedDay = selected ? isSameDay(day, selected) : false;
              const isTodayDate = isToday(day);
              const isDisabledDay = isDisabled(day);

              return (
                <Button
                  key={dayIndex}
                  variant={isSelectedDay ? "default" : "ghost"}
                  size="icon"
                  className={cn(
                    "h-9 w-9 p-0 font-normal",
                    !isCurrentMonth && "text-muted-foreground opacity-50",
                    isSelectedDay && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                    isTodayDate && !isSelectedDay && "border border-primary",
                    isDisabledDay && "opacity-50 cursor-not-allowed"
                  )}
                  disabled={isDisabledDay}
                  onClick={() => onSelect && onSelect(day)}
                >
                  {format(day, "d", { locale: currentDateFnsLocale })}
                </Button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-3 text-center text-xs text-muted-foreground">
        {footerText}
      </div>
    </div>
  );
}
