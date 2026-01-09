import { useLocation } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { MobileBottomBar } from "@/components/MobileBottomBar";

interface PageLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout wrapper that conditionally renders Footer and MobileBottomBar
 * Footer is ONLY displayed on Home, Category, Contact, and About pages
 * MobileBottomBar is ALWAYS displayed on mobile screens across all pages
 */
export const PageLayout = ({ children }: PageLayoutProps) => {
  const location = useLocation();
  const pathname = location.pathname;

  // Pages where footer should be visible
  const shouldShowFooter = 
    pathname === "/" || // Home page
    pathname === "/contact" || // Contact page
    pathname === "/about" || // About page
    pathname.startsWith("/category/"); // Category pages

  // Pages where MobileBottomBar should be hidden
  const shouldHideMobileBar = 
    pathname === "/host-verification";

  return (
    <div className="w-full min-h-screen flex flex-col">
      <div className="flex-1 w-full pb-20 md:pb-0">
        {children}
      </div>
      {shouldShowFooter && <Footer />}
      {/* MobileBottomBar is always visible on mobile - except specific pages */}
      {!shouldHideMobileBar && <MobileBottomBar />}
    </div>
  );
};
