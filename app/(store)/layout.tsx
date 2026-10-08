import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MessengerButton } from "@/components/layout/messenger-button";
import { CartProvider } from "@/components/cart/cart-provider";
import { WishlistProvider } from "@/components/wishlist/wishlist-provider";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <WishlistProvider>
      <AnnouncementBar />
      <Header />
      <main>{children}</main>
      <Footer />
      <MessengerButton />
      </WishlistProvider>
    </CartProvider>
  );
}
