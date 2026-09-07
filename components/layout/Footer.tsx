import Link from "next/link";
import { ChefHat, Facebook, Instagram, Twitter, MapPin, Phone, Mail, Clock } from "lucide-react";
import { defaultRestaurantSettings } from "@/data/restaurant";

export function Footer() {
  const settings = defaultRestaurantSettings;

  return (
    <footer className="border-t border-ink-800 bg-ink-950 text-cream-100">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ember-500 text-ink-950">
                <ChefHat className="h-5 w-5" />
              </span>
              <span className="font-display text-xl font-semibold text-cream-50">DineFlow</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-300">
              Modern ordering for a restaurant that cares about every plate. Fresh food,
              simple checkout, real-time tracking.
            </p>
            <div className="mt-5 flex gap-3">
              {[Facebook, Instagram, Twitter].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label="Social media link"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-700 text-ink-300 transition-colors hover:border-ember-500 hover:text-ember-400"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-cream-50">
              Navigate
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-ink-300">
              <li><Link href="/" className="hover:text-ember-400">Home</Link></li>
              <li><Link href="/menu" className="hover:text-ember-400">Menu</Link></li>
              <li><Link href="/about" className="hover:text-ember-400">About</Link></li>
              <li><Link href="/contact" className="hover:text-ember-400">Contact</Link></li>
              <li><Link href="/my-orders" className="hover:text-ember-400">My Orders</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-cream-50">
              Contact
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-ink-300">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ember-400" />
                {settings.address}
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-ember-400" />
                {settings.phone}
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-ember-400" />
                {settings.email}
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-cream-50">
              Opening Hours
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-ink-300">
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0 text-ember-400" />
                Mon – Thu: 10:00 AM – 10:00 PM
              </li>
              <li className="pl-6">Fri: 2:00 PM – 11:00 PM</li>
              <li className="pl-6">Sat – Sun: 10:00 AM – 11:00 PM</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-ink-800 pt-6 text-xs text-ink-400 sm:flex-row">
          <p>© {new Date().getFullYear()} DineFlow. All rights reserved.</p>
          <p>A portfolio project — frontend prototype with mock data.</p>
        </div>
      </div>
    </footer>
  );
}
