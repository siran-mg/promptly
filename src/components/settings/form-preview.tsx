"use client";

import { useState } from "react";
import { CalendarIcon, User, Mail, Phone, FileText } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

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
  const t = useTranslations();
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
              {formTitle || t('settings.formSettings.defaultTitle')}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {formDescription || t('settings.formSettings.defaultDescription')}
            </p>
          </div>

          {/* Form Fields */}
          <div className="px-6 pb-6 space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="preview-name">{t('settings.formSettings.preview.name')}</Label>
                <div className="mt-1.5">
                  <Input
                    id="preview-name"
                    placeholder={t('settings.formSettings.preview.namePlaceholder')}
                    className="bg-white"
                    readOnly
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="preview-email">{t('settings.formSettings.preview.email')}</Label>
                <div className="mt-1.5">
                  <Input
                    id="preview-email"
                    placeholder={t('settings.formSettings.preview.emailPlaceholder')}
                    className="bg-white"
                    readOnly
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="preview-phone">{t('settings.formSettings.preview.phone')}</Label>
                <div className="mt-1.5">
                  <Input
                    id="preview-phone"
                    placeholder={t('settings.formSettings.preview.phonePlaceholder')}
                    className="bg-white"
                    readOnly
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="preview-date">{t('settings.formSettings.preview.date')}</Label>
                  <div className="mt-1.5">
                    <div className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm">
                      <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                      <span className="text-muted-foreground">{t('settings.formSettings.preview.datePlaceholder')}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="preview-time">{t('settings.formSettings.preview.time')}</Label>
                  <div className="mt-1.5">
                    <div className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm">
                      <span className="text-muted-foreground">{t('settings.formSettings.preview.timePlaceholder')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="preview-notes">{t('settings.formSettings.preview.notes')}</Label>
                <div className="mt-1.5">
                  <Textarea
                    id="preview-notes"
                    placeholder={t('settings.formSettings.preview.notesPlaceholder')}
                    className="bg-white resize-none h-24"
                    readOnly
                  />
                </div>
              </div>

              <Button
                className="w-full mt-2"
                style={buttonStyle}
              >
                {t('settings.formSettings.preview.scheduleButton')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
