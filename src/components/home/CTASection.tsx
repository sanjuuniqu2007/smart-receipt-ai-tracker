
import { Button } from "@/components/ui/button";
import { ArrowRight, Bell } from "lucide-react";
import { Link } from "react-router-dom";
export function CTASection() {
  return <section className="hero-gradient text-white py-16">
      <div className="container px-4 md:px-6">
        <div className="text-center space-y-6 max-w-[800px] mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to Simplify Your Receipt Management?
          </h2>
          <p className="text-lg text-white/80">
            Join thousands of users who save time and reduce stress with Smart Receipt Tracker.
            Never miss a warranty or payment deadline with our notification system.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/auth/register">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="lg" variant="outline" className="border-white text-gray-700 bg-slate-50">
                <Bell className="mr-2 h-4 w-4" />
                Explore Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>;
}
