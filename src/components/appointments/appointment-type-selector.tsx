"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Clock, X } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Database } from "@/types/supabase";
import { useTranslations } from "next-intl";

import {
  Command,
  CommandGroup,
  CommandInput,
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
  allowedTypes?: string[];
}

export function AppointmentTypeSelector({
  value,
  onChange,
  userId,
  allowedTypes,
}: AppointmentTypeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTypes, setFilteredTypes] = useState<AppointmentType[]>([]);
  const supabase = createClient();
  const t = useTranslations();

  // Initialize the appointment type selector

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

        let typesToUse = data || [];

        // Filter by allowed types if provided
        if (allowedTypes && allowedTypes.length > 0) {
          const filteredTypes = typesToUse.filter(type => allowedTypes.includes(type.id));

          // If we have filtered types, use them
          if (filteredTypes.length > 0) {
            typesToUse = filteredTypes;
          }
        }

        setAppointmentTypes(typesToUse);

        // If a value is already selected, verify it exists in the fetched types
        if (value) {
          // Verify that the value exists in the fetched types
          const typeExists = data?.some(type => type.id === value);
          if (!typeExists) {
            // If the selected type doesn't exist in the fetched data, clear the selection
            onChange("");
          }
        }
        // If no value is selected, check if there's a default type
        else if (data && data.length > 0) {
          // Look for a default appointment type
          const defaultType = data.find(type => type.is_default);

          // If there's a default type, select it
          if (defaultType) {
            onChange(defaultType.id);
          }
          // Otherwise, don't select anything automatically
        }
      } catch (err) {
        console.error("Error in fetchAppointmentTypes:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointmentTypes();
  }, [supabase, userId, value, onChange, allowedTypes]);

  // Filter appointment types based on search query
  useEffect(() => {
    const filtered = appointmentTypes.filter(type =>
      searchQuery === "" ||
      type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (type.description && type.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredTypes(filtered);
  }, [searchQuery, appointmentTypes]);

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
                  className="w-4 h-4 rounded-full mr-2.5 flex-shrink-0 border border-gray-200"
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
            t('appointments.typeSelector.placeholder')
          )}
          <div className="flex items-center">
            {selectedType && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange("");
                }}
                className="mr-1 p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Clear selection"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 shadow-lg border-gray-200">
        <Command shouldFilter={false} className="rounded-md">
          <CommandInput
            placeholder={t('appointments.typeSelector.searchPlaceholder')}
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="px-4 py-3"
          />
          {searchQuery !== "" && filteredTypes.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground font-medium border-t border-b">
              {t('appointments.typeSelector.noMatchingType', { query: searchQuery })}
            </div>
          )}
          <CommandGroup className="max-h-[300px] overflow-y-auto">
            {appointmentTypes.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground font-medium">
                {t('appointments.typeSelector.noTypesAvailable')}
              </div>
            )}

            {filteredTypes
              .map((type) => (
                <button
                  key={type.id}
                  type="button"
                  className="w-full text-left flex items-center justify-between px-4 py-2.5 hover:bg-accent hover:text-accent-foreground rounded-sm cursor-pointer transition-colors"
                  onClick={() => {
                    // If this type is already selected, deselect it
                    if (value === type.id) {
                      onChange("");
                    } else {
                      onChange(type.id);
                    }
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center w-full">
                    {type.color && (
                      <div
                        className="w-4 h-4 rounded-full mr-2.5 flex-shrink-0 border border-gray-200"
                        style={{ backgroundColor: type.color }}
                      />
                    )}
                    <span>{type.name}</span>
                    <span className="ml-2 text-muted-foreground flex items-center text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {type.duration} min
                    </span>
                    {type.is_default && (
                      <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                        {t('appointments.typeSelector.defaultLabel')}
                      </span>
                    )}
                  </div>
                  {value === type.id ? (
                    <div className="flex items-center ml-auto group">
                      <span className="text-xs text-muted-foreground mr-1.5 opacity-0 group-hover:opacity-100 transition-opacity">{t('appointments.typeSelector.clickToDeselect')}</span>
                      <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                    </div>
                  ) : (
                    <Check className="ml-auto h-4 w-4 flex-shrink-0 text-primary opacity-0" />
                  )}
                </button>
              ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
