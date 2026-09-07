"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, Plus, Clock } from "lucide-react";
import { Food } from "@/types";
import { Rating } from "@/components/ui/Rating";
import { Badge } from "@/components/ui/Badge";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { useCatalog } from "@/context/CatalogContext";
import { formatCurrency, cn } from "@/lib/utils";

export function FoodCard({ food, className }: { food: Food; className?: string }) {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { categories } = useCatalog();
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageErrored, setImageErrored] = useState(false);
  const category = categories.find((c) => c.id === food.categoryId);

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!food.isAvailable) return;
    addToCart(food.id, 1);
    showToast(`${food.name} added to cart`, "success");
  }

  function toggleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite((v) => !v);
  }

  return (
    <Link
      href={`/menu/${food.id}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl bg-white shadow-card transition-shadow duration-200 hover:shadow-lift",
        className
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink-100">
        <Image
          src={
            imageErrored || !food.image
              ? "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80&auto=format&fit=crop"
              : food.image
          }
          alt={food.name}
          fill
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setImageErrored(true)}
        />
        {!food.isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink-950/55">
            <Badge variant="neutral" className="bg-cream-50 text-ink-800">Sold out</Badge>
          </div>
        )}
        <button
          onClick={toggleFavorite}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={isFavorite}
          className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-cream-50/90 text-ink-700 shadow-sm backdrop-blur transition-colors hover:text-error-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ember-400"
        >
          <Heart className={cn("h-4 w-4", isFavorite && "fill-error-500 text-error-500")} />
        </button>
        {category && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-cream-50/90 px-2.5 py-1 text-[11px] font-medium text-ink-700 backdrop-blur">
            {category.name}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-base font-semibold leading-snug text-ink-900">
            {food.name}
          </h3>
          <Rating value={food.rating} />
        </div>
        <p className="line-clamp-2 text-sm leading-relaxed text-ink-500">{food.description}</p>

        <div className="mt-auto flex items-center justify-between pt-3">
          <div>
            <p className="font-display text-lg font-semibold text-ink-900">
              {formatCurrency(food.price)}
            </p>
            <p className="flex items-center gap-1 text-xs text-ink-400">
              <Clock className="h-3 w-3" /> {food.prepTimeMinutes} min
            </p>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={!food.isAvailable}
            aria-label={`Add ${food.name} to cart`}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-ember-500 text-cream-50 transition-colors hover:bg-ember-600 disabled:cursor-not-allowed disabled:bg-ink-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-600"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </Link>
  );
}
