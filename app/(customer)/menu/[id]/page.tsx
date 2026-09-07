"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { Minus, Plus, Heart, Clock, ChevronLeft, ShoppingBag } from "lucide-react";
import { useCatalog } from "@/context/CatalogContext";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { Rating } from "@/components/ui/Rating";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FoodCard } from "@/components/customer/FoodCard";
import { formatCurrency, clamp } from "@/lib/utils";

export default function FoodDetailsPage({ params }: { params: { id: string } }) {
  const { foods, categories, isLoading } = useCatalog();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  const food = foods.find((f) => f.id === params.id || f.slug === params.id);

  // Don't 404 while the catalog is still loading — only once loading has
  // finished and the food genuinely isn't in the list.
  if (!food) {
    if (isLoading) {
      return (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            <div className="aspect-square w-full animate-pulse rounded-2xl bg-ink-100" />
            <div className="space-y-4">
              <div className="h-8 w-2/3 animate-pulse rounded-lg bg-ink-100" />
              <div className="h-4 w-full animate-pulse rounded-lg bg-ink-100" />
              <div className="h-4 w-3/4 animate-pulse rounded-lg bg-ink-100" />
            </div>
          </div>
        </div>
      );
    }
    notFound();
  }

  const category = categories.find((c) => c.id === food.categoryId);
  const related = foods.filter((f) => f.categoryId === food.categoryId && f.id !== food.id).slice(0, 4);

  function handleAddToCart() {
    if (!food) return;
    if (!food.isAvailable) return;
    addToCart(food.id, quantity);
    showToast(`${quantity} × ${food.name} added to cart`, "success");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900"
      >
        <ChevronLeft className="h-4 w-4" /> Back
      </button>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-ink-100 shadow-card">
          <Image src={food.image} alt={food.name} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" priority />
          {!food.isAvailable && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink-950/55">
              <Badge className="bg-cream-50 text-ink-800">Currently sold out</Badge>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              {category && (
                <Link href={`/menu?category=${category.slug}`} className="text-sm font-medium text-ember-600 hover:underline">
                  {category.name}
                </Link>
              )}
              <h1 className="mt-1 font-display text-3xl font-semibold text-ink-900 sm:text-4xl">{food.name}</h1>
            </div>
            <button
              onClick={() => setIsFavorite((v) => !v)}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              aria-pressed={isFavorite}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ink-200 text-ink-600 hover:text-error-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ember-400"
            >
              <Heart className={isFavorite ? "h-5 w-5 fill-error-500 text-error-500" : "h-5 w-5"} />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-4">
            <Rating value={food.rating} reviewCount={food.reviewCount} size="md" />
            <span className="flex items-center gap-1.5 text-sm text-ink-500">
              <Clock className="h-4 w-4" /> {food.prepTimeMinutes} min prep time
            </span>
          </div>

          <p className="mt-5 text-base leading-relaxed text-ink-600">{food.description}</p>

          <div className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">Ingredients</h2>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {food.ingredients.map((ingredient) => (
                <span key={ingredient} className="rounded-full bg-ink-100 px-3 py-1 text-sm text-ink-700">
                  {ingredient}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
            <div>
              <p className="text-xs text-ink-400">Price</p>
              <p className="font-display text-2xl font-semibold text-ink-900">{formatCurrency(food.price)}</p>
            </div>
            <div className="flex items-center rounded-full border border-ink-200">
              <button
                onClick={() => setQuantity((q) => clamp(q - 1, 1, 20))}
                aria-label="Decrease quantity"
                className="flex h-11 w-11 items-center justify-center rounded-full text-ink-600 hover:bg-ink-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ember-400"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center text-base font-semibold text-ink-900" aria-live="polite">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => clamp(q + 1, 1, 20))}
                aria-label="Increase quantity"
                className="flex h-11 w-11 items-center justify-center rounded-full text-ink-600 hover:bg-ink-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ember-400"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <Button
            fullWidth
            size="lg"
            className="mt-4"
            onClick={handleAddToCart}
            disabled={!food.isAvailable}
          >
            <ShoppingBag className="h-5 w-5" />
            {food.isAvailable
              ? `Add to Cart · ${formatCurrency(food.price * quantity)}`
              : "Currently unavailable"}
          </Button>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="mb-6 font-display text-2xl font-semibold text-ink-900">You might also like</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((f) => (
              <FoodCard key={f.id} food={f} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
