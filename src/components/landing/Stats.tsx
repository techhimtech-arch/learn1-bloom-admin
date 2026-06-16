import { useScrollAnimation } from "@/hooks/useAnimations";
import { useAnimatedCounter } from "@/hooks/useAnimations";
import { TrendingUp, Users, School, Globe, Award, Clock, Shield, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const stats = [
  {
    value: 150,
    suffix: "+",
    label: "Schools Worldwide",
    description: "Trusted by educational institutions across 15+ countries",
    icon: School,
    gradient: "from-primary to-cyan-500",
  },
  {
    value: 50000,
    suffix: "+",
    label: "Active Students",
    description: "Supporting learning journeys of tens of thousands",
    icon: Users,
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    value: 99,
    suffix: ".9%",
    label: "Uptime Guarantee",
    description: "Enterprise-grade reliability and performance",
    icon: TrendingUp,
    gradient: "from-amber-500 to-orange-500",
  },
  {
    value: 24,
    suffix: "/7",
    label: "Expert Support",
    description: "Round-the-clock assistance for all your needs",
    icon: Clock,
    gradient: "from-violet-500 to-purple-500",
  },
];

const trustIndicators = [
  { icon: Shield, label: "SOC 2 Compliant" },
  { icon: Award, label: "ISO 27001 Certified" },
  { icon: HeartHandshake, label: "GDPR Ready" },
  { icon: Globe, label: "Global Coverage" },
];

function StatCard({ stat, index }: { stat: typeof stats[0]; index: number }) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>(0.2, "-50px");
  const { count, ref: counterRef } = useAnimatedCounter(stat.value, 2500);

  const Icon = stat.icon;

  return (
    <div
      ref={ref}
      className={`relative group transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 rounded-2xl blur-xl transition-opacity duration-500`} />
      <div className="relative p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-transparent group-hover:shadow-xl transition-all duration-300">
        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 p-[1px] transition-opacity duration-300`}>
          <div className="h-full w-full rounded-2xl bg-white dark:bg-slate-900" />
        </div>

        <div className="relative">
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stat.gradient} p-[1px] mb-6 group-hover:scale-110 transition-transform duration-300`}>
            <div className="w-full h-full rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center">
              <Icon className="w-6 h-6 text-primary" style={{ color: `var(--tw-gradient-from, #2563eb)` }} />
            </div>
          </div>

          <div ref={counterRef} className="text-5xl font-extrabold text-slate-900 dark:text-white mb-2 group-hover:gradient-text transition-colors">
            {count.toLocaleString()}{stat.suffix}
          </div>

          <div className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
            {stat.label}
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {stat.description}
          </p>
        </div>
      </div>
    </div>
  );
}

export function Stats() {
  const { ref, isVisible } = useScrollAnimation<HTMLElement>(0.1, "-100px");
  const [indicatorRef, indicatorsVisible] = useScrollAnimation<HTMLDivElement>(0.3, "-50px");

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900" />
      <div className="absolute inset-0 noise-overlay opacity-30" />

      {/* Decorative gradients */}
      <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/3" />
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

      {/* Animated background pattern */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-2 h-2 rounded-full bg-primary/30" style={{ animation: "float 8s ease-in-out infinite" }} />
        <div className="absolute top-1/4 right-1/3 w-3 h-3 rounded-full bg-cyan-500/20" style={{ animation: "float 10s ease-in-out infinite 1s" }} />
        <div className="absolute bottom-1/3 left-1/3 w-2 h-2 rounded-full bg-emerald-500/30" style={{ animation: "float 12s ease-in-out infinite 2s" }} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div
          ref={ref}
          className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <TrendingUp className="w-4 h-4" />
            By the Numbers
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6">
            Trusted by{" "}
            <span className="gradient-text">thousands</span>
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
            Schools around the world are transforming education with Vidyora OS.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <StatCard key={stat.label} stat={stat} index={index} />
          ))}
        </div>

        {/* Trust Indicators */}
        <div
          ref={indicatorRef as React.RefObject<HTMLDivElement>}
          className={`flex flex-wrap justify-center gap-4 mb-12 transition-all duration-700 ${
            indicatorsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {trustIndicators.map((indicator, i) => {
            const Icon = indicator.icon;
            return (
              <div
                key={indicator.label}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-primary/30 transition-colors"
                style={{ transitionDelay: `${(i + 1) * 50}ms` }}
              >
                <Icon className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{indicator.label}</span>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button
            size="lg"
            asChild
            className="h-14 px-8 rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all bg-gradient-to-r from-primary to-cyan-500 hover:scale-105"
          >
            <Link to="/register">
              Join the Community
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
