"use client";
import { useCountUp } from "@/hooks/useCountUp";

interface Props {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
  decimals?: number;
}

export default function CountUp({ value, prefix = "", suffix = "", duration, className, decimals = 0 }: Props) {
  const { count, ref } = useCountUp(value, duration);
  const display = decimals > 0 ? count.toFixed(decimals) : count.toLocaleString();
  return (
    <span ref={ref as React.RefObject<HTMLSpanElement>} className={className}>
      {prefix}{display}{suffix}
    </span>
  );
}
