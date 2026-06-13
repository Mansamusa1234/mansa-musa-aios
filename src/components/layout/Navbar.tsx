"use client";

import { signOut } from "next-auth/react";
import Image from "next/image";

interface Props {
  user: { name?: string | null; email?: string | null; image?: string | null };
}

export default function Navbar({ user }: Props) {
  return (
    <header className="flex items-center justify-end border-b border-gray-100 bg-white px-6 py-3">
      <div className="flex items-center gap-3">
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name ?? "User"}
            width={32}
            height={32}
            className="rounded-full"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
            {user.name?.[0]?.toUpperCase() ?? "U"}
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
