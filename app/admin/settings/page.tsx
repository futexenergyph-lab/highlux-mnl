import { requireStaff } from "@/lib/admin/auth";
import { getCheckoutSettings, onlinePaymentsMode } from "@/lib/checkout/settings";
import { PageHeader } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const staff = await requireStaff("/admin/settings");
  const s = await getCheckoutSettings();
  return (
    <>
      <PageHeader title="Checkout settings" description="Shipping, payment methods, holds, layaway and bank accounts. Changes apply to new checkouts immediately." />
      <SettingsForm settings={s} paymongo={onlinePaymentsMode()} canEdit={staff.role === "admin"} />
    </>
  );
}
