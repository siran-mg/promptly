"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Share, Loader2, Copy, Check, ExternalLink, Mail, Settings } from "lucide-react";
import { Facebook, Twitter } from "./social-icons";
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

      // Open a dialog with more information before redirecting
      setIsDialogOpen(true);

      // We'll handle the redirect in the dialog
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
        <DialogContent className="sm:max-w-md">
          {isFormCustomized ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-center text-xl font-bold">
                  <Share className="h-5 w-5 mr-2 text-primary" />
                  Share Your Booking Form
                </DialogTitle>
                <DialogDescription className="text-center pt-2">
                  Share this link with your clients so they can book appointments with you.
                </DialogDescription>
              </DialogHeader>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-center text-xl font-bold text-amber-600">
                  <Settings className="h-5 w-5 mr-2 text-amber-600" />
                  Form Not Customized
                </DialogTitle>
                <DialogDescription className="text-center pt-2">
                  Your booking form needs to be customized before sharing.
                </DialogDescription>
              </DialogHeader>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-4">
                <div className="flex items-start">
                  <div className="bg-amber-100 p-2 rounded-full mr-3">
                    <ExternalLink className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-amber-800">Why customize your form?</h3>
                    <p className="text-sm text-amber-700 mt-1">
                      A personalized booking form creates a better experience for your clients and helps establish your brand identity.
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center">
                    <Check className="h-4 w-4 text-amber-600 mr-2" />
                    <span className="text-sm text-amber-700">Add your business name and description</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-4 w-4 text-amber-600 mr-2" />
                    <span className="text-sm text-amber-700">Upload your logo for brand recognition</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-4 w-4 text-amber-600 mr-2" />
                    <span className="text-sm text-amber-700">Choose colors that match your brand</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {isFormCustomized ? (
            <>
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 my-4">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="grid flex-1 gap-2">
                    <label htmlFor="link" className="text-sm font-medium">
                      Your unique booking link:
                    </label>
                    <div className="relative">
                      <Input
                        id="link"
                        value={shareToken ? `${window.location.origin}/book/${shareToken}` : 'Generating link...'}
                        readOnly
                        className="pr-10 bg-white font-medium text-primary"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={copyToClipboard}
                          disabled={!shareToken || isGeneratingToken}
                          className="h-7 w-7"
                        >
                          {isGeneratingToken ? <Loader2 className="h-4 w-4 animate-spin" /> :
                          copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {copied && (
                  <div className="bg-green-50 text-green-700 text-sm p-2 rounded-md mb-3 flex items-center">
                    <Check className="h-4 w-4 mr-2" />
                    Link copied to clipboard!
                  </div>
                )}

                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">Your clients can use this link to:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>View your availability</li>
                    <li>Book appointments directly</li>
                    <li>Receive confirmation emails</li>
                  </ul>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center">
                  <ExternalLink className="h-4 w-4 mr-2 text-primary" />
                  Share on:
                </h4>
                <div className="flex space-x-2 mb-3">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                    if (shareToken) {
                      const link = `${window.location.origin}/book/${shareToken}`;
                      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`, '_blank');
                    }
                  }} disabled={!shareToken}>
                    <Facebook className="h-4 w-4 mr-2" />
                    Facebook
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                    if (shareToken) {
                      const link = `${window.location.origin}/book/${shareToken}`;
                      const text = "Book an appointment with me:";
                      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`, '_blank');
                    }
                  }} disabled={!shareToken}>
                    <Twitter className="h-4 w-4 mr-2" />
                    Twitter
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                    if (shareToken) {
                      const link = `${window.location.origin}/book/${shareToken}`;
                      const subject = "Book an appointment with me";
                      const body = `Hello,\n\nYou can book an appointment with me using this link:\n${link}\n\nLooking forward to meeting with you!`;
                      window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
                    }
                  }} disabled={!shareToken}>
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                </div>
              </div>

              <div className="flex justify-between mt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Close
                </Button>
                <Button variant="default" onClick={() => router.push("/dashboard/settings?tab=form")}>
                  <Settings className="h-4 w-4 mr-2" />
                  Customize Form
                </Button>
              </div>
            </>
          ) : (
            <div className="flex justify-center mt-6">
              <Button
                variant="default"
                size="lg"
                className="bg-amber-600 hover:bg-amber-700 text-white w-full"
                onClick={() => {
                  setIsDialogOpen(false);
                  router.push("/dashboard/settings?tab=form");
                }}
              >
                <Settings className="h-5 w-5 mr-2" />
                Customize Form Now
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
