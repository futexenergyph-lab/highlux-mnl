"use client";
import * as React from "react";
import { Check, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { btnOutline } from "./ui";

/** Copies a shop link (e.g. https://highluxmnl.com/bags/…) for pasting to customers. */
export function CopyLinkButton({ path, variant = "button", className }: { path: string; variant?: "button" | "icon"; className?: string }) {
  const [copied, setCopied] = React.useState(false);
  const copy = async () => {
    const url = window.location.origin + path;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Older browsers: fall back to a hidden textarea.
      const ta = Object.assign(document.createElement("textarea"), { value: url });
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const Icon = copied ? Check : Link2;

  if (variant === "icon")
    return (
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Link copied" : "Copy link"}
        title={copied ? "Link copied" : "Copy link"}
        className={cn("inline-flex h-7 w-7 items-center justify-center border border-gold/40 align-middle text-gold-light transition hover:border-gold", copied && "border-gold bg-gold/10", className)}
      >
        <Icon className="h-3.5 w-3.5" />
      </button>
    );

  return (
    <button type="button" onClick={copy} className={cn(btnOutline, className)}>
      <Icon className="h-4 w-4" /> {copied ? "Link copied" : "Copy link"}
    </button>
  );
}
