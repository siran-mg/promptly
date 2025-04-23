"use client";

import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";
// We're using a custom Profile interface instead of the Database type
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Not Authenticated</CardTitle>
          <CardDescription>Please log in to view your profile.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          Update your profile information and manage your account.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user.email || ""}
              disabled
              className="bg-muted"
            />
            <p className="text-sm text-muted-foreground">
              Your email address is used for login and cannot be changed.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Your full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://example.com"
            />
          </div>

          <div>
            <p className="text-sm font-medium">Account Information</p>
            <div className="mt-2 space-y-2">
              <div className="flex justify-between">
                <p className="text-sm text-muted-foreground">Account created</p>
                <p className="text-sm">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex justify-between">
                <p className="text-sm text-muted-foreground">Email verified</p>
                <p className="text-sm">
                  {user.email_confirmed_at ? "Yes" : "No"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
