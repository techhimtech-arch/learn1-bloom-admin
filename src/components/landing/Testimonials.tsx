import { Star, Quote, ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useAnimations";
import { useState, useEffect, useRef } from "react";

const testimonials = [
  {
    id: 1,
    quote: "Vidyora OS transformed our school's administrative efficiency by 60%. The real-time attendance and fee management system alone saved us countless hours every week.",
    author: "Dr. Sarah Mitchell",
    role: "Principal",
    school: "Westfield Academy",
    rating: 5,
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
  },
  {
    id: 2,
    quote: "As a parent, I love being able to track my child's progress in real-time. The instant notifications keep me informed about everything happening at school.",
    author: "Rajesh Kumar",
    role: "Parent",
    school: "Delhi Public School Parent",
    rating: 5,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
  },
  {
    id: 3,
    quote: "The teacher portal makes it so easy to manage assignments, track attendance, and communicate with parents. It's exactly what modern educators need.",
    author: "Emily Chen",
    role: "Science Teacher",
    school: "Lincoln High School",
    rating: 5,
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
  },
  {
    id: 4,
    quote: "Implementing Vidyora across our 5 campuses was seamless. The multi-campus management feature is a game-changer for district-level education.",
    author: "Michael Torres",
    role: "District Administrator",
    school: "Sunshine School District",
    rating: 5,
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  },
  {
    id: 5,
    quote: "The support team is phenomenal. They helped us migrate from our legacy system and trained our entire staff within a week. Truly exceptional service.",
    author: "Aisha Patel",
    role: "IT Director",
    school: "Cambridge International",
    rating: 5,
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
  },
];

const logos = [
  "Westfield Academy",
  "Delhi Public School",
  "Lincoln High",
  "Cambridge International",
  "Sunshine District",
  "Greenwood Prep",
];

export function Testimonials() {
  const { ref, isVisible } = useScrollAnimation<HTMLElement>(0.1, "-100px");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isAutoPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
      }, 5000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAutoPlaying]);

  const goTo = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  return (
    <section
      id="testimonials"
      className="relative py-32 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900" />
      <div className="absolute inset-0 noise-overlay opacity-30" />

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div
          ref={ref}
          className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Star className="w-4 h-4 fill-primary" />
            Trusted by Schools
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6">
            Loved by <span className="gradient-text">educators</span> worldwide
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
            See how schools are transforming their operations with Vidyora OS.
          </p>
        </div>

        {/* Main Testimonial Carousel */}
        <div className="relative max-w-4xl mx-auto mb-16">
          {/* Quote icon */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center shadow-xl shadow-primary/20">
            <Quote className="w-8 h-8 text-white" />
          </div>

          {/* Carousel container */}
          <div className="relative glass dark:glass-dark rounded-3xl pt-16 pb-8 px-8 md:px-12 shadow-xl border border-slate-200/50 dark:border-slate-700/50">
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {testimonials.map((testimonial) => (
                  <div
                    key={testimonial.id}
                    className="w-full flex-shrink-0 text-center px-4"
                  >
                    {/* Stars */}
                    <div className="flex justify-center gap-1 mb-6">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                      ))}
                    </div>

                    {/* Quote */}
                    <blockquote className="text-xl md:text-2xl text-slate-700 dark:text-slate-300 font-medium leading-relaxed mb-8 max-w-2xl mx-auto">
                      "{testimonial.quote}"
                    </blockquote>

                    {/* Author */}
                    <div className="flex items-center justify-center gap-4">
                      <img
                        src={testimonial.image}
                        alt={testimonial.author}
                        className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/20"
                      />
                      <div className="text-left">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {testimonial.author}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {testimonial.role}
                        </div>
                        <div className="text-xs text-primary">
                          {testimonial.school}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation buttons */}
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:border-primary hover:text-primary transition-colors shadow-sm"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:border-primary hover:text-primary transition-colors shadow-sm"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goTo(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  index === currentIndex
                    ? "bg-primary w-8"
                    : "bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500"
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* School Logos */}
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 max-w-4xl mx-auto">
          {logos.map((logo, i) => (
            <div
              key={logo}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/30 group hover:border-primary/30 transition-all"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <Building2 className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                {logo}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
