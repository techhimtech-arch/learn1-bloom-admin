import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Pricing } from "@/components/landing/Pricing";
import { Footer } from "@/components/landing/Footer";
import { Testimonials } from "@/components/landing/Testimonials";
import { ProductShowcase } from "@/components/landing/ProductShowcase";
import { Stats } from "@/components/landing/Stats";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 font-sans">
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <Features />
        <ProductShowcase />
        <Testimonials />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
