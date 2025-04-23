"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share, Copy, Check, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface ShareFormButtonProps {
  userId: string;
}

export function ShareFormButton({ userId }: ShareFormButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generateShareToken = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/form/share-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
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
      setIsGenerating(false);
    }
  };

  const handleOpen = async () => {
    setIsOpen(true);
    if (!shareToken) {
      await generateShareToken();
    }
  };

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

  return (
    <>
      <Button onClick={handleOpen} variant="outline" className="gap-2">
        <Share className="h-4 w-4" />
        Share Booking Form
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
                disabled={!shareToken || isGenerating}
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> :
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
