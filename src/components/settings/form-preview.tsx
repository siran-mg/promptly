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
    <div className="border rounded-lg p-3 sm:p-4 bg-gray-50" style={accentColorStyle}>
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Logo */}
          {logoUrl && (
            <div className="flex justify-center pt-4 sm:pt-6">
              <img
                src={logoUrl}
                alt="Logo"
                className="h-12 sm:h-16 w-auto object-contain"
              />
            </div>
          )}

          {/* Title and Description */}
          <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 text-center">
            <h3 className="text-lg sm:text-xl font-semibold tracking-tight">
              {formTitle || t('settings.formSettings.defaultTitle')}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {formDescription || t('settings.formSettings.defaultDescription')}
            </p>
          </div>

          {/* Form Fields */}
          <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4">
            <div className="space-y-3 sm:space-y-4">
              <div>
                <Label htmlFor="preview-name" className="text-xs sm:text-sm">{t('settings.formSettings.preview.name')}</Label>
                <div className="mt-1">
                  <Input
                    id="preview-name"
                    placeholder={t('settings.formSettings.preview.namePlaceholder')}
                    className="bg-white text-xs sm:text-sm h-8 sm:h-10"
                    readOnly
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="preview-email" className="text-xs sm:text-sm">{t('settings.formSettings.preview.email')}</Label>
                <div className="mt-1">
                  <Input
                    id="preview-email"
                    placeholder={t('settings.formSettings.preview.emailPlaceholder')}
                    className="bg-white text-xs sm:text-sm h-8 sm:h-10"
                    readOnly
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="preview-phone" className="text-xs sm:text-sm">{t('settings.formSettings.preview.phone')}</Label>
                <div className="mt-1">
                  <Input
                    id="preview-phone"
                    placeholder={t('settings.formSettings.preview.phonePlaceholder')}
                    className="bg-white text-xs sm:text-sm h-8 sm:h-10"
                    readOnly
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div>
                  <Label htmlFor="preview-date" className="text-xs sm:text-sm">{t('settings.formSettings.preview.date')}</Label>
                  <div className="mt-1">
                    <div className="flex h-8 sm:h-10 w-full rounded-md border border-input bg-white px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm">
                      <CalendarIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 opacity-50" />
                      <span className="text-muted-foreground truncate">{t('settings.formSettings.preview.datePlaceholder')}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="preview-time" className="text-xs sm:text-sm">{t('settings.formSettings.preview.time')}</Label>
                  <div className="mt-1">
                    <div className="flex h-8 sm:h-10 w-full rounded-md border border-input bg-white px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm">
                      <span className="text-muted-foreground truncate">{t('settings.formSettings.preview.timePlaceholder')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="preview-notes" className="text-xs sm:text-sm">{t('settings.formSettings.preview.notes')}</Label>
                <div className="mt-1">
                  <Textarea
                    id="preview-notes"
                    placeholder={t('settings.formSettings.preview.notesPlaceholder')}
                    className="bg-white resize-none h-16 sm:h-24 text-xs sm:text-sm"
                    readOnly
                  />
                </div>
              </div>

              <Button
                className="w-full mt-2 h-8 sm:h-10 text-xs sm:text-sm"
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
