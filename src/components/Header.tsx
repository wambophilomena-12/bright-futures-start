import { useState, useEffect } from "react";
import { Menu, Heart, Ticket, Shield, Home, FolderOpen, User, Search, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NavigationDrawer } from "./NavigationDrawer";
import { Link, useNavigate, useLocation } from "react-router-dom"; // <-- Added useLocation
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./NotificationBell";

interface HeaderProps {
  onSearchClick?: () => void;
  showSearchIcon?: boolean;
}

export const Header = ({ onSearchClick, showSearchIcon = true }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation(); // <-- Get current path
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { user, signOut } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // 1. New state for scroll detection
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Check if we are on the index page ('/')
  const isIndexPage = location.pathname === '/';

  // 2. useEffect for scroll listener (Only on index page)
  useEffect(() => {
    if (!isIndexPage) {
      setIsScrolled(true); // Default to colored header if not index page
      return;
    }

    const handleScroll = () => {
      // Set scroll status based on a small threshold (e.g., 50px)
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    
    // Initial check on mount
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isIndexPage]);

  // Determine the mobile header background color
  const mobileBgClass = (isIndexPage && !isScrolled)
    ? "bg-transparent border-b-transparent" // Transparent on top of index page
    : "bg-[#008080] border-b-[#008080]";    // Teal when scrolled or on other pages

  // Determine the dynamic text/icon color for mobile (default to white/light)
  const mobileContentColor = (isIndexPage && !isScrolled)
    ? "text-white"
    : "text-white"; // Keep white for teal background

  /* --- Omitted Supabase/User Role/Name logic for brevity but assume it remains the same --- */
  useEffect(() => { /* ... existing checkRole logic ... */ }, [user]);
  useEffect(() => { /* ... existing fetchUserProfile logic ... */ }, [user]);
  const getUserInitials = () => { /* ... existing logic ... */ return "U"; };

  const [userName, setUserName] = useState<string>("");
  useEffect(() => {
    // A placeholder for the actual user data fetching
    if (user) setUserName(user.email || "User"); else setUserName("");
  }, [user]);

  return (
    // 3. Dynamic header class list for small screens and fixed for medium/large screens
    <header className={`sticky top-0 z-50 w-full border-b border-border h-16 transition-colors duration-300
                       md:bg-[#008080] md:border-b-[#008080] md:text-white dark:md:bg-[#008080] dark:md:text-white
                       ${mobileBgClass} ${mobileContentColor}`}>
      <div className="container flex h-full items-center justify-between px-4">
        
        {/* Logo and Drawer Trigger (Left Side) */}
        <div className="flex items-center gap-3">
          <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <SheetTrigger asChild>
              {/* Menu icon always has a background color for visibility on transparent header */}
              <button 
                className={`inline-flex items-center justify-center h-10 w-10 rounded-md transition-colors 
                           bg-black/20 hover:bg-black/40 text-white`} 
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 h-screen">
              <NavigationDrawer onClose={() => setIsDrawerOpen(false)} />
            </SheetContent>
          </Sheet>
          
          {/* Logo and Name - HIDDEN on small screens, SHOWN on medium/large screens */}
          <Link to="/" className="hidden md:flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-[#0066cc] font-bold text-lg">
              T
            </div>
            <div>
              <span className="font-bold text-base md:text-lg text-white block">
                TripTrac
              </span>
              <p className="text-xs text-white/90 block">Your journey starts now.</p>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation (Centered) - No Change */}
        <nav className="hidden lg:flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 font-bold hover:text-muted-foreground transition-colors">
            <Home className="h-4 w-4" />
            <span>Home</span>
          </Link>
          <Link to="/bookings" className="flex items-center gap-2 font-bold hover:text-muted-foreground transition-colors">
            <Ticket className="h-4 w-4" />
            <span>My Bookings</span>
          </Link>
          <Link to="/saved" className="flex items-center gap-2 font-bold hover:text-muted-foreground transition-colors">
            <Heart className="h-4 w-4" />
            <span>Wishlist</span>
          </Link>
          <button 
            onClick={() => user ? navigate('/become-host') : navigate('/auth')} 
            className="flex items-center gap-2 font-bold hover:text-muted-foreground transition-colors"
          >
            <FolderOpen className="h-4 w-4" />
            <span>Become a Host</span>
          </button>
        </nav>

        {/* Account Controls (Right Side) */}
        <div className="flex items-center gap-2">
          
          {/* Search Bar - Replaced with a placeholder div to represent the search bar area on small screens */}
          <div className="md:hidden flex-grow max-w-xs px-2">
              <div 
                  onClick={() => {
                    if (onSearchClick) { onSearchClick(); } 
                    else { navigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
                  }}
                  // Search bar: background color rgba darker color for visibility
                  className="w-full h-10 flex items-center rounded-full bg-black/20 text-white pl-4 pr-2 cursor-pointer"
              >
                  <Search className="h-4 w-4 mr-2" />
                  <span className="text-sm font-light opacity-80">Search destinations...</span>
              </div>
          </div>
          
          {/* Notification Bell - Mobile & Desktop */}
          {/* Notification Bell background color rgba darker color for visibility on transparent header */}
          <div className="md:hidden"> 
            <NotificationBell 
                iconClassName="text-white" 
                buttonClassName="rounded-full h-10 w-10 flex items-center justify-center transition-colors bg-black/20 hover:bg-black/40" 
            />
          </div>

          {/* Desktop Auth Actions (Right Side) - Notification, Theme, Account */}
          <div className="hidden md:flex items-center gap-2">
            <NotificationBell />
            <ThemeToggle />
            
            {/* Account Button - No Change for desktop */}
            <button 
              onClick={() => user ? navigate('/account') : navigate('/auth')}
              className="rounded-full h-10 w-10 flex items-center justify-center transition-colors 
                        bg-white/10 hover:bg-white group"
              aria-label="Account"
            >
              <User className="h-5 w-5 text-white group-hover:text-[#008080]" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};