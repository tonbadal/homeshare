"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { ImagePlus, Loader2, Save, Trash2 } from "lucide-react";
import type { Tables } from "@/lib/types/database.types";

interface HomeSettingsProps {
  home: Tables<"homes">;
  isAdmin: boolean;
  homeId: string;
}

export function HomeSettings({
  home,
  isAdmin,
  homeId,
}: HomeSettingsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [name, setName] = useState(home.name);
  const [address, setAddress] = useState(home.address ?? "");
  const [description, setDescription] = useState(home.description ?? "");
  const [approvalPolicy, setApprovalPolicy] = useState(home.approval_policy);
  const [saving, setSaving] = useState(false);

  const [coverImageUrl, setCoverImageUrl] = useState(home.cover_image_url ?? "");
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);

    const ext = file.name.split(".").pop();
    const filePath = `${homeId}/cover.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("home-media")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({
        title: "Upload failed",
        description: "Could not upload the image. Please try again or use a smaller file.",
        variant: "destructive",
      });
      setUploadingCover(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("home-media").getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from("homes")
      .update({ cover_image_url: publicUrl })
      .eq("id", homeId);

    if (updateError) {
      toast({
        title: "Upload failed",
        description: "The image was uploaded but we couldn't save it. Please try again.",
        variant: "destructive",
      });
    } else {
      setCoverImageUrl(publicUrl);
      toast({ title: "Cover image updated!" });
      router.refresh();
    }

    setUploadingCover(false);
    if (coverInputRef.current) {
      coverInputRef.current.value = "";
    }
  }

  async function handleDeleteCover() {
    setUploadingCover(true);

    const { data: files } = await supabase.storage
      .from("home-media")
      .list(homeId, { search: "cover" });

    if (files && files.length > 0) {
      await supabase.storage
        .from("home-media")
        .remove(files.map((f) => `${homeId}/${f.name}`));
    }

    const { error } = await supabase
      .from("homes")
      .update({ cover_image_url: null })
      .eq("id", homeId);

    if (error) {
      toast({
        title: "Error",
        description: "Could not remove the cover image. Please try again.",
        variant: "destructive",
      });
    } else {
      setCoverImageUrl("");
      toast({ title: "Cover image removed." });
      router.refresh();
    }

    setUploadingCover(false);
  }

  async function handleSaveHome(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("homes")
      .update({
        name,
        address: address || null,
        description: description || null,
        approval_policy: approvalPolicy,
      })
      .eq("id", homeId);

    if (error) {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    } else {
      toast({ title: "Settings saved!" });
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Home Details</CardTitle>
          <CardDescription>Update your home&apos;s information.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveHome} className="space-y-4">
            {/* Cover image */}
            <div className="space-y-2">
              <Label>Cover Image</Label>
              {coverImageUrl ? (
                <div className="relative w-full aspect-[3/1] rounded-lg overflow-hidden border border-[var(--border)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverImageUrl}
                    alt={`${home.name} cover`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center w-full aspect-[3/1] rounded-lg border border-dashed border-[var(--border)] bg-[var(--muted)]">
                  <p className="text-sm text-[var(--muted-foreground)]">
                    No cover image yet
                  </p>
                </div>
              )}
              {isAdmin && (
                <div className="flex gap-2">
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadingCover}
                    onClick={() => coverInputRef.current?.click()}
                  >
                    {uploadingCover ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ImagePlus className="h-4 w-4" />
                    )}
                    {coverImageUrl ? "Change image" : "Upload image"}
                  </Button>
                  {coverImageUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingCover}
                      onClick={handleDeleteCover}
                      className="text-[var(--destructive)]"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  )}
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="home-name">Name</Label>
              <Input
                id="home-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isAdmin}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="home-address">Address</Label>
              <Input
                id="home-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={!isAdmin}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="home-desc">Description</Label>
              <Textarea
                id="home-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!isAdmin}
                rows={3}
              />
            </div>
            {isAdmin && (
              <div className="space-y-2">
                <Label>Booking approval policy</Label>
                <Select
                  value={approvalPolicy}
                  onValueChange={(v) => setApprovalPolicy(v as "any_admin" | "all_admins")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any_admin">Any admin can approve</SelectItem>
                    <SelectItem value="all_admins">All admins must approve</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {isAdmin && (
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="animate-spin" /> : <Save className="h-4 w-4" />}
                Save changes
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
