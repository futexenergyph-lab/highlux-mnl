import { requireStaff } from "@/lib/admin/auth";
import { getAdminRepo } from "@/lib/admin/repo";
import { getHomeContent } from "@/lib/data";
import { PageHeader } from "@/components/admin/ui";
import { HomeEditor } from "@/components/admin/home-editor";

export const metadata = { title: "Homepage" };

export default async function HomepageAdmin() {
  await requireStaff("/admin/homepage");
  const [content, products] = await Promise.all([getHomeContent(), (await getAdminRepo()).listProducts()]);
  return (
    <>
      <PageHeader title="Homepage" description="Hero image and text, and the pieces shown under Curated Picks." />
      <HomeEditor
        content={content}
        products={products.filter((p) => p.status !== "hidden").map((p) => ({ id: p.id, title: p.title, brand: p.brand, image: p.images[0]?.url ?? null, status: p.status, featured: p.featured }))}
      />
    </>
  );
}
