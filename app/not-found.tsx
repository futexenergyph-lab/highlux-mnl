import Link from "next/link";
import StoreLayout from "./(store)/layout";

export default function NotFound() {
  return (
    <StoreLayout>
      <section className="container flex min-h-[50vh] flex-col items-center justify-center py-24 text-center">
        <p className="eyebrow text-gold">404</p>
        <h1 className="mt-3 font-serif text-4xl text-cream">This piece has found a new home.</h1>
        <p className="mt-3 max-w-md text-sm text-cream-muted">The page you&rsquo;re looking for doesn&rsquo;t exist yet.</p>
        <Link href="/" className="btn-gold mt-8">Back to home</Link>
      </section>
    </StoreLayout>
  );
}
