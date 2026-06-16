"use client";

import { useState, useEffect } from "react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function PushNotificationToggle() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setSupported(true);
    navigator.serviceWorker.register("/sw.js").then(async (registration) => {
      const sub = await registration.pushManager.getSubscription();
      setSubscribed(!!sub);
    });
  }, []);

  async function subscribe() {
    setLoading(true);
    setError("");
    try {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        setError("Push notifications aren't configured yet.");
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("Notification permission was denied.");
        return;
      }
      const registration = await navigator.serviceWorker.register("/sw.js");
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      setSubscribed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to subscribe.");
    } finally {
      setLoading(false);
    }
  }

  async function unsubscribe() {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } finally {
      setLoading(false);
    }
  }

  if (!supported) return null;

  return (
    <div className="rounded-xl border border-white/8 bg-white/3 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">🔔 Push notifications</p>
          <p className="mt-0.5 text-xs text-gray-500">
            {subscribed ? "You'll get notified about important updates." : "Get notified about important updates."}
          </p>
        </div>
        <button
          onClick={subscribed ? unsubscribe : subscribe}
          disabled={loading}
          className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
            subscribed ? "border border-white/8 bg-white/4 text-gray-300 hover:bg-white/8" : "bg-brand-500 text-white hover:bg-brand-600"
          }`}
        >
          {loading ? "…" : subscribed ? "Disable" : "Enable"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
