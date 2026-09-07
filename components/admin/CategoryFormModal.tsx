"use client";

import { useEffect, useState } from "react";
import { Category } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { ImageUploadField } from "@/components/ui/ImageUploadField";
import { Button } from "@/components/ui/Button";

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Category, "id">) => Promise<void>;
  initialCategory?: Category | null;
}

const EMPTY_FORM = { name: "", description: "", image: "", isActive: true };

export function CategoryFormModal({ isOpen, onClose, onSubmit, initialCategory }: CategoryFormModalProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCategory) {
      setForm({
        name: initialCategory.name,
        description: initialCategory.description,
        image: initialCategory.image,
        isActive: initialCategory.isActive,
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
    setSubmitError(null);
  }, [initialCategory, isOpen]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Category name is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setIsSaving(true);
    setSubmitError(null);
    try {
      await onSubmit({
        name: form.name.trim(),
        slug: form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description: form.description.trim(),
        image:
          form.image.trim() ||
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80&auto=format&fit=crop",
        isActive: form.isActive,
      });
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialCategory ? "Edit Category" : "Add Category"} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Category name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={errors.name}
          placeholder="e.g. Burgers"
        />
        <Input
          label="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Short tagline shown on the category card"
        />
        <ImageUploadField
          label="Category photo"
          value={form.image}
          onChange={(url) => setForm({ ...form, image: url })}
          hint="Leave blank to use a placeholder image"
        />
        <label className="flex items-center gap-2.5 text-sm text-ink-700">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            className="h-4 w-4 rounded border-ink-300 text-ember-500 focus:ring-ember-400"
          />
          Visible to customers
        </label>

        {submitError && (
          <p role="alert" className="rounded-lg bg-error-50 px-3.5 py-2.5 text-sm text-error-600">
            {submitError}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" fullWidth onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" fullWidth disabled={isSaving}>
            {isSaving ? "Saving…" : initialCategory ? "Save Changes" : "Add Category"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
