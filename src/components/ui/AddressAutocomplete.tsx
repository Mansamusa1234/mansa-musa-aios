"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface AddressResult {
  formatted: string;
  line1: string;
  city: string;
  postcode: string;
  country: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (address: AddressResult) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  id?: string;
}

declare global {
  interface Window {
    google?: {
      maps: {
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            options?: object
          ) => {
            addListener: (event: string, callback: () => void) => void;
            getPlace: () => {
              formatted_address?: string;
              address_components?: Array<{
                long_name: string;
                short_name: string;
                types: string[];
              }>;
            };
          };
        };
      };
    };
    initGoogleMaps?: () => void;
  }
}

let googleLoaded = false;
let googleLoading = false;
const callbacks: Array<() => void> = [];

function loadGoogleMaps(apiKey: string, cb: () => void) {
  if (googleLoaded) { cb(); return; }
  callbacks.push(cb);
  if (googleLoading) return;
  googleLoading = true;
  window.initGoogleMaps = () => {
    googleLoaded = true;
    callbacks.forEach((fn) => fn());
    callbacks.length = 0;
  };
  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Start typing your address…",
  className = "",
  label,
  id = "address-autocomplete",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const initAutocomplete = useCallback(() => {
    if (!inputRef.current || !window.google?.maps?.places) return;
    const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ["address"],
      componentRestrictions: { country: ["gb"] },
    });
    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (!place.address_components) return;

      const get = (type: string) =>
        place.address_components?.find((c) => c.types.includes(type))?.long_name ?? "";

      const streetNumber = get("street_number");
      const route = get("route");
      const line1 = [streetNumber, route].filter(Boolean).join(" ");
      const city = get("postal_town") || get("locality") || get("administrative_area_level_2");
      const postcode = get("postal_code");
      const country = get("country");
      const formatted = place.formatted_address ?? "";

      onChange(formatted);
      onSelect?.({ formatted, line1, city, postcode, country });
    });
    setReady(true);
  }, [onChange, onSelect]);

  useEffect(() => {
    if (!apiKey) { setReady(true); return; }
    loadGoogleMaps(apiKey, initAutocomplete);
  }, [apiKey, initAutocomplete]);

  const base =
    "w-full rounded-xl border bg-white dark:bg-white/5 px-4 py-3 text-sm " +
    "text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 " +
    "outline-none transition-colors focus:ring-2 focus:border-brand-500 focus:ring-brand-500/20 " +
    "border-gray-200 dark:border-white/10";

  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          autoComplete={apiKey ? "off" : "street-address"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${base} ${className}`}
        />
        {!ready && apiKey && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg className="h-4 w-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}
        {ready && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </div>
        )}
      </div>
      {!apiKey && (
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          Add <code className="font-mono">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to Vercel to enable address autocomplete.
        </p>
      )}
    </div>
  );
}
