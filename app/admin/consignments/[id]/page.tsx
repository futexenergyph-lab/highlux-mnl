import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { requireStaff } from "@/lib/admin/auth";
import { getAdminRepo } from "@/lib/admin/repo";
import { signedUrl } from "@/lib/media";
import { formatPHP } from "@/lib/utils";
import { Card, PageHeader, fmtDateTime } from "@/components/admin/ui";
import { ConsignmentEditor } from "@/components/admin/consignment-editor";

export const metadata = { title: "Consignment" };

export default async function ConsignmentPage({ params }: { params: { id: string } }) {
  await requireStaff(`/admin/consignments/${params.id}`);
  const c = (await (await getAdminRepo()).listConsignments()).find((x) => x.id === params.id);
  if (!c) notFound();
  const photos = await Promise.all(c.photoPaths.map((p) => signedUrl("consignments", p).catch(() => null)));
  const phone = c.phone.replace(/^0/, "63").replace(/^\+/, "");
  const greeting = `Hi ${c.fullName.split(" ")[0]}! This is HIGHLUX MNL about the ${c.brand} ${c.model} you sent us.`;

  return (
    <>
      <Link href="/admin/consignments" className="text-xs uppercase tracking-wider text-cream-muted hover:text-gold-light">← Consignments</Link>
      <PageHeader title={`${c.brand} · ${c.model}`} description={`Submitted ${fmtDateTime(c.createdAt)} · wants to ${c.wants}`} />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <Card title={`Photos (${photos.length})`}>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {photos.map((u, i) => (
                <li key={i} className="aspect-square overflow-hidden border border-gold/20 bg-ink-50">
                  {u && (
                    <a href={u} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL */}
                      <img src={u} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Details">
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              {[
                ["Category", c.category],
                ["Condition", c.condition ?? "—"],
                ["Inclusions", c.inclusions.join(", ") || "—"],
                ["Year purchased", c.purchaseYear ?? "—"],
                ["Asking price", c.askingPrice ? formatPHP(c.askingPrice) : "—"],
                ["Wants to", c.wants],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-gold/10 py-1.5"><dt className="text-cream-dim">{k}</dt><dd className="text-right text-cream">{v}</dd></div>
              ))}
            </dl>
            {c.notes && <p className="mt-4 text-sm italic text-cream-muted">&ldquo;{c.notes}&rdquo;</p>}
          </Card>
        </div>
        <div className="space-y-5">
          <Card title="Status & notes"><ConsignmentEditor id={c.id} status={c.status} notes={c.adminNotes ?? ""} /></Card>
          <Card title="Seller">
            <p className="text-sm text-cream">{c.fullName}{c.city && <span className="text-cream-dim"> · {c.city}</span>}</p>
            <div className="mt-3 space-y-2 text-sm">
              <a href={`mailto:${c.email}?subject=${encodeURIComponent(`Your ${c.brand} ${c.model} — HIGHLUX MNL`)}`} className="flex items-center gap-2 text-cream-muted hover:text-gold-light"><Mail className="h-4 w-4" /> {c.email}</a>
              <a href={`tel:${c.phone}`} className="flex items-center gap-2 text-cream-muted hover:text-gold-light"><Phone className="h-4 w-4" /> {c.phone}</a>
              <a href={`https://wa.me/${phone}?text=${encodeURIComponent(greeting)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-cream-muted hover:text-gold-light"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
              <a href={`viber://chat?number=%2B${phone}`} className="flex items-center gap-2 text-cream-muted hover:text-gold-light"><MessageCircle className="h-4 w-4" /> Viber</a>
            </div>
          </Card>
          <Link href={`/admin/products/new`} className="block text-xs uppercase tracking-wider text-gold-light hover:underline">Accepted? Create the product listing →</Link>
        </div>
      </div>
    </>
  );
}
