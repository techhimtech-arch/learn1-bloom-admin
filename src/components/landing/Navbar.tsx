import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { VidyoraLogo } from "@/components/ui/VidyoraLogo";
import { useState, useEffect } from "react";
import { getDefaultRoute } from "@/lib/role-config";

export function Navbar() {
  const { isAuthenticated, user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const dashboardRoute = isAuthenticated && user ? getDefaultRoute(user.role) : "/login";

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 border-b ${
        isScrolled
          ? "bg-white/80 dark:bg-slate-950/80 backdrop-blur-md shadow-sm border-slate-200 dark:border-slate-800"
          : "bg-transparent border-transparent"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <VidyoraLogo className="h-8 w-8" />
            <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
              Vidyora OS
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/features" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors dark:text-slate-300 dark:hover:text-primary">
              Features
            </Link>
            <a href="/#pricing" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors dark:text-slate-300 dark:hover:text-primary">
              Pricing
            </a>
            <a href="#testimonials" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors dark:text-slate-300 dark:hover:text-primary">
              Testimonials
            </a>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <Button asChild className="rounded-full shadow-lg hover:shadow-xl transition-all">
                <Link to={dashboardRoute}>Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild className="font-medium">
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button asChild className="rounded-full shadow-lg hover:shadow-xl transition-all">
                  <Link to="/register">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-600 hover:text-primary focus:outline-none dark:text-slate-300"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shadow-lg">
          <div className="px-4 pt-2 pb-6 space-y-4">
            <Link
              to="/features"
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-primary hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Features
            </Link>
            <a
              href="/#pricing"
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-primary hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Pricing
            </a>
            <div className="pt-4 flex flex-col gap-3">
              {isAuthenticated ? (
                <Button asChild className="w-full justify-center rounded-full">
                  <Link to={dashboardRoute}>Go to Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button variant="outline" asChild className="w-full justify-center rounded-full">
                    <Link to="/login">Sign in</Link>
                  </Button>
                  <Button asChild className="w-full justify-center rounded-full">
                    <Link to="/register">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
