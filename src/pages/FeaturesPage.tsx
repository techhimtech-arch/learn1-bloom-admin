import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Smartphone, BookOpen, Users, Sparkles, LayoutDashboard, Database } from "lucide-react";

const products = [
  {
    name: "TechHim EduOS",
    description: "The central nervous system of your school. Manage admissions, HR, finance, and global settings from one powerful unified dashboard.",
    icon: Database,
    color: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
  },
  {
    name: "TechHim Teacher",
    description: "Empower your educators. Dedicated tools for attendance, grading, assignment creation, and direct student communication.",
    icon: LayoutDashboard,
    color: "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400",
  },
  {
    name: "TechHim Parent",
    description: "Keep parents in the loop. Real-time updates on attendance, exam results, fee dues, and school announcements.",
    icon: Users,
    color: "bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400",
  },
  {
    name: "TechHim LMS",
    description: "A complete Learning Management System. Host study materials, online quizzes, video lessons, and interactive learning modules.",
    icon: BookOpen,
    color: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400",
  },
  {
    name: "TechHim Mobile",
    description: "Education on the go. Native mobile applications for students, parents, and teachers for instant access anywhere, anytime.",
    icon: Smartphone,
    color: "bg-pink-500/10 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400",
  },
  {
    name: "TechHim AI",
    description: "Future-ready intelligence. Automated report generation, predictive student performance analysis, and smart timetable generation.",
    icon: Sparkles,
    color: "bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400",
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 font-sans flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-32 pb-24">
        {/* Header Section */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-4xl mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
            Meet the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-teal-500">TechHim Ecosystem</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
            More than just school management. TechHim EduOS provides a deeply integrated suite of applications designed to connect every stakeholder in the educational journey.
          </p>
        </div>

        {/* Ecosystem Grid */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product, index) => {
              const Icon = product.icon;
              return (
                <div 
                  key={index}
                  className="group relative p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                >
                  {/* Subtle Background Gradient on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${product.color}`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 relative z-10">
                    {product.name}
                  </h3>
                  
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed relative z-10">
                    {product.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA Section */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-32">
          <div className="bg-gradient-to-r from-indigo-600 to-teal-500 rounded-3xl p-12 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Ready to transform your campus?
              </h2>
              <p className="text-indigo-100 text-lg mb-8">
                Join thousands of forward-thinking institutions running on TechHim EduOS.
              </p>
              <a 
                href="/register" 
                className="inline-flex items-center justify-center h-14 px-8 rounded-full bg-white text-indigo-600 font-semibold text-lg hover:bg-indigo-50 transition-colors shadow-lg hover:shadow-xl"
              >
                Get Started Today
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
