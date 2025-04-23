"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Share, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Copy, Check } from "lucide-react";

interface SmartShareButtonProps {
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  iconOnly?: boolean;
}

export function SmartShareButton({
  variant = "outline",
  size = "default",
  className = "",
  iconOnly = false
}: SmartShareButtonProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isFormCustomized, setIsFormCustomized] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  // Check if form has been customized
  useEffect(() => {
    const checkFormCustomization = async () => {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setIsLoading(false);
          return;
        }

        // Check if form settings exist and have been customized
        const { data, error } = await supabase
          .from("form_settings")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error) {
          // If the error is because no settings exist yet, create default settings
          if (error.code === 'PGRST116') { // PostgreSQL error for 'no rows returned'
            try {
              // Create default form settings
              const { error: insertError } = await supabase
                .from("form_settings")
                .insert({
                  user_id: user.id,
                  form_title: "Book an Appointment",
                  form_description: "Fill out the form below to schedule your appointment.",
                  logo_url: "",
                  accent_color: "#6366f1",
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });

              if (insertError) {
                console.error("Error creating default form settings:", insertError);
                toast({
                  title: "Error",
                  description: "Could not create default form settings. Please try again.",
                  variant: "destructive",
                });
              }
            } catch (insertErr) {
              console.error("Error in creating default settings:", insertErr);
            }
          } else {
            console.error("Error checking form settings:", error);
            toast({
              title: "Error",
              description: "Could not load form settings. Please try again.",
              variant: "destructive",
            });
          }
          setIsFormCustomized(false);
        } else {
          // Consider form customized if title or description has been changed from default
          // or if a logo has been uploaded
          const isCustomized = Boolean(
            (data.form_title && data.form_title !== "Book an Appointment") ||
            (data.form_description && data.form_description !== "Fill out the form below to schedule your appointment.") ||
            (data.logo_url && data.logo_url !== "")
          );

          setIsFormCustomized(isCustomized);

          // If we have a share token already, fetch it
          if (isCustomized) {
            const { data: tokenData } = await supabase
              .from("form_share_tokens")
              .select("token")
              .eq("user_id", user.id)
              .single();

            if (tokenData?.token) {
              setShareToken(tokenData.token);
            }
          }
        }
      } catch (err) {
        console.error("Error in checkFormCustomization:", err);
      } finally {
        setIsLoading(false);
      }
    };

    checkFormCustomization();
  }, [supabase]);

  // Generate share token
  const generateShareToken = async () => {
    setIsGeneratingToken(true);
    try {
      // Get user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if a token already exists
      const { data: existingToken } = await supabase
        .from("form_share_tokens")
        .select("token")
        .eq("user_id", user.id)
        .single();

      if (existingToken?.token) {
        setShareToken(existingToken.token);
        setIsGeneratingToken(false);
        return;
      }

      // If no token exists, create one via the API
      const response = await fetch('/api/form/share-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('API error:', result.error);
        toast({
          title: 'Error',
          description: result.error || 'Could not generate share link. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      setShareToken(result.shareToken.token);
    } catch (err) {
      console.error('Error generating share token:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingToken(false);
    }
  };

  // Copy share link to clipboard
  const copyToClipboard = () => {
    if (shareToken) {
      const link = `${window.location.origin}/book/${shareToken}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      toast({
        title: "Link copied",
        description: "The booking form link has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Handle button click
  const handleClick = async () => {
    if (isFormCustomized) {
      setIsDialogOpen(true);
      if (!shareToken) {
        await generateShareToken();
      }
    } else {
      // Redirect to form settings with a notification
      toast({
        title: "Form not customized",
        description: "Please customize your booking form before sharing it.",
      });
      router.push("/dashboard/settings?tab=form");
    }
  };

  if (isLoading) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        {!iconOnly && "Loading..."}
      </Button>
    );
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleClick}
      >
        <Share className={`h-5 w-5 ${!iconOnly ? "mr-2" : ""}`} />
        {!iconOnly && "Share Booking Form"}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Booking Form</DialogTitle>
            <DialogDescription>
              Share this link with your clients to let them book appointments with you.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="grid flex-1 gap-2">
                <label htmlFor="link" className="sr-only">
                  Link
                </label>
                <Input
                  id="link"
                  value={shareToken ? `${window.location.origin}/book/${shareToken}` : 'Generating link...'}
                  readOnly
                />
              </div>
              <Button
                size="icon"
                onClick={copyToClipboard}
                disabled={!shareToken || isGeneratingToken}
              >
                {isGeneratingToken ? <Loader2 className="h-4 w-4 animate-spin" /> :
                 copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              This link allows clients to book appointments directly with you. You can share it on your website, social media, or via email.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
