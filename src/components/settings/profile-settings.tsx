"use client";

import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";
// We're using a custom Profile interface instead of the Database type
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Mail, User as UserIcon, Globe, Calendar, CheckCircle, AlertCircle, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  const [formData, setFormData] = useState({
    full_name: "",
    website: "",
    avatar_url: "",
  });
  const { toast } = useToast();
  const supabase = createClient();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          website: formData.website,
          avatar_url: formData.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
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
        title: "Update failed",
        description: "Could not update profile. Please try again.",
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
        <p className="text-muted-foreground">Loading your profile information...</p>
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
            Not Authenticated
          </CardTitle>
          <CardDescription>
            Please log in to view and manage your profile information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => window.location.href = "/login"}
            className="bg-red-600 hover:bg-red-700"
          >
            Go to Login
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
          Your Profile Information
        </CardTitle>
        <CardDescription className="text-base">
          Update your personal information and manage your account settings
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-8">
          {/* Profile Avatar Section */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b">
            <Avatar className="h-24 w-24 border-2 border-indigo-100">
              <AvatarImage src={formData.avatar_url || ""} alt={formData.full_name || user.email || ""} />
              <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xl">
                {formData.full_name ? formData.full_name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2 text-center sm:text-left">
              <h3 className="font-medium text-lg">{formData.full_name || "Your Name"}</h3>
              <p className="text-muted-foreground">{user.email}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                onClick={() => {
                  toast({
                    title: "Avatar Upload",
                    description: "Avatar upload functionality is coming soon.",
                  });
                }}
              >
                Update Profile Picture
              </Button>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            <h3 className="font-medium text-lg flex items-center gap-2">
              <Mail className="h-5 w-5 text-indigo-600" />
              Contact Information
            </h3>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
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
                Your email address is used for login and cannot be changed.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-sm font-medium">Full Name</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-600" />
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  className="pl-10 border-indigo-200 focus-visible:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website" className="text-sm font-medium">Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-600" />
                <Input
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className="pl-10 border-indigo-200 focus-visible:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="space-y-4 bg-indigo-50/50 p-4 rounded-lg">
            <h3 className="font-medium text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
              Account Information
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-600" />
                  <p className="text-sm font-medium">Account created</p>
                </div>
                <p className="text-sm bg-white px-3 py-1 rounded-full border border-indigo-100">
                  {new Date(user.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {user.email_confirmed_at ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                  )}
                  <p className="text-sm font-medium">Email verification</p>
                </div>
                <p className={`text-sm px-3 py-1 rounded-full border ${
                  user.email_confirmed_at
                    ? "bg-green-50 text-green-700 border-green-100"
                    : "bg-amber-50 text-amber-700 border-amber-100"
                }`}>
                  {user.email_confirmed_at ? "Verified" : "Not Verified"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t bg-gray-50/50 py-4">
          <Button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 transition-colors gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Profile Changes
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
