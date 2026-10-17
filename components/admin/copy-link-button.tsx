"use client";
import * as React from "react";
import { Check, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { btnOutline } from "./ui";
import { captionWithLink, copyText } from "@/lib/client/clipboard";

/** Copies "See details here: <shop link>" (e.g. https://highluxmnl.com/bags/…) for pasting to customers. */
/** With `text`, copies that text, a blank line, then the link line (for pasting a full caption). */
export function CopyLinkButton({ path, variant = "button", className, text: before, label = "Copy link" }: { path: string; variant?: "button" | "icon" | "small"; className?: string; text?: string; label?: string }) {
  const [copied, setCopied] = React.useState(false);
  const copy = async () => {
    await copyText(captionWithLink(path, before));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const Icon = copied ? Check : Link2;

  if (variant === "small")
    return (
      <button type="button" onClick={copy} className={cn("inline-flex items-center gap-1.5 border border-gold/40 px-2 py-1 font-sans text-[0.6rem] uppercase tracking-wider text-gold-light transition hover:border-gold", copied && "border-gold bg-gold/10", className)}>
        <Icon className="h-3.5 w-3.5" /> {copied ? "Copied" : label}
      </button>
    );

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
      <Icon className="h-4 w-4" /> {copied ? "Copied" : label}
    </button>
  );
}
