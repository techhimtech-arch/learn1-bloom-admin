import { Twitter, Linkedin, Facebook, Github, Mail, MapPin, Phone, ArrowUp } from "lucide-react";
import { Link } from "react-router-dom";
import { VidyoraLogo } from "@/components/ui/VidyoraLogo";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export function Footer() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 overflow-hidden">
      {/* Decorative top border gradient */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 md:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <VidyoraLogo className="h-10 w-10" />
              <span className="font-bold text-2xl tracking-tight text-white">
                TechHim EduOS
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed mb-6 max-w-md">
              Modernizing education management. A complete platform to manage your school, students, teachers, and parents in one unified ecosystem.
            </p>

            {/* Contact Info */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 text-slate-400 hover:text-primary transition-colors">
                <Mail className="w-4 h-4" />
                <a href="mailto:hello@techhim.com" className="text-sm">hello@techhim.com</a>
              </div>
              <div className="flex items-center gap-3 text-slate-400 hover:text-primary transition-colors">
                <Phone className="w-4 h-4" />
                <a href="tel:+1234567890" className="text-sm">+1 (234) 567-890</a>
              </div>
              <div className="flex items-center gap-3 text-slate-400 hover:text-primary transition-colors">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">San Francisco, CA</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-3">
              {[
                { icon: Twitter, href: "#", label: "Twitter" },
                { icon: Linkedin, href: "#", label: "LinkedIn" },
                { icon: Facebook, href: "#", label: "Facebook" },
                { icon: Github, href: "#", label: "GitHub" },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  className="w-10 h-10 rounded-xl bg-slate-800/50 hover:bg-primary/20 flex items-center justify-center text-slate-400 hover:text-primary transition-all border border-slate-700/50 hover:border-primary/30"
                  aria-label={label}
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Product Column */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6">Product</h3>
            <ul className="space-y-4">
              {[
                { label: "Features", to: "/features" },
                { label: "Pricing", to: "/#pricing" },
                { label: "Get Started", to: "/register" },
                { label: "Changelog", to: "#" },
                { label: "Roadmap", to: "#" },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="text-slate-400 hover:text-white transition-colors text-sm inline-flex items-center gap-1 group"
                  >
                    {label}
                    <span className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6">Resources</h3>
            <ul className="space-y-4">
              {[
                { label: "Documentation", to: "#" },
                { label: "Help Center", to: "#" },
                { label: "Blog", to: "#" },
                { label: "Community", to: "#" },
                { label: "API Reference", to: "#" },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="text-slate-400 hover:text-white transition-colors text-sm inline-flex items-center gap-1 group"
                  >
                    {label}
                    <span className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6">Legal</h3>
            <ul className="space-y-4">
              {[
                { label: "Privacy Policy", to: "#" },
                { label: "Terms of Service", to: "#" },
                { label: "Cookie Policy", to: "#" },
                { label: "Security", to: "#" },
                { label: "GDPR", to: "#" },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="text-slate-400 hover:text-white transition-colors text-sm inline-flex items-center gap-1 group"
                  >
                    {label}
                    <span className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="mt-16 pt-12 border-t border-slate-800">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left">
              <h3 className="text-white font-semibold text-xl mb-2">Stay up to date</h3>
              <p className="text-slate-400 text-sm">Get the latest updates and news about TechHim EduOS.</p>
            </div>
            <div className="flex gap-3 w-full max-w-md">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 h-12 px-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
              />
              <Button className="h-12 px-6 rounded-xl bg-gradient-to-r from-primary to-cyan-500 hover:opacity-90">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm text-center md:text-left">
            © {new Date().getFullYear()} TechHim EduOS. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-slate-400 text-sm">All systems operational</span>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center transition-all duration-300 hover:scale-110 ${
          showScrollTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
        aria-label="Scroll to top"
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </footer>
  );
}
