
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Users, GraduationCap, BookOpen, TrendingUp, Calendar, Award, Play } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getDefaultRoute } from "@/lib/role-config";
import { useAnimatedCounter, useMousePosition } from "@/hooks/useAnimations";
import { useState, useEffect, useRef } from "react";

// Animated background particles
function ParticleField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-primary/20"
          style={{
            width: `${Math.random() * 4 + 2}px`,
            height: `${Math.random() * 4 + 2}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `particle-float ${Math.random() * 15 + 10}s linear infinite`,
            animationDelay: `${Math.random() * 10}s`,
          }}
        />
      ))}
    </div>
  );
}

// Animated gradient orbs
function GradientOrbs() {
  return (
    <>
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-primary/30 via-cyan-500/20 to-transparent rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-cyan-500/25 via-primary/15 to-transparent rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-primary/10 via-cyan-500/10 to-primary/10 rounded-full blur-3xl animate-aurora opacity-60" />
    </>
  );
}

// Animated statistics counter
function StatCounter({ value, suffix = "", label, icon: Icon }: { value: number; suffix?: string; label: string; icon?: React.ComponentType<{ className?: string }> }) {
  const { count, ref } = useAnimatedCounter(value, 2500);

  return (
    <div ref={ref} className="flex flex-col items-center text-center group">
      <div className="relative mb-3">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/30 transition-colors" />
        <div className="relative w-14 h-14 rounded-full glass dark:glass-dark flex items-center justify-center group-hover:scale-110 transition-transform">
          {Icon && <Icon className="w-6 h-6 text-primary" />}
        </div>
      </div>
      <div className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-1">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  );
}

// Floating dashboard card
function FloatingCard({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <div
      className={`absolute ${className}`}
      style={{
        animation: `float 6s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// Interactive dashboard preview with mouse follow
function DashboardPreview() {
  const mousePosition = useMousePosition();
  const containerRef = useRef<HTMLDivElement>(null);
  const [relativePosition, setRelativePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setRelativePosition({
      x: (mousePosition.x - rect.left - rect.width / 2) / 50,
      y: (mousePosition.y - rect.top - rect.height / 2) / 50,
    });
  }, [mousePosition]);

  return (
    <div
      ref={containerRef}
      className="relative rounded-2xl overflow-hidden shadow-2xl animated-border"
      style={{
        transform: `perspective(1000px) rotateX(${-relativePosition.y}deg) rotateY(${relativePosition.x}deg)`,
        transition: 'transform 0.2s ease-out',
      }}
    >
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        {/* Mock browser header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex-1 bg-slate-700/50 rounded-lg h-6 mx-2 flex items-center px-3">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
            <div className="text-xs text-slate-400">app.techhim.com/dashboard</div>
          </div>
        </div>

        {/* Dashboard content */}
        <div className="grid grid-cols-12 gap-3">
          {/* Sidebar */}
          <div className="col-span-2 space-y-2">
            {['Dashboard', 'Students', 'Teachers', 'Attendance', 'Exams', 'Fees'].map((item, i) => (
              <div
                key={item}
                className={`text-xs p-2 rounded-lg ${i === 0 ? 'bg-primary/20 text-primary' : 'text-slate-400 hover:bg-slate-700/30'} transition-colors cursor-pointer`}
              >
                {item}
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="col-span-10 space-y-3">
            {/* Stats row */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Total Students', value: '2,847', change: '+12%' },
                { label: 'Attendance', value: '94.2%', change: '+2.3%' },
                { label: 'Avg. Score', value: '85.6', change: '+4.1%' },
                { label: 'Fee Collection', value: '$45.2K', change: '+8%' },
              ].map((stat) => (
                <div key={stat.label} className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                  <div className="text-[10px] text-slate-400 mb-1">{stat.label}</div>
                  <div className="text-lg font-bold text-white">{stat.value}</div>
                  <div className="text-[10px] text-green-400">{stat.change}</div>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                <div className="text-xs text-slate-400 mb-2">Attendance Overview</div>
                <div className="flex items-end gap-1 h-24">
                  {[65, 78, 82, 88, 71, 95, 89, 92, 85, 79, 94, 87].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-primary to-cyan-500 rounded-t"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                <div className="text-xs text-slate-400 mb-2">Grade Distribution</div>
                <div className="relative w-full aspect-square bg-gradient-to-br from-primary via-cyan-500 to-emerald-500 rounded-lg opacity-80" />
              </div>
            </div>

            {/* Recent activity */}
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
              <div className="text-xs text-slate-400 mb-2">Recent Activity</div>
              <div className="space-y-2">
                {[
                  'New student enrolled: Sarah Johnson',
                  'Exam results published - Grade 10A',
                  'Fee payment received: $450',
                ].map((activity, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    {activity}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  const { isAuthenticated, user } = useAuth();
  const dashboardRoute = isAuthenticated && user ? getDefaultRoute(user.role) : "/register";
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10 mesh-gradient dark:mesh-gradient-dark" />
      <GradientOrbs />
      <ParticleField />
      <div className="absolute inset-0 -z-5 noise-overlay" />

      {/* Floating cards - decorative elements */}
      <FloatingCard delay={0} className="hidden lg:block left-[8%] top-[25%] w-64 opacity-80">
        <div className="glass dark:glass-dark rounded-xl p-4 shadow-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Attendance Marked</div>
              <div className="text-xs text-slate-500">Grade 10A - 94% present</div>
            </div>
          </div>

          <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full w-[94%] bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" />
          </div>
        </div>
      </FloatingCard>

      <FloatingCard delay={2} className="hidden lg:block right-[10%] top-[35%] w-72 opacity-80">
        <div className="glass dark:glass-dark rounded-xl p-4 shadow-xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Exam Results</div>
              <div className="text-xs text-slate-500">Published for 5 classes</div>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            {['A', 'B', 'C', 'D'].map((grade) => (
              <div key={grade} className="flex-1 text-center py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium">
                {grade}
              </div>
            ))}
          </div>
        </div>
      </FloatingCard>

      <FloatingCard delay={4} className="hidden lg:block left-[15%] bottom-[20%] w-56 opacity-80">
        <div className="glass dark:glass-dark rounded-xl p-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Top Performer</div>
              <div className="text-xs text-slate-500">Rahul S. - 98.5%</div>
            </div>
          </div>
        </div>
      </FloatingCard>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div
            className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium text-primary bg-primary/10 ring-1 ring-inset ring-primary/20 mb-6 transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse" />
            Welcome to the TechHim Ecosystem
            <ArrowRight className="ml-2 w-4 h-4" />
          </div>

          {/* Main heading */}
          <h1
            className={`text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 transition-all duration-700 delay-100 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            One Platform for
            <br />
            <span className="gradient-text-hero">Students, Parents & Teachers</span>
          </h1>

          {/* Subtitle */}
          <p
            className={`text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed mb-8 transition-all duration-700 delay-200 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            Discover <span className="font-semibold text-slate-900 dark:text-white">TechHim EduOS</span> — The intelligent ecosystem to manage admissions, attendance, exams, and seamless communication.
          </p>

          {/* CTA buttons */}
          <div
            className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 transition-all duration-700 delay-300 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <Button
              size="lg"
              asChild
              className="h-14 px-8 rounded-full shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all text-lg font-semibold bg-gradient-to-r from-primary via-primary to-cyan-500 hover:scale-105 animate-glow"
            >
              <Link to={dashboardRoute}>
                {isAuthenticated ? "Go to Dashboard" : "Start for Free"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-14 px-8 rounded-full glass dark:glass-dark text-lg font-medium hover:scale-105 transition-all border-primary/20"
            >
              <Link to="/features">
                <Play className="mr-2 h-5 w-5" />
                Explore Features
              </Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <div
            className={`flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-slate-500 dark:text-slate-400 transition-all duration-700 delay-400 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
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

        {/* Interactive Dashboard Preview */}
        <div
          className={`mt-16 md:mt-24 mx-auto max-w-6xl relative transition-all duration-1000 delay-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          <DashboardPreview />
        </div>

        {/* Statistics Section */}
        <div
          className={`mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto transition-all duration-700 delay-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <StatCounter value={150} suffix="+" label="Schools" icon={BookOpen} />
          <StatCounter value={50000} suffix="+" label="Students" icon={Users} />
          <StatCounter value={98} suffix="%" label="Uptime" icon={TrendingUp} />
          <StatCounter value={24} suffix="/7" label="Support" icon={Calendar} />
        </div>
      </div>
    </section>
  );
}
