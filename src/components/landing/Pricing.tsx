import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const tiers = [
  {
    name: "Starter",
    price: "$49",
    description: "Perfect for small schools and tutoring centers.",
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
    description: "Ideal for growing schools with advanced needs.",
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
    description: "Tailored solutions for large institutions and districts.",
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

export function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-white dark:bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Choose the perfect plan for your institution. No hidden fees, cancel anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier, index) => (
            <div
              key={index}
              className={`relative flex flex-col p-8 rounded-3xl border ${
                tier.popular
                  ? "border-primary bg-primary/5 shadow-xl shadow-primary/10 dark:bg-primary/10"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 right-8 -translate-y-1/2">
                  <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  {tier.name}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm h-10">
                  {tier.description}
                </p>
              </div>

              <div className="mb-8">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                  {tier.price}
                </span>
                {tier.price !== "Custom" && (
                  <span className="text-slate-500 dark:text-slate-400">/month</span>
                )}
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {tier.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-slate-600 dark:text-slate-300 text-sm">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                variant={tier.popular ? "default" : "outline"}
                className={`w-full h-12 rounded-xl text-md font-medium ${
                  tier.popular ? "shadow-lg shadow-primary/20" : ""
                }`}
              >
                <Link to="/register">{tier.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
