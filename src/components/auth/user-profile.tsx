"use client";

import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";
import { Database } from "@/types/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function UserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
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
            setProfile(data);
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </CardContent>
      </Card>
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
        <CardTitle>{profile?.full_name || "User"}</CardTitle>
        <CardDescription>{user.email}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium">Account created</p>
            <p className="text-sm text-muted-foreground">
              {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Email verified</p>
            <p className="text-sm text-muted-foreground">
              {user.email_confirmed_at ? "Yes" : "No"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
