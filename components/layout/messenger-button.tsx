import { MessageCircle } from "lucide-react";
import { contactLinks } from "@/lib/site";

/** Floating Messenger shortcut (mobile-first: most traffic arrives from Facebook). */
export function MessengerButton() {
  return (
    <a
      href={contactLinks.messenger("Hi HIGHLUX MNL! I'd like to inquire.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on Messenger"
      className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gold-gradient text-ink shadow-gold-glow transition-transform duration-300 hover:scale-110"
    >
      <MessageCircle className="h-6 w-6" strokeWidth={1.5} />
    </a>
  );
}
