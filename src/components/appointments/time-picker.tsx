"use client";

import * as React from "react";
import { useState } from "react";
import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  className?: string;
  availableSlots?: string[]; // New prop for available slots
  disabledSlots?: string[]; // New prop for disabled slots
  duration?: number; // Duration in minutes
}

export function TimePicker({
  value,
  onChange,
  className,
  availableSlots,
  disabledSlots = [],
  duration = 60 // Default duration is 60 minutes
}: TimePickerProps) {
  const [inputValue, setInputValue] = useState(value);
  const t = useTranslations();
  const [timeSlots, setTimeSlots] = useState<string[]>([]);

  // Generate time slots from 00:00 to 23:30 in 30-minute increments
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const formattedHour = hour.toString().padStart(2, "0");
        const formattedMinute = minute.toString().padStart(2, "0");
        slots.push(`${formattedHour}:${formattedMinute}`);
      }
    }
    return slots;
  };

  // Initialize time slots
  React.useEffect(() => {
    setTimeSlots(generateTimeSlots());
  }, []);

  // Filter time slots based on input value
  const filteredTimeSlots = timeSlots.filter(time =>
    time.toLowerCase().includes(inputValue.toLowerCase())
  );

  // Business hours (9:00 AM to 5:30 PM)
  const businessHours = timeSlots.filter(time => {
    const [hours, minutes] = time.split(":").map(Number);
    return (hours >= 9 && hours < 17) || (hours === 17 && minutes === 30);
  });

  // Check if a time slot is disabled
  const isDisabled = (time: string) => {
    // If we have available slots, check if this time is available
    if (availableSlots) {
      return !availableSlots.includes(time);
    }

    // Check if this time slot is directly disabled
    if (disabledSlots.includes(time)) {
      return true;
    }

    // Check if this time slot would overlap with a disabled slot based on duration
    // For example, if we select 9:00 and duration is 60 minutes, we need to check if 9:30 is disabled
    if (duration > 30) {
      const [hours, minutes] = time.split(":").map(Number);
      const startTime = new Date();
      startTime.setHours(hours, minutes, 0, 0);

      // Check each 30-minute increment within the duration
      for (let i = 30; i < duration; i += 30) {
        const nextTime = new Date(startTime);
        nextTime.setMinutes(nextTime.getMinutes() + i);

        const nextTimeStr = `${nextTime.getHours().toString().padStart(2, "0")}:${nextTime.getMinutes().toString().padStart(2, "0")}`;

        // If any of the time slots within the duration is disabled, the starting time should be disabled
        if (disabledSlots.includes(nextTimeStr)) {
          return true;
        }
      }
    }

    return false;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (timeRegex.test(e.target.value)) {
      onChange(e.target.value);
    }
  };

  const handleTimeSelect = (time: string) => {
    setInputValue(time);
    onChange(time);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {value || t('appointments.timePicker.selectTime')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 space-y-3">
          <Input
            placeholder={t('appointments.timePicker.timeFormat')}
            value={inputValue}
            onChange={handleInputChange}
            className="w-full"
          />

          <div className="font-medium text-sm">{t('appointments.timePicker.businessHours')}</div>
          <div className="grid grid-cols-4 gap-2">
            {businessHours.map((time) => (
              <Button
                key={time}
                variant={time === value ? "default" : "outline"}
                size="sm"
                onClick={() => handleTimeSelect(time)}
                className={cn(
                  "w-full",
                  isDisabled(time) && "opacity-50 cursor-not-allowed line-through"
                )}
                disabled={isDisabled(time)}
              >
                {time}
              </Button>
            ))}
          </div>

          {inputValue && filteredTimeSlots.length > 0 && filteredTimeSlots.some(time => !businessHours.includes(time)) && (
            <>
              <div className="font-medium text-sm">{t('appointments.timePicker.otherTimes')}</div>
              <div className="grid grid-cols-4 gap-2">
                {filteredTimeSlots
                  .filter(time => !businessHours.includes(time))
                  .map((time) => (
                    <Button
                      key={time}
                      variant={time === value ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleTimeSelect(time)}
                      className={cn(
                        "w-full",
                        isDisabled(time) && "opacity-50 cursor-not-allowed line-through"
                      )}
                      disabled={isDisabled(time)}
                    >
                      {time}
                    </Button>
                  ))}
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
