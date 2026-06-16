import { Twitter, Linkedin, Facebook, Github } from "lucide-react";
import { Link } from "react-router-dom";
import { VidyoraLogo } from "@/components/ui/VidyoraLogo";

export function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <VidyoraLogo className="h-8 w-8" />
              <span className="font-bold text-xl tracking-tight text-white">
                Vidyora OS
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-xs">
              Modernizing education management. A complete platform to manage your school, students, teachers, and parents in one place.
            </p>
            <div className="flex gap-4 text-slate-400">
              <a href="#" className="hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                <Linkedin className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              <li><Link to="/features" className="text-slate-400 hover:text-white transition-colors text-sm">Features</Link></li>
              <li><a href="/#pricing" className="text-slate-400 hover:text-white transition-colors text-sm">Pricing</a></li>
              <li><Link to="/register" className="text-slate-400 hover:text-white transition-colors text-sm">Get Started</Link></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Changelog</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Documentation</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Help Center</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Blog</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Community</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Privacy Policy</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Terms of Service</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Cookie Policy</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Contact Us</a></li>
            </ul>
          </div>

        </div>
        
        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm text-center md:text-left">
            &copy; {new Date().getFullYear()} Vidyora OS. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            <span className="text-slate-400 text-sm">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
