import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { requireStaff } from "@/lib/admin/auth";
import { getAdminRepo } from "@/lib/admin/repo";
import { getMemberDetails } from "@/lib/members";
import { signedUrl } from "@/lib/media";
import { formatPHP } from "@/lib/utils";
import { Card, PageHeader, fmtDate } from "@/components/admin/ui";

export const metadata = { title: "Member details" };
export const dynamic = "force-dynamic";

export default async function MemberPage({ params }: { params: { id: string } }) {
  await requireStaff(`/admin/customers/${params.id}`);
  const [m, customers] = await Promise.all([getMemberDetails(params.id), (await getAdminRepo()).listCustomers()]);
  const c = customers.find((x) => x.id === params.id);
  if (!m && !c) notFound();
  const idUrl = m?.idFilePath ? await signedUrl("member-ids", m.idFilePath).catch(() => null) : null;
  const isPdf = m?.idFilePath?.toLowerCase().endsWith(".pdf");
  const rows: [string, string][] = m
    ? [
        ["Full name (as on ID)", m.fullName],
        ["Date of birth", new Date(`${m.dateOfBirth}T12:00:00+08:00`).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })],
        ["Nationality", m.nationality],
        ["Current address", m.address],
        ["Mobile number", m.phone],
        ["Email", c?.email ?? "—"],
        ["Occupation / business", m.occupation],
        ["ID type", m.idType],
        ["ID number", m.idNumber],
        ["Agreed to terms", fmtDate(m.termsAcceptedAt)],
        ["Data privacy consent", fmtDate(m.consentAt)],
      ]
    : [];

  return (
    <>
      <Link href="/admin/customers" className="mb-4 inline-flex items-center gap-1 text-xs uppercase tracking-wider text-cream-muted hover:text-gold-light"><ArrowLeft className="h-3.5 w-3.5" /> Customers</Link>
      <PageHeader title={m?.fullName ?? c?.name ?? c?.email ?? "Member"} description={c ? `${c.email} · ${c.orders} order${c.orders === 1 ? "" : "s"} · ${formatPHP(c.spent)} paid` : undefined} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card title="Registration details">
          {m ? (
            <dl className="divide-y divide-gold/10 text-sm">
              {rows.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[9rem_minmax(0,1fr)] gap-3 py-2.5">
                  <dt className="text-cream-dim">{k}</dt>
                  <dd className="break-words text-cream">{v}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-cream-muted">This person signed up before the registration form, so there are no ID details on file.</p>
          )}
        </Card>
        <Card title="Front of ID" actions={idUrl ? <a href={idUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs uppercase tracking-wider text-gold-light">Open <ExternalLink className="h-3.5 w-3.5" /></a> : undefined}>
          {!idUrl ? (
            <p className="text-sm text-cream-muted">No ID uploaded.</p>
          ) : isPdf ? (
            <a href={idUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-gold-light underline">Open the ID (PDF)</a>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL
            <img src={idUrl} alt={`ID of ${m?.fullName}`} className="w-full border border-gold/15" />
          )}
          <p className="mt-3 text-xs text-cream-dim">Private — visible to staff only. The link expires after 10 minutes.</p>
        </Card>
      </div>
    </>
  );
}
