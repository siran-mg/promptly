"use client";

import { useState } from "react";
import { CalendarIcon, User, Mail, Phone, FileText } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TimePicker } from "@/components/appointments/time-picker";
import { SimpleDatePicker } from "@/components/appointments/simple-date-picker";

interface FormPreviewProps {
  formTitle: string;
  formDescription: string;
  logoUrl: string | null;
  accentColor: string;
}

export function FormPreview({
  formTitle,
  formDescription,
  logoUrl,
  accentColor,
}: FormPreviewProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState("09:00");

  // Create a style object for the accent color
  const accentColorStyle = {
    "--accent-color": accentColor,
    "--accent-color-foreground": "white",
  } as React.CSSProperties;

  return (
    <div className="border rounded-lg p-4 bg-gray-50" style={accentColorStyle}>
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {logoUrl && (
            <div className="flex justify-center pt-6">
              <img
                src={logoUrl}
                alt="Logo"
                className="h-12 w-auto object-contain"
              />
            </div>
          )}
          <div className="px-6 py-6">
            <div className="space-y-4">
              <div className="space-y-2 text-center">
                <h3 className="text-xl font-semibold tracking-tight">
                  {formTitle || "Book an Appointment"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {formDescription || "Fill out the form below to schedule your appointment."}
                </p>
              </div>

              <Card className="border border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Appointment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              "w-full justify-start text-left font-normal text-xs",
                              !date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-3 w-3" />
                            {date ? (
                              format(date, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="center">
                          <SimpleDatePicker
                            selected={date}
                            onSelect={(newDate) => newDate && setDate(newDate)}
                            disabled={(date) => date < new Date()}
                            className="rounded-md border"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Time</Label>
                      <TimePicker
                        value={time}
                        onChange={setTime}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Full Name</Label>
                    <div className="flex items-center border rounded-md h-8 px-3 text-xs">
                      <User className="h-3 w-3 mr-2 text-gray-400" />
                      <span className="text-muted-foreground">John Doe</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Email</Label>
                    <div className="flex items-center border rounded-md h-8 px-3 text-xs">
                      <Mail className="h-3 w-3 mr-2 text-gray-400" />
                      <span className="text-muted-foreground">john.doe@example.com</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Phone Number</Label>
                    <div className="flex items-center border rounded-md h-8 px-3 text-xs">
                      <Phone className="h-3 w-3 mr-2 text-gray-400" />
                      <span className="text-muted-foreground">+1 (555) 123-4567</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Notes (Optional)</Label>
                    <div className="flex items-start border rounded-md p-3 text-xs min-h-[60px]">
                      <FileText className="h-3 w-3 mr-2 text-gray-400 mt-0.5" />
                      <span className="text-muted-foreground">Any special requests or information for the appointment...</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    size="sm" 
                    className="w-full text-xs"
                    style={{ backgroundColor: accentColor }}
                  >
                    Book Appointment
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
