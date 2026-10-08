import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MessengerButton } from "@/components/layout/messenger-button";
import { CartProvider } from "@/components/cart/cart-provider";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <AnnouncementBar />
      <Header />
      <main>{children}</main>
      <Footer />
      <MessengerButton />
    </CartProvider>
  );
}
