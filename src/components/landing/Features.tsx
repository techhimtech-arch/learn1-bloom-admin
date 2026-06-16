import { Users, CalendarCheck, FileSpreadsheet, CreditCard, BookOpen, Bell, ArrowRight, Sparkles, TrendingUp, Shield, Zap, Globe, ChartBar as BarChart3 } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useAnimations";
import { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const features = [
  {
    title: "Role-Based Portals",
    description: "Dedicated dashboards for Admins, Teachers, Parents, and Students with tailored features and permissions.",
    icon: Users,
    gradient: "from-blue-500 to-cyan-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    title: "Attendance Tracking",
    description: "Easily mark and monitor student attendance. Automated notifications for parents on absences.",
    icon: CalendarCheck,
    gradient: "from-emerald-500 to-teal-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  {
    title: "Exams & Results",
    description: "Create exam schedules, enter marks, and automatically generate comprehensive report cards.",
    icon: FileSpreadsheet,
    gradient: "from-violet-500 to-purple-400",
    bgColor: "bg-violet-50 dark:bg-violet-950/30",
  },
  {
    title: "Fee Management",
    description: "Track fee structures, collect online payments, and issue digital receipts instantly.",
    icon: CreditCard,
    gradient: "from-amber-500 to-orange-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
  },
  {
    title: "Assignments & Materials",
    description: "Teachers can upload assignments and study materials. Students submit work directly through the portal.",
    icon: BookOpen,
    gradient: "from-rose-500 to-pink-400",
    bgColor: "bg-rose-50 dark:bg-rose-950/30",
  },
  {
    title: "Instant Announcements",
    description: "Broadcast important notices to specific classes or the entire school with email and SMS integration.",
    icon: Bell,
    gradient: "from-sky-500 to-blue-400",
    bgColor: "bg-sky-50 dark:bg-sky-950/30",
  },
];

const benefits = [
  { icon: TrendingUp, text: "Boost productivity by 40%" },
  { icon: Shield, text: "Enterprise-grade security" },
  { icon: Zap, text: "Real-time updates" },
  { icon: Globe, text: "Access anywhere" },
];

interface FeatureCardProps {
  feature: typeof features[0];
  index: number;
}

function FeatureCard({ feature, index }: FeatureCardProps) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>(0.1, "-50px");
  const Icon = feature.icon;

  return (
    <div
      ref={ref}
      className={`group relative p-1 rounded-3xl transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`} />
      <div className={`relative h-full p-8 rounded-3xl ${feature.bgColor} bg-white dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50 hover:border-transparent group-hover:shadow-xl transition-all duration-300`}>
        <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 p-[1px] transition-opacity duration-300`}>
          <div className="h-full w-full rounded-3xl bg-white dark:bg-slate-900" />
        </div>
        <div className="relative">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} p-[1px] mb-6 group-hover:scale-110 transition-transform duration-300`}>
            <div className="w-full h-full rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center">
              <Icon className="w-7 h-7" style={{ color: `var(--tw-gradient-from, #2563eb)` }} />
            </div>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:gradient-text transition-colors">
            {feature.title}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            {feature.description}
          </p>
          <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all">
            Learn more
            <ArrowRight className="ml-1 w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function Features() {
  const { ref, isVisible } = useScrollAnimation<HTMLElement>(0.1, "-100px");
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStatsVisible(true);
      },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="features" className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
      <div className="absolute inset-0 noise-overlay opacity-50" />

      {/* Decorative gradients */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-primary/10 via-transparent to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-cyan-500/10 via-transparent to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div
          ref={ref}
          className={`text-center max-w-3xl mx-auto mb-20 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Powerful Features
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6">
            Everything you need to{" "}
            <span className="gradient-text">run your school</span>
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
            A comprehensive suite of tools designed to streamline administrative tasks, enhance communication, and improve student outcomes.
          </p>
        </div>

        {/* Benefits Bar */}
        <div
          ref={statsRef}
          className={`flex flex-wrap justify-center gap-6 mb-16 transition-all duration-700 delay-200 ${
            statsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {benefits.map((benefit, i) => {
            const Icon = benefit.icon;
            return (
              <div
                key={i}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800/50 shadow-sm border border-slate-200 dark:border-slate-700"
                style={{ transitionDelay: `${i * 50}ms` }}
              >
                <Icon className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{benefit.text}</span>
              </div>
            );
          })}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Button
            size="lg"
            asChild
            className="h-14 px-8 rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all bg-gradient-to-r from-primary to-cyan-500"
          >
            <Link to="/features">
              Explore All Features
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
