"use client";

import { useState, useEffect, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";
// We're using a custom Profile interface instead of the Database type
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Mail, User as UserIcon, Globe, Calendar, CheckCircle, AlertCircle, Save, Upload, Camera } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslations } from "next-intl";
import { useDateFormatter } from "@/hooks/use-date-formatter";

// Define a more complete profile type
interface Profile {
  id: string;
  created_at: string;
  updated_at: string;
  full_name: string | null;
  email: string;
  website?: string | null;
  avatar_url?: string | null;
}

export function ProfileSettings() {
  const [user, setUser] = useState<User | null>(null);
  // We'll use the profile data directly in the form
  const [_, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    website: "",
    avatar_url: "",
  });
  const { toast } = useToast();
  const supabase = createClient();
  const t = useTranslations();
  const { formatDate } = useDateFormatter();

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      try {
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          // Get the user's profile
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (error) {
            console.error("Error fetching profile:", error);
          } else {
            // Cast data to our Profile interface
            const profileData = data as unknown as Profile;
            setProfile(profileData);
            setFormData({
              full_name: profileData.full_name || "",
              website: profileData.website || "",
              avatar_url: profileData.avatar_url || "",
            });

            // Check if avatar_url is undefined (column might not exist)
            if (profileData.avatar_url === undefined) {
              console.log('avatar_url column might not exist in the profiles table');
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndProfile();
  }, [supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarClick = () => {
    // Trigger the hidden file input
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);

      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('file', file);

      // Send the file to our API endpoint
      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload avatar');
      }

      // Update the form data with the new avatar URL
      setFormData(prev => ({ ...prev, avatar_url: result.avatar_url }));

      // Check if there was a warning about the profile not being updated
      if (result.warning) {
        toast({
          title: t('settings.profileSettings.avatarUploaded'),
          description: t('settings.profileSettings.avatarUploadedButNotSaved'),
          variant: "default",
        });
      } else {
        toast({
          title: t('settings.profileSettings.avatarUpdated'),
          description: t('settings.profileSettings.avatarUpdatedDescription'),
        });
      }
    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      toast({
        title: t('settings.profileSettings.uploadFailed'),
        description: err.message || t('settings.profileSettings.uploadFailedDescription'),
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!user) return;

      // Prepare update data without avatar_url first
      const updateData: any = {
        full_name: formData.full_name,
        website: formData.website,
        updated_at: new Date().toISOString(),
      };

      // Only include avatar_url if it has a value
      if (formData.avatar_url) {
        updateData.avatar_url = formData.avatar_url;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (error) {
        // If the error is about the avatar_url column, try again without it
        if (error.message && error.message.includes("avatar_url")) {
          console.log('Retrying update without avatar_url field');
          delete updateData.avatar_url;

          const { error: retryError } = await supabase
            .from("profiles")
            .update(updateData)
            .eq("id", user.id);

          if (retryError) {
            throw retryError;
          }
        } else {
          throw error;
        }
      }

      toast({
        title: t('settings.profileSettings.updateSuccess'),
        description: t('settings.profileSettings.updateSuccessDescription'),
      });

      // Refresh profile data
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data);
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      toast({
        title: t('settings.profileSettings.updateFailed'),
        description: t('settings.profileSettings.updateFailedDescription'),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        <p className="text-muted-foreground">{t('settings.profileSettings.loading')}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Card className="border-red-100 overflow-hidden">
        <div className="h-1 bg-red-600"></div>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            {t('common.notAuthenticated')}
          </CardTitle>
          <CardDescription>
            {t('settings.profileSettings.loginRequired')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => window.location.href = "/login"}
            className="bg-red-600 hover:bg-red-700"
          >
            {t('common.goToLogin')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-indigo-100 overflow-hidden">
      <div className="h-1 bg-indigo-600"></div>
      <CardHeader className="pb-4">
        <CardTitle className="text-xl flex items-center gap-2">
          <UserIcon className="h-5 w-5 text-indigo-600" />
          {t('settings.profileSettings.title')}
        </CardTitle>
        <CardDescription className="text-base">
          {t('settings.profileSettings.description')}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-8">
          {/* Profile Avatar Section */}
          <div className="flex flex-col items-center gap-4 pb-6 border-b">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={uploadingAvatar}
            />

            {/* Avatar with upload functionality */}
            <div
              className="relative cursor-pointer group"
              onClick={handleAvatarClick}
            >
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-2 border-indigo-100">
                <AvatarImage src={formData.avatar_url || ""} alt={formData.full_name || user.email || ""} />
                <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xl">
                  {formData.full_name ? formData.full_name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                <Camera className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>

              {/* Loading spinner */}
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full">
                  <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 text-white animate-spin" />
                </div>
              )}
            </div>

            <div className="space-y-2 text-center">
              <h3 className="font-medium text-lg">{formData.full_name || "Your Name"}</h3>
              <p className="text-muted-foreground text-sm truncate max-w-full">{user.email}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                onClick={handleAvatarClick}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 flex-shrink-0 animate-spin" />
                    <span className="truncate">{t('common.uploading')}</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{t('settings.profileSettings.updateAvatar')}</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            <h3 className="font-medium text-lg flex items-center gap-2">
              <Mail className="h-5 w-5 text-indigo-600" />
              {t('settings.profileSettings.contactInfo')}
            </h3>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">{t('settings.profileSettings.email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={user.email || ""}
                  disabled
                  className="bg-muted pl-10"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {t('settings.profileSettings.emailHelp')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-sm font-medium">{t('settings.profileSettings.name')}</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-600" />
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder={t('settings.profileSettings.namePlaceholder')}
                  className="pl-10 border-indigo-200 focus-visible:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website" className="text-sm font-medium">{t('settings.profileSettings.website')}</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-600" />
                <Input
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder={t('settings.profileSettings.websitePlaceholder')}
                  className="pl-10 border-indigo-200 focus-visible:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="space-y-4 bg-indigo-50/50 p-4 rounded-lg">
            <h3 className="font-medium text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
              {t('settings.profileSettings.accountInfo')}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-600" />
                  <p className="text-sm font-medium">{t('settings.profileSettings.accountCreated')}</p>
                </div>
                <p className="text-sm bg-white px-3 py-1 rounded-full border border-indigo-100">
                  {formatDate(new Date(user.created_at), { shortDate: true })}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {user.email_confirmed_at ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                  )}
                  <p className="text-sm font-medium">{t('settings.profileSettings.emailVerification')}</p>
                </div>
                <p className={`text-sm px-3 py-1 rounded-full border ${
                  user.email_confirmed_at
                    ? "bg-green-50 text-green-700 border-green-100"
                    : "bg-amber-50 text-amber-700 border-amber-100"
                }`}>
                  {user.email_confirmed_at ? t('settings.profileSettings.verified') : t('settings.profileSettings.notVerified')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t bg-gray-50/50 py-4">
          <Button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 transition-colors gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                <span className="truncate">{t('settings.profileSettings.saving')}</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{t('settings.profileSettings.saveChanges')}</span>
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
