"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function PageLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  const startLoading = useCallback(() => {
    setLoading(true);
    setVisible(true);
    setProgress(0);
  }, []);

  const stopLoading = useCallback(() => {
    setProgress(100);
    setTimeout(() => {
      setLoading(false);
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300);
    }, 200);
  }, []);

  // Animate progress while loading
  useEffect(() => {
    if (!loading) return;
    let frame: number;
    const animate = () => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        // Slow down as we approach 90%
        const increment = Math.max(0.5, (90 - prev) * 0.03);
        return Math.min(prev + increment, 90);
      });
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [loading]);

  // Detect route changes
  useEffect(() => {
    stopLoading();
  }, [pathname, searchParams, stopLoading]);

  // Intercept link clicks to show loader
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Only handle internal links
      if (
        href.startsWith("/") ||
        href.startsWith(window.location.origin)
      ) {
        // Don't trigger for same-page links or hash links
        const url = new URL(href, window.location.origin);
        if (
          url.pathname !== pathname ||
          url.search !== window.location.search
        ) {
          startLoading();
        }
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname, startLoading]);

  if (!visible) return null;

  return (
    <div className="page-loader-container" aria-hidden="true">
      <div
        className="page-loader-bar"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
