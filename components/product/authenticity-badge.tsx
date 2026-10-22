import Image from "next/image";
import { cn } from "@/lib/utils";

/** Gold seal + "Authenticity Guarantee", shown on product photos and pages. */
export function AuthenticityBadge({ className, size = "sm" }: { className?: string; size?: "sm" | "md" }) {
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap font-sans font-medium text-[#141210]", size === "md" ? "gap-1.5 text-sm" : "gap-1 text-[0.62rem] sm:text-[0.7rem]", className)}>
      <Image src="/brand/authenticity-seal.png" alt="" width={128} height={127} className={size === "md" ? "h-7 w-7" : "h-4 w-4 sm:h-5 sm:w-5"} />
      Authenticity Guarantee
    </span>
  );
}
