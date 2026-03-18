"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { ImagePlus, X, Loader2 } from "lucide-react";
import type { Tables } from "@/lib/types/database.types";

type EntryWithMedia = Tables<"manual_entries"> & {
  manual_entry_media: Tables<"manual_entry_media">[];
};

interface ManualEntryEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  homeId: string;
  userId: string;
  categoryId: string | null;
  entry: EntryWithMedia | null;
  entriesCount: number;
  onSaved: (entry: EntryWithMedia) => void;
}

type MediaItem = {
  id: string;
  url: string;
  media_type: "image" | "video";
  isNew?: boolean;
  file?: File;
};

export function ManualEntryEditor({
  open,
  onOpenChange,
  homeId,
  userId,
  categoryId,
  entry,
  entriesCount,
  onSaved,
}: ManualEntryEditorProps) {
  const supabase = createClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(entry?.title ?? "");
  const [content, setContent] = useState(entry?.content ?? "");
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(() =>
    entry
      ? entry.manual_entry_media.map((m) => ({
          id: m.id,
          url: m.url,
          media_type: m.media_type,
        }))
      : []
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Sync form state when dialog opens or entry changes
  useEffect(() => {
    if (open) {
      setTitle(entry?.title ?? "");
      setContent(entry?.content ?? "");
      setMediaItems(
        entry
          ? entry.manual_entry_media.map((m) => ({
              id: m.id,
              url: m.url,
              media_type: m.media_type,
            }))
          : []
      );
      setSaving(false);
      setUploading(false);
    }
  }, [open, entry]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      onOpenChange(nextOpen);
    },
    [onOpenChange]
  );

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    for (const file of Array.from(files)) {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      if (!isImage && !isVideo) continue;

      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      // Use a temp path for new entries, will be organized after save
      const filePath = `${homeId}/manual/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("home-media")
        .upload(filePath, file);

      if (uploadError) {
        toast({
          title: "Upload failed",
          description: uploadError.message,
          variant: "destructive",
        });
        continue;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("home-media").getPublicUrl(filePath);

      setMediaItems((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          url: publicUrl,
          media_type: isImage ? "image" : "video",
          isNew: true,
        },
      ]);
    }

    setUploading(false);
    // Reset the file input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removeMedia(id: string) {
    setMediaItems((prev) => prev.filter((m) => m.id !== id));
  }

  async function handleSave() {
    if (!title.trim() || !categoryId) return;
    setSaving(true);

    try {
      let savedEntry: Tables<"manual_entries">;

      if (entry) {
        // Update existing entry
        const { data, error } = await supabase
          .from("manual_entries")
          .update({
            title: title.trim(),
            content: content,
            updated_at: new Date().toISOString(),
          })
          .eq("id", entry.id)
          .select()
          .single();

        if (error) throw error;
        savedEntry = data;

        // Remove old media records and re-insert
        await supabase
          .from("manual_entry_media")
          .delete()
          .eq("entry_id", entry.id);
      } else {
        // Create new entry
        const { data, error } = await supabase
          .from("manual_entries")
          .insert({
            category_id: categoryId,
            home_id: homeId,
            title: title.trim(),
            content: content,
            sort_order: entriesCount,
            created_by: userId,
          })
          .select()
          .single();

        if (error) throw error;
        savedEntry = data;
      }

      // Insert media records
      const mediaRecords: Tables<"manual_entry_media">[] = [];
      if (mediaItems.length > 0) {
        const { data: insertedMedia, error: mediaError } = await supabase
          .from("manual_entry_media")
          .insert(
            mediaItems.map((m, index) => ({
              entry_id: savedEntry.id,
              media_type: m.media_type,
              url: m.url,
              sort_order: index,
            }))
          )
          .select();

        if (mediaError) {
          toast({
            title: "Entry saved, but some media failed to link",
            variant: "destructive",
          });
        } else if (insertedMedia) {
          mediaRecords.push(...insertedMedia);
        }
      }

      const result: EntryWithMedia = {
        ...savedEntry,
        manual_entry_media: mediaRecords,
      };

      onSaved(result);
      toast({ title: entry ? "Entry updated" : "Entry created" });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      toast({
        title: "Error saving entry",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{entry ? "Edit entry" : "New entry"}</DialogTitle>
          <DialogDescription>
            {entry
              ? "Update the title, content, and photos for this entry."
              : "Add a new instruction or piece of information to this category."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="entry-title">Title</Label>
            <Input
              id="entry-title"
              placeholder="e.g. How to connect to Wi-Fi"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Content (markdown) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="entry-content">Content</Label>
              <span className="text-xs text-[var(--muted-foreground)]">
                Supports Markdown
              </span>
            </div>
            <Textarea
              id="entry-content"
              placeholder={`Write your instructions here...\n\nYou can use **bold**, *italic*, bullet lists, and more.`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              className="font-mono text-sm"
            />
          </div>

          {/* Photo upload */}
          <div className="space-y-2">
            <Label>Photos</Label>
            <div className="flex flex-wrap gap-2">
              {mediaItems.map((media) => (
                <div
                  key={media.id}
                  className="relative group rounded-md overflow-hidden border border-[var(--border)]"
                >
                  {media.media_type === "image" ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={media.url}
                      alt=""
                      className="h-20 w-20 object-cover"
                    />
                  ) : (
                    <video
                      src={media.url}
                      className="h-20 w-20 object-cover"
                      muted
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => removeMedia(media.id)}
                    className="absolute top-0.5 right-0.5 rounded-full bg-black/60 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {/* Upload button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex flex-col items-center justify-center h-20 w-20 rounded-md border-2 border-dashed border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <ImagePlus className="h-5 w-5" />
                    <span className="text-[10px] mt-1">Add</span>
                  </>
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !title.trim() || uploading}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : entry ? (
              "Update"
            ) : (
              "Create"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
