"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface Props {
  phrases: string[];
  typingMs?: number;
  deletingMs?: number;
  pauseMs?: number;
  className?: string;
  cursorClassName?: string;
}

export default function TypeWriter({
  phrases,
  typingMs = 75,
  deletingMs = 38,
  pauseMs = 2200,
  className = "",
  cursorClassName = "",
}: Props) {
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<"typing" | "pausing" | "deleting">("typing");
  const idxRef = useRef(0);

  useEffect(() => {
    const phrase = phrases[idxRef.current];

    if (phase === "typing") {
      if (text.length < phrase.length) {
        const t = setTimeout(() => setText(phrase.slice(0, text.length + 1)), typingMs);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase("deleting"), pauseMs);
      return () => clearTimeout(t);
    }

    if (phase === "deleting") {
      if (text.length > 0) {
        const t = setTimeout(() => setText((s) => s.slice(0, -1)), deletingMs);
        return () => clearTimeout(t);
      }
      idxRef.current = (idxRef.current + 1) % phrases.length;
      setPhase("typing");
    }
  }, [text, phase, phrases, typingMs, deletingMs, pauseMs]);

  return (
    <span className={className}>
      {text}
      <motion.span
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.75, repeat: Infinity, ease: "linear" }}
        className={`inline-block w-[2px] h-[0.85em] bg-current align-middle ml-0.5 rounded-full ${cursorClassName}`}
      />
    </span>
  );
}
