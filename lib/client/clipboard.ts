"use client";

/** Copy text, falling back to a hidden textarea on browsers without the Clipboard API. */
export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = Object.assign(document.createElement("textarea"), { value: text });
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

/** "<description>\n\nSee details here: <link>" (or just the link line when there's no description). */
export function captionWithLink(path: string, description?: string | null) {
  const link = `See details here: ${window.location.origin}${path}`;
  const body = description?.trim();
  return body ? `${body}\n\n${link}` : link;
}
