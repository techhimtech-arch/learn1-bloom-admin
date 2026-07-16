import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Users, BookOpen, CreditCard, ChartBar as BarChart3, Calendar, Bell, Shield, Smartphone, Globe, Cpu, Monitor, Tablet, Play } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useAnimations";
import { useState, useEffect, useRef } from "react";

const products = [
  {
    id: "admin",
    name: "TechHim EduOS",
    title: "Admin Dashboard",
    description: "Complete school management with powerful analytics, user management, and real-time insights across all departments.",
    icon: Monitor,
    features: ["Multi-campus management", "Real-time analytics", "Role-based access", "Audit logs"],
    gradient: "from-primary to-cyan-500",
  },
  {
    id: "teacher",
    name: "TechHim Teacher",
    title: "Teacher Portal",
    description: "Streamlined teaching tools for attendance, assignment management, grade tracking, and parent communication.",
    icon: BookOpen,
    features: ["Smart attendance", "Assignment creator", "Grade book", "Parent messaging"],
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    id: "parent",
    name: "TechHim Parent",
    title: "Parent Portal",
    description: "Stay connected with your child's education through real-time updates, progress reports, and direct teacher communication.",
    icon: Users,
    features: ["Progress tracking", "Fee payments", "Announcements", "Event calendar"],
    gradient: "from-amber-500 to-orange-500",
  },
  {
    id: "lms",
    name: "TechHim LMS",
    title: "Learning Management",
    description: "Comprehensive online learning platform with course creation, virtual classrooms, and interactive assessments.",
    icon: BookOpen,
    features: ["Course builder", "Video lessons", "Quizzes", "Progress tracking"],
    gradient: "from-violet-500 to-purple-500",
  },
  {
    id: "mobile",
    name: "TechHim Mobile",
    title: "Native Apps",
    description: "Fully-featured iOS and Android apps for students, teachers, and parents with push notifications and offline access.",
    icon: Smartphone,
    features: ["Push notifications", "Offline mode", "Biometric login", "Quick actions"],
    gradient: "from-rose-500 to-pink-500",
  },
  {
    id: "ai",
    name: "TechHim AI",
    title: "AI Assistant",
    description: "Intelligent automation and insights powered by AI for scheduling, predictions, and personalized recommendations.",
    icon: Cpu,
    features: ["Smart scheduling", "Predictions", "Chatbot", "Insights"],
    gradient: "from-sky-500 to-blue-500",
  },
];

function DeviceMockup({ activeProduct }: { activeProduct: typeof products[0] }) {
  return (
    <div className="relative">
      {/* Glow effect */}
      <div className={`absolute inset-0 bg-gradient-to-br ${activeProduct.gradient} opacity-20 blur-3xl rounded-3xl`} />

      {/* Device Frame - Desktop */}
      <div className="relative bg-slate-900 rounded-2xl p-2 shadow-2xl border border-slate-700">
        {/* Browser header */}
        <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-slate-800 rounded-t-xl">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="bg-slate-700/50 rounded-lg h-6 w-96 max-w-full flex items-center px-3">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
              <span className="text-xs text-slate-400">app.techhim.com/{activeProduct.id}</span>
            </div>
          </div>
        </div>

        {/* Dashboard content */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl p-4 min-h-[400px]">
          {/* Main content area */}
          <div className="flex gap-4">
            {/* Sidebar */}
            <div className="w-48 shrink-0 space-y-2">
              {["Dashboard", "Students", "Teachers", "Attendance", "Exams", "Fees", "Settings"].map((item, i) => (
                <div
                  key={item}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    i === 0
                      ? `bg-gradient-to-r ${activeProduct.gradient} text-white`
                      : "text-slate-400 hover:bg-slate-700/50"
                  }`}
                >
                  {i === 0 && <div className="w-2 h-2 rounded-full bg-white/50" />}
                  {item}
                </div>
              ))}
            </div>

            {/* Content area */}
            <div className="flex-1 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">{activeProduct.title}</h3>
                  <p className="text-xs text-slate-400">{activeProduct.description.split(".")[0]}</p>
                </div>
                <div className={`px-3 py-1.5 rounded-lg bg-gradient-to-r ${activeProduct.gradient} text-xs text-white font-medium`}>
                  {activeProduct.name}
                </div>
              </div>

              {/* Stats cards */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Active Users", value: "2,847", change: "+12%" },
                  { label: "Tasks Done", value: "1,284", change: "+8%" },
                  { label: "Success Rate", value: "98.5%", change: "+2.3%" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                    <div className="text-xs text-slate-400 mb-1">{stat.label}</div>
                    <div className="text-xl font-bold text-white">{stat.value}</div>
                    <div className="text-xs text-green-400">{stat.change}</div>
                  </div>
                ))}
              </div>

              {/* Chart area */}
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="text-xs text-slate-400 mb-3">Weekly Activity</div>
                <div className="flex items-end gap-2 h-24">
                  {[
                    { h: 45, gradient: activeProduct.gradient },
                    { h: 72, gradient: activeProduct.gradient },
                    { h: 65, gradient: activeProduct.gradient },
                    { h: 88, gradient: activeProduct.gradient },
                    { h: 54, gradient: activeProduct.gradient },
                    { h: 96, gradient: activeProduct.gradient },
                    { h: 78, gradient: activeProduct.gradient },
                  ].map((bar, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div
                        className={`w-full rounded-t bg-gradient-to-t ${bar.gradient}`}
                        style={{ height: `${bar.h}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-slate-500">
                  {Mon.map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>
              </div>

              {/* Recent activity */}
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="text-xs text-slate-400 mb-3">Recent Activity</div>
                <div className="space-y-2">
                  {[
                    "New student enrollment completed",
                    "Attendance report generated",
                    "Fee payment received: $450",
                  ].map((activity, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                      <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${activeProduct.gradient}`} />
                      {activity}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet devices on the side */}
      <div className="absolute -right-16 top-20 hidden xl:block">
        <div className="relative w-32 bg-slate-900 rounded-xl p-1 shadow-xl border border-slate-700 transform rotate-6">
          <div className="bg-slate-800 rounded-lg aspect-[9/19]" />
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-slate-700" />
        </div>
      </div>
    </div>
  );
}

const Mon = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function ProductShowcase() {
  const { ref, isVisible } = useScrollAnimation<HTMLElement>(0.1, "-100px");
  const [activeProduct, setActiveProduct] = useState(products[0]);

  return (
    <section
      id="product"
      className="relative py-32 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-900" />
      <div className="absolute inset-0 noise-overlay opacity-30" />

      {/* Decorative gradients */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl translate-y-1/2" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div
          ref={ref}
          className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Globe className="w-4 h-4" />
            Product Suite
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6">
            One ecosystem,{" "}
            <span className="gradient-text">complete solution</span>
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
            Six powerful products working together to transform education management.
          </p>
        </div>

        {/* Product Selector */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {products.map((product) => {
            const Icon = product.icon;
            const isActive = activeProduct.id === product.id;

            return (
              <button
                key={product.id}
                onClick={() => setActiveProduct(product)}
                className={`group relative flex items-center gap-2 px-5 py-3 rounded-xl transition-all ${
                  isActive
                    ? `bg-gradient-to-r ${product.gradient} text-white shadow-lg`
                    : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary/30 text-slate-600 dark:text-slate-300 hover:text-primary"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-white" : "group-hover:scale-110 transition-transform"}`} />
                <span className="font-medium text-sm">{product.name}</span>
                {isActive && (
                  <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Two column layout */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Features */}
          <div className="order-2 lg:order-1">
            <div
              key={activeProduct.id}
              className="animate-reveal-up"
            >
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                {activeProduct.title}
              </h3>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                {activeProduct.description}
              </p>

              {/* Feature list */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {activeProduct.features.map((feature, i) => (
                  <div
                    key={feature}
                    className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary/30 transition-colors"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${activeProduct.gradient} flex items-center justify-center`}>
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                size="lg"
                asChild
                className={`h-14 px-8 rounded-full shadow-lg transition-all bg-gradient-to-r ${activeProduct.gradient} hover:opacity-90`}
              >
                <Link to="/features">
                  Explore {activeProduct.name}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Right: Device mockup */}
          <div className="order-1 lg:order-2">
            <div
              key={activeProduct.id}
              className="animate-reveal-scale"
            >
              <DeviceMockup activeProduct={activeProduct} />
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Experience all products with a unified account
          </p>
          <Button
            size="lg"
            asChild
            className="h-14 px-8 rounded-full shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-primary to-cyan-500"
          >
            <Link to="/register">
              Start Your Journey
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
