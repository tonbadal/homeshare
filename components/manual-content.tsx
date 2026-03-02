"use client";

import { useState, useMemo } from "react";
import Markdown from "react-markdown";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils/cn";
import {
  Plus,
  Pencil,
  Trash2,
  BookOpen,
  Wifi,
  Car,
  Flame,
  Droplets,
  UtensilsCrossed,
  Bed,
  ShieldCheck,
  Thermometer,
  KeyRound,
  Phone,
  Tv,
  Warehouse,
  Leaf,
  Trash,
  WashingMachine,
  Info,
  type LucideIcon,
} from "lucide-react";
import { ManualEntryEditor } from "@/components/manual-entry-editor";
import type { Tables } from "@/lib/types/database.types";

type EntryWithMedia = Tables<"manual_entries"> & {
  manual_entry_media: Tables<"manual_entry_media">[];
};

interface ManualContentProps {
  homeId: string;
  userId: string;
  isAdmin: boolean;
  initialCategories: Tables<"manual_categories">[];
  initialEntries: EntryWithMedia[];
}

// Map of icon names to lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  BookOpen,
  Wifi,
  Car,
  Flame,
  Droplets,
  UtensilsCrossed,
  Bed,
  ShieldCheck,
  Thermometer,
  KeyRound,
  Phone,
  Tv,
  Warehouse,
  Leaf,
  Trash,
  WashingMachine,
  Info,
};

const ICON_OPTIONS = Object.keys(ICON_MAP);

function CategoryIcon({
  iconName,
  className,
}: {
  iconName: string | null;
  className?: string;
}) {
  const Icon = iconName ? ICON_MAP[iconName] : null;
  if (!Icon) {
    return <BookOpen className={className} />;
  }
  return <Icon className={className} />;
}

export function ManualContent({
  homeId,
  userId,
  isAdmin,
  initialCategories,
  initialEntries,
}: ManualContentProps) {
  const supabase = createClient();
  const { toast } = useToast();

  const [categories, setCategories] = useState(initialCategories);
  const [entries, setEntries] = useState(initialEntries);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    initialCategories[0]?.id ?? null
  );

  // Category dialog state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<Tables<"manual_categories"> | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryIcon, setCategoryIcon] = useState<string>("BookOpen");
  const [categorySaving, setCategorySaving] = useState(false);

  // Delete confirmation
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] =
    useState(false);
  const [categoryToDelete, setCategoryToDelete] =
    useState<Tables<"manual_categories"> | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Entry editor state
  const [entryEditorOpen, setEntryEditorOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<EntryWithMedia | null>(null);

  // Delete entry confirmation
  const [deleteEntryDialogOpen, setDeleteEntryDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<EntryWithMedia | null>(
    null
  );
  const [deletingEntry, setDeletingEntry] = useState(false);

  const filteredEntries = useMemo(
    () =>
      selectedCategoryId
        ? entries.filter((e) => e.category_id === selectedCategoryId)
        : [],
    [entries, selectedCategoryId]
  );

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId]
  );

  // --- Category CRUD ---

  function openCreateCategory() {
    setEditingCategory(null);
    setCategoryName("");
    setCategoryIcon("BookOpen");
    setCategoryDialogOpen(true);
  }

  function openEditCategory(cat: Tables<"manual_categories">) {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategoryIcon(cat.icon ?? "BookOpen");
    setCategoryDialogOpen(true);
  }

  async function handleSaveCategory() {
    if (!categoryName.trim()) return;
    setCategorySaving(true);

    if (editingCategory) {
      // Update
      const { data, error } = await supabase
        .from("manual_categories")
        .update({
          name: categoryName.trim(),
          icon: categoryIcon,
        })
        .eq("id", editingCategory.id)
        .select()
        .single();

      if (error) {
        toast({ title: "Error updating category", variant: "destructive" });
      } else if (data) {
        setCategories((prev) =>
          prev.map((c) => (c.id === data.id ? data : c))
        );
        toast({ title: "Category updated" });
      }
    } else {
      // Create
      const nextOrder =
        categories.length > 0
          ? Math.max(...categories.map((c) => c.sort_order)) + 1
          : 0;

      const { data, error } = await supabase
        .from("manual_categories")
        .insert({
          home_id: homeId,
          name: categoryName.trim(),
          icon: categoryIcon,
          sort_order: nextOrder,
        })
        .select()
        .single();

      if (error) {
        toast({ title: "Error creating category", variant: "destructive" });
      } else if (data) {
        setCategories((prev) => [...prev, data]);
        setSelectedCategoryId(data.id);
        toast({ title: "Category created" });
      }
    }

    setCategorySaving(false);
    setCategoryDialogOpen(false);
  }

  function confirmDeleteCategory(cat: Tables<"manual_categories">) {
    setCategoryToDelete(cat);
    setDeleteCategoryDialogOpen(true);
  }

  async function handleDeleteCategory() {
    if (!categoryToDelete) return;
    setDeleting(true);

    const { error } = await supabase
      .from("manual_categories")
      .delete()
      .eq("id", categoryToDelete.id);

    if (error) {
      toast({ title: "Error deleting category", variant: "destructive" });
    } else {
      setCategories((prev) =>
        prev.filter((c) => c.id !== categoryToDelete.id)
      );
      setEntries((prev) =>
        prev.filter((e) => e.category_id !== categoryToDelete.id)
      );
      if (selectedCategoryId === categoryToDelete.id) {
        const remaining = categories.filter(
          (c) => c.id !== categoryToDelete.id
        );
        setSelectedCategoryId(remaining[0]?.id ?? null);
      }
      toast({ title: "Category deleted" });
    }

    setDeleting(false);
    setDeleteCategoryDialogOpen(false);
    setCategoryToDelete(null);
  }

  // --- Entry CRUD ---

  function openCreateEntry() {
    setEditingEntry(null);
    setEntryEditorOpen(true);
  }

  function openEditEntry(entry: EntryWithMedia) {
    setEditingEntry(entry);
    setEntryEditorOpen(true);
  }

  function handleEntrySaved(saved: EntryWithMedia) {
    if (editingEntry) {
      setEntries((prev) => prev.map((e) => (e.id === saved.id ? saved : e)));
    } else {
      setEntries((prev) => [...prev, saved]);
    }
    setEntryEditorOpen(false);
    setEditingEntry(null);
  }

  function confirmDeleteEntry(entry: EntryWithMedia) {
    setEntryToDelete(entry);
    setDeleteEntryDialogOpen(true);
  }

  async function handleDeleteEntry() {
    if (!entryToDelete) return;
    setDeletingEntry(true);

    const { error } = await supabase
      .from("manual_entries")
      .delete()
      .eq("id", entryToDelete.id);

    if (error) {
      toast({ title: "Error deleting entry", variant: "destructive" });
    } else {
      setEntries((prev) => prev.filter((e) => e.id !== entryToDelete.id));
      toast({ title: "Entry deleted" });
    }

    setDeletingEntry(false);
    setDeleteEntryDialogOpen(false);
    setEntryToDelete(null);
  }

  // --- Empty states ---

  if (categories.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BookOpen className="h-12 w-12 text-[var(--muted-foreground)] mb-4" />
          <p className="text-[var(--muted-foreground)] mb-4">
            The house manual is empty — start by adding a category!
          </p>
          {isAdmin && (
            <Button onClick={openCreateCategory}>
              <Plus className="h-4 w-4" />
              Add first category
            </Button>
          )}
        </div>

        {/* Category dialog */}
        <CategoryDialog
          open={categoryDialogOpen}
          onOpenChange={setCategoryDialogOpen}
          editing={editingCategory}
          name={categoryName}
          onNameChange={setCategoryName}
          icon={categoryIcon}
          onIconChange={setCategoryIcon}
          saving={categorySaving}
          onSave={handleSaveCategory}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar — category list */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Categories
            </h2>
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={openCreateCategory}
                className="h-7 px-2"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>

          <ScrollArea className="lg:h-[calc(100vh-240px)]">
            <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors whitespace-nowrap",
                    "hover:bg-[var(--muted)]",
                    selectedCategoryId === cat.id
                      ? "bg-[var(--muted)] font-medium text-[var(--foreground)]"
                      : "text-[var(--muted-foreground)]"
                  )}
                >
                  <CategoryIcon
                    iconName={cat.icon}
                    className="h-4 w-4 shrink-0"
                  />
                  {cat.name}
                </button>
              ))}
            </nav>
          </ScrollArea>
        </aside>

        <Separator orientation="vertical" className="hidden lg:block" />

        {/* Main content area */}
        <div className="flex-1 min-w-0">
          {selectedCategory ? (
            <>
              {/* Category header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-[var(--muted)] p-2.5">
                    <CategoryIcon
                      iconName={selectedCategory.icon}
                      className="h-5 w-5 text-[var(--foreground)]"
                    />
                  </div>
                  <h2 className="text-xl font-semibold">
                    {selectedCategory.name}
                  </h2>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditCategory(selectedCategory)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => confirmDeleteCategory(selectedCategory)}
                    >
                      <Trash2 className="h-4 w-4 text-[var(--destructive)]" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Entries */}
              {filteredEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <BookOpen className="h-12 w-12 text-[var(--muted-foreground)] mb-4" />
                  <p className="text-[var(--muted-foreground)] mb-4">
                    No entries in this category yet.
                  </p>
                  {isAdmin && (
                    <Button variant="outline" onClick={openCreateEntry}>
                      <Plus className="h-4 w-4" />
                      Add entry
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredEntries.map((entry) => (
                    <article
                      key={entry.id}
                      className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold">
                          {entry.title}
                        </h3>
                        {isAdmin && (
                          <div className="flex items-center gap-1 shrink-0 ml-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditEntry(entry)}
                              className="h-8 w-8 p-0"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => confirmDeleteEntry(entry)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-[var(--destructive)]" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Markdown content */}
                      <div className="prose prose-sm max-w-none text-[var(--foreground)] [&_h1]:text-[var(--foreground)] [&_h2]:text-[var(--foreground)] [&_h3]:text-[var(--foreground)] [&_p]:text-[var(--foreground)] [&_li]:text-[var(--foreground)] [&_strong]:text-[var(--foreground)] [&_a]:text-[var(--primary)] [&_code]:bg-[var(--muted)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-[var(--muted)] [&_pre]:p-3 [&_pre]:rounded-md [&_blockquote]:border-l-[var(--border)] [&_blockquote]:text-[var(--muted-foreground)]">
                        <Markdown>{entry.content}</Markdown>
                      </div>

                      {/* Media thumbnails */}
                      {entry.manual_entry_media.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {entry.manual_entry_media
                            .sort((a, b) => a.sort_order - b.sort_order)
                            .map((media) => (
                              <a
                                key={media.id}
                                href={media.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative block overflow-hidden rounded-md border border-[var(--border)] hover:opacity-80 transition-opacity"
                              >
                                {media.media_type === "image" ? (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img
                                    src={media.url}
                                    alt=""
                                    className="h-24 w-24 object-cover"
                                  />
                                ) : (
                                  <video
                                    src={media.url}
                                    className="h-24 w-24 object-cover"
                                    muted
                                  />
                                )}
                              </a>
                            ))}
                        </div>
                      )}
                    </article>
                  ))}

                  {/* Add entry button at the bottom */}
                  {isAdmin && (
                    <Button variant="outline" onClick={openCreateEntry}>
                      <Plus className="h-4 w-4" />
                      Add entry
                    </Button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-[var(--muted-foreground)]">
                Select a category to view its entries.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Category create/edit dialog */}
      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        editing={editingCategory}
        name={categoryName}
        onNameChange={setCategoryName}
        icon={categoryIcon}
        onIconChange={setCategoryIcon}
        saving={categorySaving}
        onSave={handleSaveCategory}
      />

      {/* Category delete confirmation */}
      <Dialog
        open={deleteCategoryDialogOpen}
        onOpenChange={setDeleteCategoryDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{categoryToDelete?.name}
              &quot;? All entries in this category will also be deleted. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteCategoryDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCategory}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Entry editor dialog */}
      <ManualEntryEditor
        open={entryEditorOpen}
        onOpenChange={(open) => {
          setEntryEditorOpen(open);
          if (!open) setEditingEntry(null);
        }}
        homeId={homeId}
        userId={userId}
        categoryId={selectedCategoryId}
        entry={editingEntry}
        entriesCount={filteredEntries.length}
        onSaved={handleEntrySaved}
      />

      {/* Entry delete confirmation */}
      <Dialog
        open={deleteEntryDialogOpen}
        onOpenChange={setDeleteEntryDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{entryToDelete?.title}
              &quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteEntryDialogOpen(false)}
              disabled={deletingEntry}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteEntry}
              disabled={deletingEntry}
            >
              {deletingEntry ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// --- Category dialog sub-component ---

function CategoryDialog({
  open,
  onOpenChange,
  editing,
  name,
  onNameChange,
  icon,
  onIconChange,
  saving,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Tables<"manual_categories"> | null;
  name: string;
  onNameChange: (val: string) => void;
  icon: string;
  onIconChange: (val: string) => void;
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit category" : "New category"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the category name and icon."
              : "Create a new category to organise your house manual."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">Name</Label>
            <Input
              id="category-name"
              placeholder="e.g. Wi-Fi & Internet"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSave();
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((iconName) => {
                const Icon = ICON_MAP[iconName];
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => onIconChange(iconName)}
                    className={cn(
                      "flex items-center justify-center h-9 w-9 rounded-md border transition-colors",
                      icon === iconName
                        ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                        : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                    )}
                    title={iconName}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={saving || !name.trim()}
          >
            {saving ? "Saving..." : editing ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
