"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * A slim top progress bar that animates during page navigations.
 * Inspired by NProgress but zero-dependency and theme-matched.
 */
export function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    setProgress(15);
    setVisible(true);
    // Incrementally crawl toward 90%
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        const increment = prev < 50 ? 8 : prev < 80 ? 3 : 0.5;
        return Math.min(prev + increment, 90);
      });
    }, 200);
  }, []);

  const done = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(100);
    setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 300);
  }, []);

  // Track route changes
  useEffect(() => {
    done();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  // Intercept clicks on <a> tags for navigation
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement)?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (
        href &&
        href.startsWith("/") &&
        !anchor.hasAttribute("download") &&
        anchor.target !== "_blank"
      ) {
        start();
      }
    }
    document.addEventListener("click", handleClick, { capture: true });
    return () =>
      document.removeEventListener("click", handleClick, { capture: true });
  }, [start]);

  if (!visible && progress === 0) return null;

  return (
    <div
      role="progressbar"
      aria-valuenow={progress}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        height: 3,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${progress}%`,
          background: "linear-gradient(90deg, var(--gold, #c99a4a), var(--primary, #5b3f2a))",
          borderRadius: "0 2px 2px 0",
          transition: progress === 100 ? "width 200ms ease, opacity 300ms ease" : "width 400ms ease",
          opacity: visible ? 1 : 0,
          boxShadow: "0 0 8px rgba(201,154,74,0.5)",
        }}
      />
    </div>
  );
}
