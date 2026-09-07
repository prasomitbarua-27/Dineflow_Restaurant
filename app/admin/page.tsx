"use client";

import { useEffect, useState } from "react";
import { Save, KeyRound } from "lucide-react";
import { defaultRestaurantSettings } from "@/data/restaurant";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/context/ToastContext";
import { RestaurantSettings } from "@/types";

export default function AdminSettingsPage() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<RestaurantSettings>(defaultRestaurantSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Password change is a separate form/state entirely — deliberately not
  // part of `settings`, since it has its own validation, its own submit
  // handler, and shouldn't be cleared or resubmitted just because the
  // restaurant-info form saves.
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setSettings(data);
      })
      .catch(() => {
        showToast("Couldn't load settings — showing defaults", "error");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateHours(day: string, field: "isOpen" | "open" | "close", value: string | boolean) {
    setSettings((prev) => ({
      ...prev,
      openingHours: prev.openingHours.map((h) => (h.day === day ? { ...h, [field]: value } : h)),
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to save settings");
      }
      const updated = await res.json();
      setSettings(updated);
      showToast("Settings saved", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't save settings", "error");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (passwordForm.newPassword.length < 6) {
      showToast("New password must be at least 6 characters", "error");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast("New passwords don't match", "error");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/account/change-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to change password");
      }
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      showToast("Password changed", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't change password", "error");
    } finally {
      setIsChangingPassword(false);
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl space-y-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <form onSubmit={handleSave} className="space-y-6">
        {/* Restaurant information */}
        <section className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold text-ink-900">Restaurant Information</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Restaurant name"
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
            />
            <Input
              label="Phone"
              value={settings.phone}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
            />
            <Input
              label="Address"
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
            />
          </div>
        </section>

        {/* Opening hours */}
        <section className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold text-ink-900">Opening Hours</h2>
          <div className="mt-4 space-y-2.5">
            {settings.openingHours.map((h) => (
              <div key={h.day} className="flex flex-wrap items-center gap-3 rounded-xl border border-ink-100 p-3">
                <span className="w-24 shrink-0 text-sm font-medium text-ink-800">{h.day}</span>
                <label className="flex items-center gap-2 text-sm text-ink-600">
                  <input
                    type="checkbox"
                    checked={h.isOpen}
                    onChange={(e) => updateHours(h.day, "isOpen", e.target.checked)}
                    className="h-4 w-4 rounded border-ink-300 text-ember-500 focus:ring-ember-400"
                  />
                  Open
                </label>
                {h.isOpen ? (
                  <div className="flex flex-1 flex-wrap items-center gap-2">
                    <input
                      type="time"
                      value={h.open}
                      onChange={(e) => updateHours(h.day, "open", e.target.value)}
                      className="h-9 rounded-lg border border-ink-200 px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ember-400/50"
                      aria-label={`${h.day} opening time`}
                    />
                    <span className="text-sm text-ink-400">to</span>
                    <input
                      type="time"
                      value={h.close}
                      onChange={(e) => updateHours(h.day, "close", e.target.value)}
                      className="h-9 rounded-lg border border-ink-200 px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ember-400/50"
                      aria-label={`${h.day} closing time`}
                    />
                  </div>
                ) : (
                  <span className="text-sm text-ink-400">Closed</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Preferences */}
        <section className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold text-ink-900">Restaurant Preferences</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Select
              label="Currency"
              value={settings.currency}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
            >
              <option value="BDT">BDT (৳)</option>
              <option value="USD">USD ($)</option>
            </Select>
            <Input
              label="Delivery fee (৳)"
              type="number"
              min={0}
              value={settings.deliveryFee}
              onChange={(e) => setSettings({ ...settings, deliveryFee: Number(e.target.value) })}
            />
            <Input
              label="Minimum order (৳)"
              type="number"
              min={0}
              value={settings.minimumOrder}
              onChange={(e) => setSettings({ ...settings, minimumOrder: Number(e.target.value) })}
            />
          </div>
        </section>

        <Button type="submit" disabled={isSaving}>
          <Save className="h-4 w-4" /> {isSaving ? "Saving…" : "Save Settings"}
        </Button>
      </form>

      {/* Change password — a separate form/action from restaurant settings above */}
      <form onSubmit={handleChangePassword} className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
          <KeyRound className="h-5 w-5 text-ember-500" /> Change Password
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          If you&apos;re still using the default password from initial setup, change it now.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label="Current password"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            required
          />
          <Input
            label="New password"
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            required
          />
          <Input
            label="Confirm new password"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            required
          />
        </div>
        <Button type="submit" variant="outline" className="mt-4" disabled={isChangingPassword}>
          {isChangingPassword ? "Changing…" : "Change Password"}
        </Button>
      </form>
    </div>
  );
}
