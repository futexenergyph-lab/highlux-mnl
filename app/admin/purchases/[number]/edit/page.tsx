import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/admin/auth";
import { getOrderRepo } from "@/lib/orders/repo";
import { withListingCapital } from "@/lib/admin/service";
import { PURCHASED, manualMode, MANUAL_MODES, MANUAL_MODE_LABELS } from "@/lib/admin/purchases";
import { PageHeader } from "@/components/admin/ui";
import { ManualPurchaseForm } from "../../new/manual-form";

export const metadata = { title: "Edit purchase" };
export const dynamic = "force-dynamic";

export default async function EditPurchasePage({ params }: { params: { number: string } }) {
  await requireStaff(`/admin/purchases/${params.number}/edit`);
  const found = await (await getOrderRepo()).getOrder(decodeURIComponent(params.number));
  const order = found && (await withListingCapital([found]))[0];
  if (!order || !(PURCHASED as readonly string[]).includes(order.status)) notFound();
  const label = manualMode(order.notes);
  const mode = label ? (MANUAL_MODES.find((m) => MANUAL_MODE_LABELS[m] === label) ?? "cash") : null;
  const a = order.shippingAddress;
  return (
    <>
      <PageHeader title={`Edit ${order.orderNumber}`} description={mode ? "Manual sale — change the buyer, payment, amount, capital or proof." : "Website order — change the buyer details or capital."} />
      <ManualPurchaseForm
        initial={{
          orderNumber: order.orderNumber,
          name: order.fullName,
          address: a ? [a.line1, a.barangay, a.city, a.province, a.zip].filter(Boolean).join(", ") : "",
          phone: order.phone,
          mode,
          amount: order.total,
          capital: order.capital ?? null,
          item: { label: order.items.map((i) => i.title).join(" + "), image: order.items[0]?.imageUrl ?? null, price: order.items.reduce((s, i) => s + i.price, 0) },
          hasProof: order.payments.some((p) => !!p.proofPath),
        }}
      />
    </>
  );
}
