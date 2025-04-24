"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { AppointmentForm } from "./appointment-form";

interface DynamicAppointmentFormProps {
  userId: string;
  defaultTypeId: string | null;
  initialSettings: {
    form_title: string;
    form_description: string;
    logo_url: string | null;
    accent_color: string;
  };
  selectedTypes?: string[];
  hideAppointmentTypes?: boolean;
}

export function DynamicAppointmentForm({
  userId,
  defaultTypeId,
  initialSettings,
  selectedTypes = [],
  hideAppointmentTypes = false
}: DynamicAppointmentFormProps) {
  const supabase = createClient();
  const [settings, setSettings] = useState(initialSettings);
  const [currentTypeId, setCurrentTypeId] = useState<string | null>(defaultTypeId);
  const [initialDate, setInitialDate] = useState<Date | null>(null);

  // Check for date parameter in URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const dateParam = searchParams.get('date');
      if (dateParam) {
        try {
          const parsedDate = new Date(dateParam);
          // Check if the date is valid
          if (!isNaN(parsedDate.getTime())) {
            setInitialDate(parsedDate);
          }
        } catch (error) {
          console.error('Error parsing date from URL:', error);
        }
      }
    }
  }, []);

  // Listen for appointment type changes
  const handleAppointmentTypeChange = useCallback(async (typeId: string) => {
    console.log('Appointment type changed to:', typeId);
    setCurrentTypeId(typeId);

    // Fetch type-specific settings if available
    if (typeId) {
      try {
        // First get the appointment type details
        const { data: appointmentType, error: typeError } = await supabase
          .from("appointment_types")
          .select("*")
          .eq("id", typeId)
          .single();

        if (typeError) {
          console.error('Error fetching appointment type:', typeError);
          return;
        }

        console.log('Found appointment type:', appointmentType);

        // Now get the type-specific form settings
        const { data: typeSettings, error: settingsError } = await supabase
          .from("form_settings_per_type")
          .select("*")
          .eq("user_id", userId)
          .eq("appointment_type_id", typeId)
          .single();

        if (settingsError && settingsError.code !== 'PGRST116') {
          console.error('Error fetching type-specific form settings:', settingsError);
        }

        if (typeSettings) {
          console.log('Found type-specific form settings:', typeSettings);
          setSettings({
            form_title: typeSettings.form_title || `Book a ${appointmentType.name}`,
            form_description: typeSettings.form_description || initialSettings.form_description,
            logo_url: typeSettings.logo_url || initialSettings.logo_url,
            accent_color: typeSettings.accent_color || initialSettings.accent_color
          });
        } else if (appointmentType) {
          console.log('No type-specific form settings found, using appointment type name for title');
          // If no type-specific settings but we have the appointment type, create a default title
          setSettings({
            ...initialSettings,
            form_title: `Book a ${appointmentType.name}`
          });
        }
      } catch (err) {
        console.error('Error updating form settings for appointment type:', err);
      }
    } else {
      // Reset to initial settings if no type is selected
      setSettings(initialSettings);
    }
  }, [userId, supabase, initialSettings]);

  // Set up a listener for the appointment type selector
  useEffect(() => {
    // Create a custom event listener for appointment type changes
    const handleEvent = ((e: CustomEvent) => {
      handleAppointmentTypeChange(e.detail.typeId);
    }) as EventListener;

    window.addEventListener('appointmentTypeChanged', handleEvent);

    // Clean up the listener when the component unmounts
    return () => {
      window.removeEventListener('appointmentTypeChanged', handleEvent);
    };
  }, [handleAppointmentTypeChange]);

  // Initialize with the default type if provided
  useEffect(() => {
    if (defaultTypeId) {
      handleAppointmentTypeChange(defaultTypeId);
    }
  }, [defaultTypeId, handleAppointmentTypeChange]);

  // Create a style object for the accent color
  const accentColorStyle = {
    "--accent-color": settings.accent_color,
    "--accent-color-foreground": "white",
  } as React.CSSProperties;

  return (
    <div className="space-y-6" style={accentColorStyle}>
      {settings.logo_url && (
        <div className="flex justify-center">
          <img
            src={settings.logo_url}
            alt="Logo"
            className="h-16 w-auto object-contain"
          />
        </div>
      )}
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">
          {settings.form_title}
        </h1>
        {settings.form_description && (
          <p className="text-gray-500 md:text-lg">
            {settings.form_description}
          </p>
        )}
      </div>

      <AppointmentForm
        userId={userId}
        accentColor={settings.accent_color}
        defaultTypeId={currentTypeId}
        onAppointmentTypeChange={handleAppointmentTypeChange}
        initialDate={initialDate}
        selectedTypes={selectedTypes}
        hideAppointmentTypes={hideAppointmentTypes}
      />
    </div>
  );
}
