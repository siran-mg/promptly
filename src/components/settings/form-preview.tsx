"use client";

import { useState } from "react";
import { CalendarIcon, User, Mail, Phone, FileText } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  // Create a style object for the accent color
  const accentColorStyle = {
    "--accent-color": accentColor,
    "--accent-color-foreground": "white",
  } as React.CSSProperties;

  const buttonStyle = {
    backgroundColor: accentColor,
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-50" style={accentColorStyle}>
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Logo */}
          {logoUrl && (
            <div className="flex justify-center pt-6">
              <img
                src={logoUrl}
                alt="Logo"
                className="h-16 w-auto object-contain"
              />
            </div>
          )}

          {/* Title and Description */}
          <div className="px-6 pt-6 pb-4 text-center">
            <h3 className="text-xl font-semibold tracking-tight">
              {formTitle || "Book an Appointment"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {formDescription || "Fill out the form below to schedule your appointment."}
            </p>
          </div>

          {/* Form Fields */}
          <div className="px-6 pb-6 space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="preview-name">Your Name</Label>
                <div className="mt-1.5">
                  <Input
                    id="preview-name"
                    placeholder="John Doe"
                    className="bg-white"
                    readOnly
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="preview-email">Email</Label>
                <div className="mt-1.5">
                  <Input
                    id="preview-email"
                    placeholder="john.doe@example.com"
                    className="bg-white"
                    readOnly
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="preview-phone">Phone Number</Label>
                <div className="mt-1.5">
                  <Input
                    id="preview-phone"
                    placeholder="+1 (555) 123-4567"
                    className="bg-white"
                    readOnly
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="preview-date">Date</Label>
                  <div className="mt-1.5">
                    <div className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm">
                      <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                      <span className="text-muted-foreground">April 23rd, 2025</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="preview-time">Time</Label>
                  <div className="mt-1.5">
                    <div className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm">
                      <span className="text-muted-foreground">09:00</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="preview-notes">Notes (Optional)</Label>
                <div className="mt-1.5">
                  <Textarea
                    id="preview-notes"
                    placeholder="Any special requests or information for the appointment..."
                    className="bg-white resize-none h-24"
                    readOnly
                  />
                </div>
              </div>

              <Button
                className="w-full mt-2"
                style={buttonStyle}
              >
                Schedule Appointment
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
