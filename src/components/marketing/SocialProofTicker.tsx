"use client";

import { useEffect, useRef, useState } from "react";

const EVENTS = [
  { flag: "🇬🇧", location: "London, UK",        action: "just signed up for Pro",          time: "2m ago"  },
  { flag: "🇺🇸", location: "New York, USA",      action: "deployed an AI Receptionist",     time: "5m ago"  },
  { flag: "🇳🇬", location: "Lagos, Nigeria",     action: "started a free trial",            time: "7m ago"  },
  { flag: "🇦🇪", location: "Dubai, UAE",         action: "upgraded to Enterprise",          time: "9m ago"  },
  { flag: "🇨🇦", location: "Toronto, Canada",    action: "just signed up for Starter",      time: "11m ago" },
  { flag: "🇩🇪", location: "Berlin, Germany",    action: "ran their first AI competition",  time: "14m ago" },
  { flag: "🇿🇦", location: "Cape Town, SA",      action: "deployed a Sales Agent",          time: "17m ago" },
  { flag: "🇦🇺", location: "Sydney, Australia",  action: "started a free trial",            time: "21m ago" },
  { flag: "🇸🇬", location: "Singapore",          action: "upgraded to Pro",                 time: "23m ago" },
  { flag: "🇬🇭", location: "Accra, Ghana",       action: "just signed up for Pro",          time: "26m ago" },
  { flag: "🇫🇷", location: "Paris, France",      action: "deployed an AI Support Agent",    time: "28m ago" },
  { flag: "🇮🇳", location: "Mumbai, India",      action: "started a free trial",            time: "31m ago" },
  { flag: "🇧🇷", location: "São Paulo, Brazil",  action: "signed up for Starter",           time: "34m ago" },
  { flag: "🇯🇵", location: "Tokyo, Japan",       action: "ran an AI Wisdom Arena session",  time: "38m ago" },
  { flag: "🇰🇪", location: "Nairobi, Kenya",     action: "upgraded to Enterprise",          time: "41m ago" },
];

export default function SocialProofTicker() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % EVENTS.length);
        setVisible(true);
      }, 400);
    }, 4000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const event = EVENTS[index];

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-xs">
      <div
        className={`flex items-start gap-3 rounded-xl border border-white/10 bg-gray-950/95 backdrop-blur p-3 shadow-xl transition-all duration-400 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        <span className="text-2xl flex-shrink-0 mt-0.5">{event.flag}</span>
        <div>
          <p className="text-xs text-gray-300 leading-snug">
            <span className="font-semibold text-white">{event.location}</span>{" "}
            {event.action}
          </p>
          <p className="text-xs text-gray-600 mt-0.5">{event.time}</p>
        </div>
      </div>
    </div>
  );
}
