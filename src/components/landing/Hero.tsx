import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getDefaultRoute } from "@/lib/role-config";

export function Hero() {
  const { isAuthenticated, user } = useAuth();
  const dashboardRoute = isAuthenticated && user ? getDefaultRoute(user.role) : "/register";

  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-white to-white dark:from-indigo-950/40 dark:via-slate-950 dark:to-slate-950"></div>
      <div className="absolute top-0 right-0 -z-10 w-[800px] h-[600px] bg-primary/5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 -z-10 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-primary bg-primary/10 ring-1 ring-inset ring-primary/20 mb-4">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
            Welcome to the Vidyora Ecosystem
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            One Platform for <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
              Students, Parents & Teachers
            </span>
          </h1>
          
          <p className="mt-6 text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Discover <span className="font-semibold text-slate-900 dark:text-white">Vidyora OS</span> — The intelligent ecosystem to manage admissions, attendance, exams, and seamless communication.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" asChild className="h-14 px-8 rounded-full shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all text-lg w-full sm:w-auto">
              <Link to={dashboardRoute}>
                {isAuthenticated ? "Go to Dashboard" : "Start for Free"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-14 px-8 rounded-full bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm text-lg w-full sm:w-auto hover:bg-slate-50 dark:hover:bg-slate-800">
              <Link to="/features">Explore Features</Link>
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-10 text-sm font-medium text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>

        {/* Dashboard Preview Image/Mockup */}
        <div className="mt-20 mx-auto max-w-6xl relative animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200 fill-mode-both">
          <div className="rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-white/40 dark:bg-slate-900/40 p-2 backdrop-blur-xl shadow-2xl">
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 aspect-video relative flex items-center justify-center">
               <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-950"></div>
               <div className="relative text-center space-y-4 p-8">
                  <div className="w-20 h-20 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                     <span className="text-4xl">📊</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Interactive Dashboard</h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">Real-time insights and analytics for your entire institution in one beautiful view.</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
