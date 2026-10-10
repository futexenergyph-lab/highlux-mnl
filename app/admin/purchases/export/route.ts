import { assertStaff } from "@/lib/admin/auth";
import { getAdminRepo } from "@/lib/admin/repo";
import { purchaseRows, purchasesCsv } from "@/lib/admin/purchases";

export const dynamic = "force-dynamic";

/** Spreadsheet (CSV) of the purchase records, honouring the page's filters. */
export async function GET(req: Request) {
  try {
    await assertStaff();
  } catch {
    return new Response("Forbidden", { status: 403 });
  }
  const sp = new URL(req.url).searchParams;
  const orders = await (await getAdminRepo()).listOrders();
  const rows = purchaseRows(orders, { from: sp.get("from") ?? undefined, to: sp.get("to") ?? undefined, q: sp.get("q") ?? undefined });
  const stamp = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
  return new Response(purchasesCsv(rows), {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="highlux-purchase-records-${stamp}.csv"`, "cache-control": "no-store" },
  });
}
