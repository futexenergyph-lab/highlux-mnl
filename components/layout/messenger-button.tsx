"use client";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { contactLinks } from "@/lib/site";
import { cn } from "@/lib/utils";

const PRODUCT_PATH = /^\/(bags|watches|jewelry|accessories)\/[^/]+$/;
// Pages with their own bottom-of-screen actions on mobile.
const CROWDED_PATH = /^\/(checkout|cart)(\/|$)/;

/** Floating Messenger shortcut (mobile-first: most traffic arrives from Facebook). */
export function MessengerButton() {
  // On product pages the mobile sticky buy bar carries its own Messenger button; checkout needs the room.
  const path = usePathname();
  const onProduct = PRODUCT_PATH.test(path) || CROWDED_PATH.test(path);
  return (
    <a
      href={contactLinks.messenger("Hi HIGHLUX MNL! I'd like to inquire.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on Messenger"
      className={cn(
        "fixed bottom-5 right-5 z-30 h-14 w-14 items-center justify-center rounded-full bg-gold-gradient text-ink shadow-gold-glow transition-transform duration-300 hover:scale-110",
        onProduct ? "hidden lg:flex" : "flex",
      )}
    >
      <MessageCircle className="h-6 w-6" strokeWidth={1.5} />
    </a>
  );
}
