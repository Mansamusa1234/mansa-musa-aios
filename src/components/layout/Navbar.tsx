"use client";

import { signOut } from "next-auth/react";
import Image from "next/image";
import { motion } from "framer-motion";

interface Props {
  user: { name?: string | null; email?: string | null; image?: string | null };
}

export default function Navbar({ user }: Props) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex items-center justify-end border-b border-gray-100 bg-white px-6 py-3"
    >
      <div className="flex items-center gap-3">
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name ?? "User"}
            width={32}
            height={32}
            className="rounded-full ring-2 ring-brand-100"
          />
        ) : (
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 cursor-default"
          >
            {user.name?.[0]?.toUpperCase() ?? "U"}
          </motion.div>
        )}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => signOut({ callbackUrl: "/" })}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:border-gray-300 hover:text-gray-800 transition-colors"
        >
          Sign out
        </motion.button>
      </div>
    </motion.header>
  );
}
