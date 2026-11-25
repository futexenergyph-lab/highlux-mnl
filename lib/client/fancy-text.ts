/** "HIGHLUX" → "𝗛𝗜𝗚𝗛𝗟𝗨𝗫": Unicode bold letters that stay bold when pasted into Facebook, Viber or Messenger. */
export function boldText(s: string) {
  return [...s]
    .map((ch) => {
      const c = ch.codePointAt(0)!;
      if (c >= 65 && c <= 90) return String.fromCodePoint(0x1d5d4 + c - 65);
      if (c >= 97 && c <= 122) return String.fromCodePoint(0x1d5ee + c - 97);
      if (c >= 48 && c <= 57) return String.fromCodePoint(0x1d7ec + c - 48);
      return ch;
    })
    .join("");
}
