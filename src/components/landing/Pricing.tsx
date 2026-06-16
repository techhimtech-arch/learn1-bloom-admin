import { Check, Sparkles, Zap, Building2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useScrollAnimation } from "@/hooks/useAnimations";
import { useState } from "react";

const tiers = [
  {
    name: "Starter",
    price: "$49",
    period: "/month",
    description: "Perfect for small schools and tutoring centers.",
    icon: Zap,
    gradient: "from-slate-500 to-slate-400",
    features: [
      "Up to 200 Students",
      "Basic Attendance Tracking",
      "Exam & Results Management",
      "Parent Portal Access",
      "Email Support",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Professional",
    price: "$149",
    period: "/month",
    description: "Ideal for growing schools with advanced needs.",
    icon: Star,
    gradient: "from-primary to-cyan-500",
    features: [
      "Up to 1000 Students",
      "Advanced Attendance & Leave",
      "Fee Collection & Invoicing",
      "Teacher & Student Portals",
      "SMS & Email Notifications",
      "Priority Support",
    ],
    cta: "Get Started",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Tailored solutions for large institutions and districts.",
    icon: Building2,
    gradient: "from-amber-500 to-orange-500",
    features: [
      "Unlimited Students",
      "Multi-Campus Management",
      "Custom Feature Development",
      "Dedicated Account Manager",
      "API Access & Integrations",
      "24/7 Phone & Email Support",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

interface PricingCardProps {
  tier: typeof tiers[0];
  index: number;
}

function PricingCard({ tier, index }: PricingCardProps) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>(0.1, "-50px");
  const Icon = tier.icon;

  return (
    <div
      ref={ref}
      className={`relative group transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      }`}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      {/* Popular badge glow effect */}
      {tier.popular && (
        <div className="absolute -inset-1 bg-gradient-to-r from-primary via-cyan-500 to-primary rounded-3xl blur opacity-30 group-hover:opacity-50 transition-opacity animate-pulse-glow" />
      )}

      <div className={`relative flex flex-col h-full p-8 rounded-3xl transition-all duration-300 ${
        tier.popular
          ? "bg-gradient-to-br from-primary via-cyan-500/90 to-primary bg-[length:200%_200%] animate-gradient-shift text-white"
          : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary/30 hover:shadow-xl"
      }`}>
        {/* Popular badge */}
        {tier.popular && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-primary text-xs font-bold uppercase tracking-wide shadow-lg">
              <Sparkles className="w-3.5 h-3.5" />
              Most Popular
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8 pt-4">
          <div className={`w-12 h-12 rounded-2xl mb-4 flex items-center justify-center ${
            tier.popular
              ? "bg-white/20"
              : `bg-gradient-to-br ${tier.gradient} p-[1px]`
          }`}>
            {tier.popular ? (
              <Icon className="w-6 h-6" />
            ) : (
              <div className="w-full h-full rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center">
                <Icon className="w-6 h-6 text-primary" />
              </div>
            )}
          </div>
          <h3 className={`text-2xl font-bold mb-2 ${tier.popular ? "text-white" : "text-slate-900 dark:text-white"}`}>
            {tier.name}
          </h3>
          <p className={`text-sm ${tier.popular ? "text-white/80" : "text-slate-500 dark:text-slate-400"}`}>
            {tier.description}
          </p>
        </div>

        {/* Price */}
        <div className="mb-8">
          <div className="flex items-baseline gap-1">
            <span className={`text-5xl font-extrabold ${tier.popular ? "text-white" : "text-slate-900 dark:text-white"}`}>
              {tier.price}
            </span>
            <span className={`text-lg ${tier.popular ? "text-white/70" : "text-slate-500 dark:text-slate-400"}`}>
              {tier.period}
            </span>
          </div>
          {!tier.period && tier.price === "Custom" && (
            <p className={`text-xs mt-1 ${tier.popular ? "text-white/60" : "text-slate-400 dark:text-slate-500"}`}>
              Tailored to your needs
            </p>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-4 mb-8 flex-1">
          {tier.features.map((feature, fIndex) => (
            <li key={fIndex} className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                tier.popular
                  ? "bg-white/20"
                  : "bg-primary/10"
              }`}>
                <Check className={`w-3 h-3 ${tier.popular ? "text-white" : "text-primary"}`} />
              </div>
              <span className={`text-sm ${
                tier.popular
                  ? "text-white/90"
                  : "text-slate-600 dark:text-slate-300"
              }`}>
                {feature}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <Button
          asChild
          variant={tier.popular ? "secondary" : "default"}
          className={`w-full h-12 rounded-xl text-base font-semibold transition-all ${
            tier.popular
              ? "bg-white text-primary hover:bg-white/90 shadow-lg"
              : "bg-gradient-to-r from-primary to-cyan-500 hover:opacity-90"
          }`}
        >
          <Link to="/register">{tier.cta}</Link>
        </Button>
      </div>
    </div>
  );
}

export function Pricing() {
  const { ref, isVisible } = useScrollAnimation<HTMLElement>(0.1, "-100px");
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section id="pricing" className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-white dark:bg-slate-950" />
      <div className="absolute inset-0 noise-overlay opacity-30" />

      {/* Decorative gradients */}
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-gradient-to-r from-primary/10 via-transparent to-transparent rounded-full blur-3xl -translate-y-1/2 -translate-x-1/3" />
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-gradient-to-l from-cyan-500/10 via-transparent to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div
          ref={ref}
          className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Simple Pricing
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6">
            Simple, transparent{" "}
            <span className="gradient-text">pricing</span>
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
            Choose the perfect plan for your institution. No hidden fees, cancel anytime.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`text-sm font-medium ${isAnnual ? 'text-slate-500' : 'text-primary'}`}>Monthly</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                isAnnual ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  isAnnual ? 'left-8' : 'left-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${isAnnual ? 'text-primary' : 'text-slate-500'}`}>
              Annual
              <span className="ml-1 text-xs text-green-500 font-semibold">Save 20%</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {tiers.map((tier, index) => (
            <PricingCard key={tier.name} tier={tier} index={index} />
          ))}
        </div>

        {/* Trust indicators */}
        <div className="mt-16 flex flex-wrap justify-center gap-8 text-sm text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            14-day free trial
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            No credit card required
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            Cancel anytime
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            Money-back guarantee
          </div>
        </div>
      </div>
    </section>
  );
}
