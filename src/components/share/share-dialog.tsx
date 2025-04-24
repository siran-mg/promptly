"use client";

import { useState, useEffect } from "react";
import {
  Copy, Facebook, Twitter, Mail, RefreshCw, Loader2, Check, Settings,
  Share, Link, Info, Calendar, CalendarPlus, ListChecks, CheckCircle,
  Circle, Share2, X
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

interface AppointmentType {
  id: string;
  name: string;
  duration: number;
  is_default: boolean;
  description?: string | null;
  color?: string | null;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentTypes: AppointmentType[];
  defaultTypeId?: string;
  onCustomizeForm?: () => void;
}

export function ShareDialog({
  open,
  onOpenChange,
  appointmentTypes,
  defaultTypeId,
  onCustomizeForm,
}: ShareDialogProps) {
  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();

  const [shareToken, setShareToken] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<Record<string, boolean>>({});
  const [defaultType, setDefaultType] = useState<string | undefined>(defaultTypeId);

  // Fetch share token when dialog opens
  useEffect(() => {
    if (open) {
      fetchShareToken();

      // Initialize selected types
      const initialSelectedTypes: Record<string, boolean> = {};
      appointmentTypes.forEach(type => {
        initialSelectedTypes[type.id] = defaultTypeId ? type.id === defaultTypeId : true;
      });
      setSelectedTypes(initialSelectedTypes);

      // Set default type
      if (defaultTypeId) {
        setDefaultType(defaultTypeId);
      } else {
        // Find the default appointment type
        const defaultType = appointmentTypes.find(type => type.is_default);
        if (defaultType) {
          setDefaultType(defaultType.id);
        }
      }
    }
  }, [open, appointmentTypes, defaultTypeId]);

  // Fetch existing share token
  const fetchShareToken = async () => {
    try {
      // Get user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if a token already exists
      const { data: existingToken, error } = await supabase
        .from("form_share_tokens")
        .select("token")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching share token:', error);
        return;
      }

      if (existingToken?.token) {
        setShareToken(existingToken.token);
        return true;
      }

      // If no token exists, generate one
      await generateShareToken();
      return false;
    } catch (err) {
      console.error('Error fetching share token:', err);
      return false;
    }
  };

  // Generate or get share token
  const generateShareToken = async (forceNew = false) => {
    setIsGenerating(true);
    try {
      // Get user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create a new token via the API
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

      if (forceNew) {
        toast({
          title: 'New link generated',
          description: 'A new booking form link has been generated. The old link will no longer work.',
        });
      }
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

  // Copy link to clipboard
  const copyToClipboard = (typeId?: string) => {
    if (!shareToken) return;

    let link = `${window.location.origin}/book/${shareToken}`;

    // Add type parameter if specified
    if (typeId) {
      link += `?type=${typeId}`;
    } else if (defaultType && Object.keys(selectedTypes).length > 1) {
      // If there's a default type and multiple types are selected
      link += `?type=${defaultType}`;
    }

    navigator.clipboard.writeText(link);
    setCopied(true);

    toast({
      title: "Link copied",
      description: "The booking form link has been copied to your clipboard.",
    });

    setTimeout(() => setCopied(false), 2000);
  };

  // Handle type selection
  const handleTypeSelection = (typeId: string, checked: boolean) => {
    setSelectedTypes(prev => ({
      ...prev,
      [typeId]: checked
    }));

    // If this was the default type and it's being deselected, reset default
    if (defaultType === typeId && !checked) {
      setDefaultType(undefined);
    }

    // If this is the only selected type, make it the default
    const selectedCount = Object.values(selectedTypes).filter(Boolean).length;
    if (checked && selectedCount === 0) {
      setDefaultType(typeId);
    }
  };

  // Set a type as default
  const setAsDefault = (typeId: string) => {
    // Ensure the type is selected
    if (!selectedTypes[typeId]) {
      setSelectedTypes(prev => ({
        ...prev,
        [typeId]: true
      }));
    }

    setDefaultType(typeId);
  };

  // Share on social media
  const shareOnSocial = (platform: 'facebook' | 'twitter' | 'email') => {
    if (!shareToken) return;

    let link = `${window.location.origin}/book/${shareToken}`;

    // Add default type if specified
    if (defaultType) {
      link += `?type=${defaultType}`;
    }

    let shareUrl = '';
    const text = 'Book an appointment with me using this link:';

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=Book an appointment&body=${encodeURIComponent(`${text} ${link}`)}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
  };

  // Handle customize form button
  const handleCustomizeForm = () => {
    if (onCustomizeForm) {
      onCustomizeForm();
    } else {
      router.push('/dashboard/settings?tab=customize');
      onOpenChange(false);
    }
  };

  // Get the base booking link
  const getBookingLink = () => {
    if (!shareToken) return 'Generating link...';

    let link = `${window.location.origin}/book/${shareToken}`;

    // Add default type if specified and multiple types are selected
    if (defaultType && Object.keys(selectedTypes).filter(id => selectedTypes[id]).length > 1) {
      link += `?type=${defaultType}`;
    }

    return link;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl flex items-center justify-center text-primary">
            <Share className="h-5 w-5 mr-2" />
            <span>Share Your Booking Form</span>
          </DialogTitle>
          <DialogDescription>
            Share this link with your clients so they can book appointments with you.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 p-4 rounded-lg">
          <p className="text-sm font-medium mb-2 flex items-center">
            <Link className="h-4 w-4 mr-1.5 text-primary" />
            Your unique booking link:
          </p>
          <div className="flex items-center mb-4">
            <div className="relative w-full">
              <Input
                value={getBookingLink()}
                readOnly
                className="pr-10 bg-white border-primary/20 focus-visible:ring-primary/30"
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-0 top-0 h-full text-primary hover:text-primary/80 hover:bg-primary/10"
                onClick={() => copyToClipboard()}
                disabled={!shareToken || isGenerating}
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> :
                 copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="mb-2">
            <p className="text-sm mb-2 flex items-center">
              <Info className="h-4 w-4 mr-1.5 text-blue-500" />
              Your clients can use this link to:
            </p>
            <ul className="list-none pl-5 space-y-2 text-sm">
              <li className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-green-500" />
                View your availability
              </li>
              <li className="flex items-center">
                <CalendarPlus className="h-4 w-4 mr-2 text-indigo-500" />
                Book appointments directly
              </li>
              <li className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-amber-500" />
                Receive confirmation emails
              </li>
            </ul>
          </div>
        </div>

        {appointmentTypes.length > 0 && (
          <div className="bg-muted/50 p-4 rounded-lg mt-4">
            <p className="text-sm font-medium mb-3 flex items-center">
              <ListChecks className="h-4 w-4 mr-1.5 text-primary" />
              Appointment types to include:
            </p>
            <div className="space-y-2">
              {appointmentTypes.map((type) => (
                <div key={type.id} className="flex items-center justify-between p-2 bg-white rounded-md border border-muted">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type.id}`}
                      checked={selectedTypes[type.id] || false}
                      onCheckedChange={(checked) => handleTypeSelection(type.id, checked === true)}
                      className="text-primary border-primary/30"
                    />
                    <div
                      className="w-3 h-3 rounded-full mr-1"
                      style={{ backgroundColor: type.color || '#6366f1' }}
                    />
                    <Label htmlFor={`type-${type.id}`} className="text-sm">
                      {type.name} ({type.duration} min)
                    </Label>
                  </div>
                  {selectedTypes[type.id] && (
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant={defaultType === type.id ? "default" : "outline"}
                        className={`text-xs ${defaultType === type.id ? "bg-primary text-primary-foreground" : "border-primary/30 text-primary hover:bg-primary/10"}`}
                        onClick={() => setAsDefault(type.id)}
                      >
                        {defaultType === type.id ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Default
                          </>
                        ) : (
                          <>
                            <Circle className="h-3 w-3 mr-1" />
                            Set as default
                          </>
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-primary hover:text-primary/80 hover:bg-primary/10"
                        onClick={() => copyToClipboard(type.id)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-muted/50 p-4 rounded-lg mt-4">
          <p className="text-sm font-medium mb-3 flex items-center">
            <Share2 className="h-4 w-4 mr-1.5 text-primary" />
            Share on social media:
          </p>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              className="flex-1 justify-center bg-white hover:bg-blue-50 border-blue-200 text-blue-600 hover:text-blue-700"
              onClick={() => shareOnSocial('facebook')}
            >
              <Facebook className="h-4 w-4 mr-2" />
              Facebook
            </Button>
            <Button
              variant="outline"
              className="flex-1 justify-center bg-white hover:bg-sky-50 border-sky-200 text-sky-500 hover:text-sky-600"
              onClick={() => shareOnSocial('twitter')}
            >
              <Twitter className="h-4 w-4 mr-2" />
              Twitter
            </Button>
            <Button
              variant="outline"
              className="flex-1 justify-center bg-white hover:bg-amber-50 border-amber-200 text-amber-600 hover:text-amber-700"
              onClick={() => shareOnSocial('email')}
            >
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-200 hover:bg-gray-100"
          >
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => generateShareToken(true)}
              className="border-primary/30 text-primary hover:bg-primary/10"
              disabled={isGenerating}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              New Link
            </Button>
            <Button
              onClick={handleCustomizeForm}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              <Settings className="h-4 w-4" />
              Customize Form
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
