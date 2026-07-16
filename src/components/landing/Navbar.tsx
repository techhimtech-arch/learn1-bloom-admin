import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from "lucide-react";
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
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const dashboardRoute = isAuthenticated && user ? getDefaultRoute(user.role) : "/login";

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        isScrolled
          ? "py-2 glass dark:glass-dark shadow-lg shadow-slate-900/5 dark:shadow-slate-900/20 border-b border-white/20 dark:border-slate-700/30"
          : "py-4 bg-transparent border-b border-transparent"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-12">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <VidyoraLogo className="h-8 w-8 transition-transform group-hover:scale-110" />
            <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
              TechHim EduOS
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center">
            <div className="flex items-center bg-slate-100/80 dark:bg-slate-800/50 rounded-full px-1 py-1 mr-4">
              <Link
                to="/features"
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors rounded-full hover:bg-white dark:hover:bg-slate-700"
              >
                Features
              </Link>
              <a
                href="/#pricing"
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors rounded-full hover:bg-white dark:hover:bg-slate-700"
              >
                Pricing
              </a>
              <a
                href="/#testimonials"
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors rounded-full hover:bg-white dark:hover:bg-slate-700"
              >
                Testimonials
              </a>
              <a
                href="/#product"
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors rounded-full hover:bg-white dark:hover:bg-slate-700"
              >
                Product
              </a>
            </div>

            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <Button asChild className="rounded-full shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-primary to-cyan-500 hover:opacity-90">
                  <Link to={dashboardRoute}>Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button variant="ghost" asChild className="font-medium rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                    <Link to="/login">Sign in</Link>
                  </Button>
                  <Button asChild className="rounded-full shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-primary to-cyan-500 hover:opacity-90">
                    <Link to="/register">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-full text-slate-600 hover:text-primary hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 focus:outline-none transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="glass dark:glass-dark border-b border-white/20 dark:border-slate-700/30 px-4 py-6 space-y-2">
          <Link
            to="/features"
            className="block px-4 py-3 rounded-xl text-base font-medium text-slate-700 hover:text-primary hover:bg-white/50 dark:text-slate-300 dark:hover:bg-slate-800/50 transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Features
          </Link>
          <a
            href="/#pricing"
            className="block px-4 py-3 rounded-xl text-base font-medium text-slate-700 hover:text-primary hover:bg-white/50 dark:text-slate-300 dark:hover:bg-slate-800/50 transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Pricing
          </a>
          <a
            href="/#testimonials"
            className="block px-4 py-3 rounded-xl text-base font-medium text-slate-700 hover:text-primary hover:bg-white/50 dark:text-slate-300 dark:hover:bg-slate-800/50 transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Testimonials
          </a>
          <div className="pt-4 flex flex-col gap-3">
            {isAuthenticated ? (
              <Button asChild className="w-full justify-center rounded-xl bg-gradient-to-r from-primary to-cyan-500">
                <Link to={dashboardRoute}>Go to Dashboard</Link>
              </Button>
            ) : (
                <>
                  <Button variant="outline" asChild className="w-full justify-center rounded-xl">
                    <Link to="/login">Sign in</Link>
                  </Button>
                  <Button asChild className="w-full justify-center rounded-xl bg-gradient-to-r from-primary to-cyan-500">
                    <Link to="/register">Get Started</Link>
                  </Button>
                </>
              )}
          </div>
        </div>
      </div>
    </nav>
  );
}
