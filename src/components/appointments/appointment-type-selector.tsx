"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase";
import { Database } from "@/types/supabase";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type AppointmentType = Database["public"]["Tables"]["appointment_types"]["Row"];

interface AppointmentTypeSelectorProps {
  value: string | null;
  onChange: (value: string) => void;
  userId: string;
}

export function AppointmentTypeSelector({
  value,
  onChange,
  userId,
}: AppointmentTypeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const supabase = createClient();

  console.log('AppointmentTypeSelector initialized with:', { value, userId });

  useEffect(() => {
    const fetchAppointmentTypes = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("appointment_types")
          .select("*")
          .eq("user_id", userId)
          .order("is_default", { ascending: false })
          .order("name");

        if (error) {
          console.error("Error fetching appointment types:", error);
          return;
        }

        setAppointmentTypes(data || []);

        console.log('Fetched appointment types:', data);
        console.log('Current value:', value);

        // If no value is selected and we have types, select the default one
        if (!value && data && data.length > 0) {
          const defaultType = data.find(type => type.is_default) || data[0];
          console.log('Setting default appointment type:', defaultType);
          onChange(defaultType.id);
        } else if (value) {
          console.log('Using provided appointment type value:', value);
          // Verify that the value exists in the fetched types
          const typeExists = data?.some(type => type.id === value);
          console.log('Type exists in fetched data:', typeExists);
        }
      } catch (err) {
        console.error("Error in fetchAppointmentTypes:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointmentTypes();
  }, [supabase, userId, value, onChange]);

  // Find the selected appointment type
  const selectedType = appointmentTypes.find(type => type.id === value);

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  // If no appointment types, don't show anything
  if (appointmentTypes.length === 0) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedType ? (
            <div className="flex items-center">
              {selectedType.color && (
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: selectedType.color }}
                />
              )}
              <span>{selectedType.name}</span>
              <span className="ml-2 text-muted-foreground flex items-center text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {selectedType.duration} min
              </span>
            </div>
          ) : (
            "Select appointment type"
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search appointment types..." />
          <CommandEmpty>No appointment type found.</CommandEmpty>
          <CommandGroup>
            {appointmentTypes.map((type) => (
              <CommandItem
                key={type.id}
                value={type.id}
                onSelect={() => {
                  onChange(type.id);
                  setOpen(false);
                }}
              >
                <div className="flex items-center w-full">
                  {type.color && (
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: type.color }}
                    />
                  )}
                  <span>{type.name}</span>
                  <span className="ml-2 text-muted-foreground flex items-center text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {type.duration} min
                  </span>
                  {type.is_default && (
                    <span className="ml-auto text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      Default
                    </span>
                  )}
                </div>
                <Check
                  className={cn(
                    "ml-auto h-4 w-4",
                    value === type.id ? "opacity-100" : "opacity-0"
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
