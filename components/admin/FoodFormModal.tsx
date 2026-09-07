"use client";

import { useEffect, useState } from "react";
import { Food, Category } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { ImageUploadField } from "@/components/ui/ImageUploadField";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

interface FoodFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Food, "id" | "rating" | "reviewCount">) => Promise<void>;
  categories: Category[];
  initialFood?: Food | null;
}

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  categoryId: "",
  ingredients: "",
  prepTimeMinutes: "",
  image: "",
  isAvailable: true,
  isPopular: false,
  isFeatured: false,
};

export function FoodFormModal({ isOpen, onClose, onSubmit, categories, initialFood }: FoodFormModalProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (initialFood) {
      setForm({
        name: initialFood.name,
        description: initialFood.description,
        price: String(initialFood.price),
        categoryId: initialFood.categoryId,
        ingredients: initialFood.ingredients.join(", "),
        prepTimeMinutes: String(initialFood.prepTimeMinutes),
        image: initialFood.image,
        isAvailable: initialFood.isAvailable,
        isPopular: initialFood.isPopular ?? false,
        isFeatured: initialFood.isFeatured ?? false,
      });
    } else {
      setForm({ ...EMPTY_FORM, categoryId: categories[0]?.id ?? "" });
    }
    setErrors({});
    setSubmitError(null);
  }, [initialFood, isOpen, categories]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Food name is required";
    if (!form.description.trim()) next.description = "Description is required";
    if (!form.price || Number(form.price) <= 0) next.price = "Enter a valid price";
    if (!form.categoryId) next.categoryId = "Select a category";
    if (!form.prepTimeMinutes || Number(form.prepTimeMinutes) <= 0)
      next.prepTimeMinutes = "Enter prep time in minutes";
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
        price: Number(form.price),
        categoryId: form.categoryId,
        ingredients: form.ingredients
          .split(",")
          .map((i) => i.trim())
          .filter(Boolean),
        prepTimeMinutes: Number(form.prepTimeMinutes),
        image:
          form.image.trim() ||
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80&auto=format&fit=crop",
        isAvailable: form.isAvailable,
        isPopular: form.isPopular,
        isFeatured: form.isFeatured,
      });
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialFood ? "Edit Food" : "Add New Food"} maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Food name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={errors.name}
          placeholder="e.g. Smoky Beef Burger"
        />
        <Textarea
          label="Description"
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          error={errors.description}
          placeholder="Short, appetizing description shown to customers"
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Price (৳)"
            type="number"
            min={0}
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            error={errors.price}
          />
          <Input
            label="Prep time (minutes)"
            type="number"
            min={0}
            value={form.prepTimeMinutes}
            onChange={(e) => setForm({ ...form, prepTimeMinutes: e.target.value })}
            error={errors.prepTimeMinutes}
          />
        </div>
        <Select
          label="Category"
          value={form.categoryId}
          onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          error={errors.categoryId}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Input
          label="Ingredients"
          hint="Comma-separated, e.g. Beef patty, Cheddar, Pickles"
          value={form.ingredients}
          onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
        />
        <ImageUploadField
          label="Food photo"
          value={form.image}
          onChange={(url) => setForm({ ...form, image: url })}
          hint="Leave blank to use a placeholder image"
        />
        <label className="flex items-center gap-2.5 text-sm text-ink-700">
          <input
            type="checkbox"
            checked={form.isAvailable}
            onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
            className="h-4 w-4 rounded border-ink-300 text-ember-500 focus:ring-ember-400"
          />
          Available for ordering
        </label>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <label className="flex items-center gap-2.5 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={form.isPopular}
              onChange={(e) => setForm({ ...form, isPopular: e.target.checked })}
              className="h-4 w-4 rounded border-ink-300 text-ember-500 focus:ring-ember-400"
            />
            Show in &quot;Popular Dishes&quot;
          </label>
          <label className="flex items-center gap-2.5 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
              className="h-4 w-4 rounded border-ink-300 text-ember-500 focus:ring-ember-400"
            />
            Feature on homepage
          </label>
        </div>

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
            {isSaving ? "Saving…" : initialFood ? "Save Changes" : "Add Food"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
