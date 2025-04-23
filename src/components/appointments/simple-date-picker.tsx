"use client";

import * as React from "react";
import { format, addDays, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  const [currentMonth, setCurrentMonth] = React.useState(selected || new Date());
  
  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Add days from previous month to start on Sunday
  const startDay = monthStart.getDay();
  const prevDays = Array.from({ length: startDay }, (_, i) => 
    addDays(monthStart, -startDay + i)
  );
  
  // Add days from next month to complete the grid
  const endDay = monthEnd.getDay();
  const nextDays = Array.from({ length: 6 - endDay }, (_, i) => 
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
          {format(currentMonth, "MMMM yyyy")}
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
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
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
                  {format(day, "d")}
                </Button>
              );
            })}
          </div>
        ))}
      </div>
      
      <div className="mt-3 text-center text-xs text-muted-foreground">
        Select a date to book your appointment
      </div>
    </div>
  );
}
