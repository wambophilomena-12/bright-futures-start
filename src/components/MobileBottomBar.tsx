import { Home, Ticket, Heart, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export const MobileBottomBar = () => {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Ticket, label: "Bookings", path: "/bookings" },
    { icon: Heart, label: "Wishlist", path: "/saved" },
    { icon: User, label: "Account", path: user ? "/account" : "/auth" },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 **bg-white** border-t **border-gray-200**">
      <nav className="flex items-center justify-around h-16 px-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              // Removed py-2 px-4 and rounded-lg to simplify the appearance, as typically seen in bottom bars.
              className={cn(
                "flex flex-col items-center gap-1 transition-all duration-200 h-full justify-center w-full",
                isActive
                  ? "**text-[#008080]**" // Active: Teal
                  : "**text-gray-500**"  // Inactive: Gray
                // Hover effect classes were removed entirely
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "scale-110")} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};