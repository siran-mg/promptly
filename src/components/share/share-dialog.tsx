"use client";

import { useState, useEffect } from "react";
import {
  Copy, Mail, Loader2, Check, Settings, Trash2,
  Share, CheckCircle, Circle, Share2, X, Plus, Edit, MoreHorizontal,
  Search
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
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

interface ShareToken {
  id: string;
  user_id: string;
  token: string;
  created_at: string;
  updated_at: string;
  selected_types: string[] | null;
  default_type: string | null;
  name: string;
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

  const [shareTokens, setShareTokens] = useState<ShareToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<Record<string, boolean>>({});
  const [defaultType, setDefaultType] = useState<string | undefined>(defaultTypeId);
  const [editingToken, setEditingToken] = useState<ShareToken | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [tokenName, setTokenName] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [tokenToDelete, setTokenToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch share tokens when dialog opens
  useEffect(() => {
    if (open) {
      fetchShareTokens();
    }
  }, [open]);

  // Fetch all share tokens for the user
  const fetchShareTokens = async () => {
    setIsLoading(true);
    try {
      // Get user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all tokens for this user
      const response = await fetch(`/api/form/share-token?userId=${user.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('API error:', result.error);
        toast({
          title: 'Error',
          description: result.error || 'Could not fetch share links. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      setShareTokens(result.shareTokens || []);

      // If no tokens exist, initialize the form for creating a new one
      if (!result.shareTokens || result.shareTokens.length === 0) {
        setIsCreatingNew(true);
        initializeNewTokenForm();
      }
    } catch (err) {
      console.error('Error fetching share tokens:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize the form for creating a new token
  const initializeNewTokenForm = () => {
    setTokenName('Default Link');

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
  };

  // Create a new share token
  const createShareToken = async () => {
    setIsLoading(true);
    try {
      // Get user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get selected type IDs
      const selectedTypeIds = Object.entries(selectedTypes)
        .filter(([_, isSelected]) => isSelected)
        .map(([id]) => id);

      // Create a new token via the API
      const response = await fetch('/api/form/share-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          name: tokenName,
          selectedTypes: selectedTypeIds,
          defaultType: defaultType
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('API error:', result.error);
        toast({
          title: 'Error',
          description: result.error || 'Could not create share link. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      // Add the new token to the list
      setShareTokens(prev => [result.shareToken, ...prev]);
      setIsCreatingNew(false);

      toast({
        title: 'New link created',
        description: 'Your new booking form link has been created.',
      });
    } catch (err) {
      console.error('Error creating share token:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update an existing share token
  const updateShareToken = async () => {
    if (!editingToken) return;

    setIsLoading(true);
    try {
      // Get user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get selected type IDs
      const selectedTypeIds = Object.entries(selectedTypes)
        .filter(([_, isSelected]) => isSelected)
        .map(([id]) => id);

      // Update the token via the API
      const response = await fetch('/api/form/share-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          tokenId: editingToken.id,
          name: tokenName,
          selectedTypes: selectedTypeIds,
          defaultType: defaultType
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('API error:', result.error);
        toast({
          title: 'Error',
          description: result.error || 'Could not update share link. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      // Update the token in the list
      setShareTokens(prev =>
        prev.map(token => token.id === editingToken.id ? result.shareToken : token)
      );
      setEditingToken(null);

      toast({
        title: 'Link updated',
        description: 'Your booking form link has been updated.',
      });
    } catch (err) {
      console.error('Error updating share token:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a share token
  const deleteShareToken = async (tokenId: string) => {
    setIsLoading(true);
    try {
      // Get user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user found');
        return;
      }

      // Delete the token via the API
      const url = `/api/form/share-token?tokenId=${tokenId}&userId=${user.id}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('API error:', result.error);
        toast({
          title: 'Error',
          description: result.error || 'Could not delete share link. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      // Remove the token from the list
      setShareTokens(prev => prev.filter(token => token.id !== tokenId));

      setDeleteConfirmOpen(false);
      setTokenToDelete(null);

      toast({
        title: 'Link deleted',
        description: 'Your booking form link has been deleted.',
      });
    } catch (err) {
      console.error('Error deleting share token:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Copy link to clipboard
  const copyToClipboard = (token: ShareToken, typeId?: string) => {
    let link = `${window.location.origin}/book/${token.token}`;

    // Add type parameter if specified
    if (typeId) {
      link += `?type=${typeId}`;
    } else if (token.default_type && token.selected_types && token.selected_types.length > 1) {
      // If there's a default type and multiple types are selected
      link += `?type=${token.default_type}`;
    }

    navigator.clipboard.writeText(link);
    setCopied(token.id);

    toast({
      title: "Link copied",
      description: "The booking form link has been copied to your clipboard.",
    });

    setTimeout(() => setCopied(null), 2000);
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
  const shareOnSocial = (token: ShareToken, platform: 'facebook' | 'twitter' | 'email') => {
    if (!token) return;

    let link = `${window.location.origin}/book/${token.token}`;

    // Add default type if specified
    if (token.default_type) {
      link += `?type=${token.default_type}`;
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
      router.push('/dashboard/settings?tab=form');
      onOpenChange(false);
    }
  };

  // Start editing a token
  const startEditing = (token: ShareToken) => {
    setEditingToken(token);
    setTokenName(token.name);

    // Initialize selected types from token
    const typesMap: Record<string, boolean> = {};
    appointmentTypes.forEach(type => {
      typesMap[type.id] = token.selected_types ? token.selected_types.includes(type.id) : false;
    });
    setSelectedTypes(typesMap);

    // Set default type
    setDefaultType(token.default_type || undefined);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingToken(null);
    setIsCreatingNew(false);
  };

  // Start creating a new token
  const startCreatingNew = () => {
    setIsCreatingNew(true);
    initializeNewTokenForm();
  };

  // Get the booking link for a token
  const getBookingLink = (token: ShareToken) => {
    let link = `${window.location.origin}/book/${token.token}`;

    // Add default type if specified and multiple types are selected
    if (token.default_type && token.selected_types && token.selected_types.length > 1) {
      link += `?type=${token.default_type}`;
    }

    return link;
  };

  // Filter tokens based on search query
  const filteredTokens = shareTokens.filter(token => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();

    // Search in token name
    if (token.name.toLowerCase().includes(query)) return true;

    // Search in appointment types
    if (token.selected_types && token.selected_types.length > 0) {
      const matchingTypes = appointmentTypes.filter(type =>
        token.selected_types?.includes(type.id) &&
        type.name.toLowerCase().includes(query)
      );
      if (matchingTypes.length > 0) return true;
    }

    // Search in token ID (for advanced users)
    if (token.token.toLowerCase().includes(query)) return true;

    return false;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl flex items-center justify-center text-primary">
            <Share className="h-5 w-5 mr-2" />
            <span>Share Your Booking Form</span>
          </DialogTitle>
          <DialogDescription>
            Create and manage links to share with your clients.
          </DialogDescription>
        </DialogHeader>

        {/* Main content area */}
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Create new link button and search - only show if there are existing tokens */}
            {!isCreatingNew && !editingToken && shareTokens.length > 0 && (
              <div className="mb-4 space-y-2">
                <Button
                  onClick={startCreatingNew}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Booking Link
                </Button>

                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search links..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 bg-white border-primary/20 focus-visible:ring-primary/30"
                  />
                  {searchQuery && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute right-0 top-0 h-full text-muted-foreground hover:text-foreground"
                      onClick={() => setSearchQuery('')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Form for creating/editing a link */}
            {(isCreatingNew || editingToken) && (
              <div className="bg-muted/50 p-4 rounded-lg mb-4">
                <h3 className="text-sm font-medium mb-3 flex items-center">
                  {editingToken ? (
                    <>
                      <Edit className="h-4 w-4 mr-1.5 text-primary" />
                      Edit Booking Link
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-1.5 text-primary" />
                      New Booking Link
                    </>
                  )}
                </h3>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="link-name">Link Name</Label>
                    <Input
                      id="link-name"
                      value={tokenName}
                      onChange={(e) => setTokenName(e.target.value)}
                      placeholder="e.g. Default Link, Client Booking, etc."
                      className="mt-1"
                    />
                  </div>

                  {appointmentTypes.length > 0 && (
                    <div>
                      <Label className="block mb-2">Appointment Types to Include</Label>
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
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={cancelEditing}
                      className="border-gray-200 hover:bg-gray-100"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={editingToken ? updateShareToken : createShareToken}
                      className="bg-primary hover:bg-primary/90"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      {editingToken ? 'Update Link' : 'Create Link'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* List of existing links */}
            {!isCreatingNew && !editingToken && shareTokens.length > 0 && (
              <div className="space-y-4">
                {filteredTokens.length === 0 && searchQuery && (
                  <div className="text-center py-6">
                    <Search className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No links found matching "{searchQuery}"</p>
                    <Button
                      variant="link"
                      onClick={() => setSearchQuery('')}
                      className="mt-2 text-primary"
                    >
                      Clear search
                    </Button>
                  </div>
                )}
                {filteredTokens.map((token) => (
                  <Card key={token.id} className="overflow-hidden">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base flex items-center justify-between">
                        <span>{token.name}</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => startEditing(token)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setTokenToDelete(token.id);
                              setDeleteConfirmOpen(true);
                            }}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Created {new Date(token.created_at).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <div className="relative">
                        <Input
                          value={getBookingLink(token)}
                          readOnly
                          className="pr-10 bg-white border-primary/20 focus-visible:ring-primary/30 text-sm"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute right-0 top-0 h-full text-primary hover:text-primary/80 hover:bg-primary/10"
                          onClick={() => copyToClipboard(token)}
                        >
                          {copied === token.id ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      {/* Appointment types included */}
                      {token.selected_types && token.selected_types.length > 0 ? (
                        <div className="mt-3">
                          <p className="text-xs text-muted-foreground mb-1">Appointment types:</p>
                          <div className="flex flex-wrap gap-1">
                            {appointmentTypes
                              .filter(type => token.selected_types?.includes(type.id))
                              .map(type => (
                                <div
                                  key={type.id}
                                  className="text-xs px-2 py-1 rounded-full flex items-center"
                                  style={{
                                    backgroundColor: `${type.color}20` || '#6366f120',
                                    color: type.color || '#6366f1'
                                  }}
                                >
                                  <div
                                    className="w-2 h-2 rounded-full mr-1"
                                    style={{ backgroundColor: type.color || '#6366f1' }}
                                  />
                                  {type.name}
                                  {token.default_type === type.id && (
                                    <span className="ml-1">(Default)</span>
                                  )}
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-2">No appointment types selected</p>
                      )}
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex justify-between">
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => shareOnSocial(token, 'email')}
                        >
                          <Mail className="h-3 w-3 mr-1" />
                          Email
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => {
                            window.open(`${window.location.origin}/book/${token.token}`, '_blank');
                          }}
                        >
                          <Share2 className="h-3 w-3 mr-1" />
                          Open
                        </Button>
                      </div>
                      <Button
                        size="sm"
                        onClick={handleCustomizeForm}
                        className="text-xs bg-primary hover:bg-primary/90"
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Customize Form
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!isCreatingNew && !editingToken && shareTokens.length === 0 && (
              <div className="text-center py-12 flex flex-col items-center justify-center">
                <Share2 className="h-16 w-16 mx-auto text-primary/20 mb-6" />
                <h3 className="text-xl font-medium mb-2">No booking links yet</h3>
                <p className="text-muted-foreground mb-6 max-w-xs mx-auto">
                  Create your first booking link to share with clients and start receiving appointments.
                </p>
                <Button
                  onClick={startCreatingNew}
                  className="bg-primary hover:bg-primary/90 px-6"
                  size="lg"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Booking Link
                </Button>
              </div>
            )}
          </>
        )}

        {/* Close button at the bottom - only show when there are tokens */}
        {!isCreatingNew && !editingToken && shareTokens.length > 0 && (
          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-200 hover:bg-gray-100"
            >
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        )}
      </DialogContent>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this booking link. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              asChild
            >
              <Button
                onClick={() => tokenToDelete && deleteShareToken(tokenToDelete)}
                className="bg-red-600 hover:bg-red-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
