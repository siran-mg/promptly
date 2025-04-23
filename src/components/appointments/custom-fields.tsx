"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Database } from "@/types/supabase";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TimePicker } from "./time-picker";

type CustomField = Database["public"]["Tables"]["appointment_custom_fields"]["Row"];

interface CustomFieldsProps {
  appointmentTypeId: string | null;
  values: Record<string, string>;
  onChange: (fieldId: string, value: string) => void;
}

export function CustomFields({
  appointmentTypeId,
  values,
  onChange,
}: CustomFieldsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [fields, setFields] = useState<CustomField[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchCustomFields = async () => {
      if (!appointmentTypeId) {
        setFields([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("appointment_custom_fields")
          .select("*")
          .eq("appointment_type_id", appointmentTypeId)
          .order("order_index");

        if (error) {
          console.error("Error fetching custom fields:", error);
          return;
        }

        setFields(data || []);
      } catch (err) {
        console.error("Error in fetchCustomFields:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomFields();
  }, [supabase, appointmentTypeId]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (fields.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={field.name}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>

          {field.type === "text" && (
            <Input
              id={field.name}
              value={values[field.id] || ""}
              onChange={(e) => onChange(field.id, e.target.value)}
              placeholder={field.placeholder || ""}
              required={field.required}
            />
          )}

          {field.type === "textarea" && (
            <Textarea
              id={field.name}
              value={values[field.id] || ""}
              onChange={(e) => onChange(field.id, e.target.value)}
              placeholder={field.placeholder || ""}
              required={field.required}
            />
          )}

          {field.type === "number" && (
            <Input
              id={field.name}
              type="number"
              value={values[field.id] || ""}
              onChange={(e) => onChange(field.id, e.target.value)}
              placeholder={field.placeholder || ""}
              required={field.required}
            />
          )}

          {field.type === "email" && (
            <Input
              id={field.name}
              type="email"
              value={values[field.id] || ""}
              onChange={(e) => onChange(field.id, e.target.value)}
              placeholder={field.placeholder || ""}
              required={field.required}
            />
          )}

          {field.type === "phone" && (
            <Input
              id={field.name}
              type="tel"
              value={values[field.id] || ""}
              onChange={(e) => onChange(field.id, e.target.value)}
              placeholder={field.placeholder || ""}
              required={field.required}
            />
          )}

          {field.type === "date" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !values[field.id] && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {values[field.id] ? (
                    format(new Date(values[field.id]), "PPP")
                  ) : (
                    <span>{field.placeholder || "Pick a date"}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={values[field.id] ? new Date(values[field.id]) : undefined}
                  onSelect={(date) => onChange(field.id, date ? date.toISOString() : "")}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}

          {field.type === "time" && (
            <TimePicker
              value={values[field.id] || ""}
              onChange={(time) => onChange(field.id, time)}
            />
          )}

          {field.type === "select" && field.options && (
            <Select
              value={values[field.id] || ""}
              onValueChange={(value) => onChange(field.id, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || "Select an option"} />
              </SelectTrigger>
              <SelectContent>
                {(typeof field.options === "object" && field.options !== null && Array.isArray(field.options)) &&
                  field.options.map((option: string, index: number) => (
                    <SelectItem key={index} value={option}>
                      {option}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}

          {field.type === "checkbox" && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id={field.name}
                checked={values[field.id] === "true"}
                onCheckedChange={(checked) => onChange(field.id, checked ? "true" : "false")}
              />
              <label
                htmlFor={field.name}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {field.placeholder || "Yes"}
              </label>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
