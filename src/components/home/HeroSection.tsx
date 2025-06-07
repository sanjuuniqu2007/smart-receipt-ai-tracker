import { Button } from "@/components/ui/button";
import { ArrowRight, ScanText, Calendar, BellRing } from "lucide-react";
import { Link } from "react-router-dom";
export function HeroSection() {
  return <section className="hero-gradient text-white py-16 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="grid gap-8 md:grid-cols-2 md:gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter">
                Smart Receipt <span className="text-secondary">Tracker</span>
              </h1>
              <p className="text-lg md:text-xl text-white/80 max-w-[600px]">
                Simplify your financial record-keeping by scanning, organizing, and managing your receipts in one secure place. Get notified before important due dates.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/auth/register">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth/login">
                
              </Link>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <ScanText className="h-4 w-4" />
                <span className="text-slate-50">Easy Receipt Scanning</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="text-slate-50">Track Due Dates</span>
              </div>
              <div className="flex items-center gap-2">
                <BellRing className="h-4 w-4" />
                <span className="text-slate-50">Due Date Notifications</span>
              </div>
            </div>
          </div>
          <div className="rounded-lg shadow-lg bg-white/10 backdrop-blur p-4 sm:p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/0 pointer-events-none" />
            <div className="relative z-10">
              <img src="/placeholder.svg" alt="Receipt Tracker Dashboard" className="rounded border border-white/20 shadow-xl" />
              <div className="mt-4 flex justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white/50" />
                <div className="w-2 h-2 rounded-full bg-white" />
                <div className="w-2 h-2 rounded-full bg-white/50" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
}