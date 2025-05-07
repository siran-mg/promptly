"use client";

import { useTranslations } from "next-intl";
import { ActionCard } from "@/components/dashboard/action-card";
import { SmartShareButton } from "@/components/dashboard/smart-share-button";

export function ShareActionCard() {
  const t = useTranslations();

  return (
    <div className="relative">
      <ActionCard
        iconName="Share"
        title={t('dashboard.quickActions.shareBookingForm')}
        description={t('dashboard.quickActions.shareBookingFormDescription')}
        iconColor="text-green-600"
        onClick={() => {}} // This will be overridden by the SmartShareButton
      />
      {/* Invisible button that covers the entire card for accessibility */}
      <div className="absolute inset-0 w-full h-full">
        <SmartShareButton variant="ghost" className="w-full h-full opacity-0" />
      </div>
    </div>
  );
}
