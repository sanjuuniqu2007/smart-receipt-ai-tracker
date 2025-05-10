
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

export function TestimonialsSection() {
  const testimonials = [
    {
      quote:
        "Smart Receipt Tracker has revolutionized how I manage my business expenses. The OCR is incredibly accurate, and the reminder system ensures I never miss a payment.",
      author: "Sarah Johnson",
      role: "Small Business Owner",
    },
    {
      quote:
        "As a freelancer, keeping track of receipts used to be a nightmare. Now, everything is organized automatically. The time I save is invaluable.",
      author: "Michael Chen",
      role: "Freelance Designer",
    },
    {
      quote:
        "The ability to access all my receipts from any device has made expense reporting so much easier. The automatic categorization is spot on.",
      author: "Alex Rodriguez",
      role: "Marketing Director",
    },
  ];

  return (
    <section className="bg-muted/30 py-16 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="text-center space-y-4 mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">What Our Users Say</h2>
          <p className="text-lg text-muted-foreground max-w-[800px] mx-auto">
            Discover how Smart Receipt Tracker is helping people manage their finances more efficiently.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-background">
              <CardContent className="p-6 space-y-4">
                <p className="text-muted-foreground italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {testimonial.author.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
