"use client";

import { scorePasswordStrength } from "@/lib/passwordStrength";

const COLORS = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-emerald-500"];
const TEXT_COLORS = ["text-red-600", "text-orange-600", "text-yellow-600", "text-green-600", "text-emerald-600"];

export default function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const { score, label, feedback } = scorePasswordStrength(password);

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= score ? COLORS[score] : "bg-gray-200"}`} />
        ))}
      </div>
      <p className={`mt-1 text-xs font-medium ${TEXT_COLORS[score]}`}>{label}</p>
      {feedback.length > 0 && (
        <ul className="mt-1 space-y-0.5">
          {feedback.map((f) => (
            <li key={f} className="text-[11px] text-gray-500">• {f}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
