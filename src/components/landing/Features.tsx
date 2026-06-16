import { Users, CalendarCheck, FileSpreadsheet, CreditCard, BookOpen, Bell } from "lucide-react";

const features = [
  {
    title: "Role-Based Portals",
    description: "Dedicated dashboards for Admins, Teachers, Parents, and Students with tailored features and permissions.",
    icon: Users,
    color: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
  },
  {
    title: "Attendance Tracking",
    description: "Easily mark and monitor student attendance. Automated notifications for parents on absences.",
    icon: CalendarCheck,
    color: "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400",
  },
  {
    title: "Exams & Results",
    description: "Create exam schedules, enter marks, and automatically generate comprehensive report cards.",
    icon: FileSpreadsheet,
    color: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400",
  },
  {
    title: "Fee Management",
    description: "Track fee structures, collect online payments, and issue digital receipts instantly.",
    icon: CreditCard,
    color: "bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400",
  },
  {
    title: "Assignments & Materials",
    description: "Teachers can upload assignments and study materials. Students submit work directly through the portal.",
    icon: BookOpen,
    color: "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400",
  },
  {
    title: "Instant Announcements",
    description: "Broadcast important notices to specific classes or the entire school with email and SMS integration.",
    icon: Bell,
    color: "bg-pink-500/10 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-slate-50 dark:bg-slate-900/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Everything you need to run your school
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            A comprehensive suite of tools designed to streamline administrative tasks, enhance communication, and improve student outcomes.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div 
                key={index}
                className="group p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:border-primary/20 transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${feature.color}`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
