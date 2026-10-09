import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const MAX_SIDE = 2000;
/** Logo width as a share of the photo's width (capped by height for wide shots). */
const WIDTH_SHARE = 0.7;
const HEIGHT_SHARE = 0.55;

let logo: Promise<Buffer> | null = null;
const loadLogo = () => (logo ??= readFile(path.join(process.cwd(), "lib/watermark/highlux-watermark.png")));

/**
 * Stamps the HIGHLUX MNL logo (semi-transparent silver) across the centre of a
 * product photo so it can't be reposted cleanly. Also fixes phone rotation,
 * caps the long side at 2000px and re-encodes as JPEG.
 */
export async function watermarkImage(input: ArrayBuffer): Promise<Buffer> {
  const { data, info } = await sharp(Buffer.from(input))
    .rotate()
    .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true })
    .toBuffer({ resolveWithObject: true });
  const mark = await sharp(await loadLogo())
    .resize({
      width: Math.max(1, Math.round(info.width * WIDTH_SHARE)),
      height: Math.max(1, Math.round(info.height * HEIGHT_SHARE)),
      fit: "inside",
    })
    .toBuffer();
  return sharp(data)
    .composite([{ input: mark, gravity: "center" }])
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 86, mozjpeg: true })
    .toBuffer();
}
