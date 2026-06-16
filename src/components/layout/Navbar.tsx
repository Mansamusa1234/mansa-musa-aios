"use client";

import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

interface Props {
  user: { name?: string | null; email?: string | null; image?: string | null; role?: string };
}

export default function Navbar({ user }: Props) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex items-center justify-between border-b border-white/6 bg-[#09091a]/90 backdrop-blur-xl px-4 sm:px-6 py-3 flex-shrink-0"
    >
      {/* Breadcrumb / Page title slot */}
      <div className="flex items-center gap-2 md:hidden">
        <span className="text-sm font-bold text-white">
          Mansa<span className="text-brand-400">Musa</span>AI
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Live status badge */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-400" />
          </span>
          <span className="text-[11px] font-semibold text-green-400">All systems live</span>
        </div>

        {/* New Chat quick action */}
        <Link
          href="/chat"
          className="hidden sm:flex items-center gap-1.5 rounded-lg border border-brand-500/30 bg-brand-500/10 px-3 py-1.5 text-xs font-semibold text-brand-300 hover:bg-brand-500/20 transition-colors"
        >
          <span>+</span> New Chat
        </Link>

        {/* Avatar */}
        {user.image ? (
          <Image src={user.image} alt={user.name ?? "User"} width={32} height={32} className="rounded-full ring-2 ring-brand-500/30" />
        ) : (
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/20 text-sm font-bold text-brand-300 border border-brand-500/30 cursor-default"
          >
            {user.name?.[0]?.toUpperCase() ?? "U"}
          </motion.div>
        )}

        {/* Sign out */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => signOut({ callbackUrl: "/" })}
          className="rounded-lg border border-white/8 px-3 py-1.5 text-xs font-medium text-gray-500 hover:border-white/15 hover:text-gray-300 transition-colors"
        >
          Sign out
        </motion.button>
      </div>
    </motion.header>
  );
}
