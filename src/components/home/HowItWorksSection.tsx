
import { Camera, Cpu, Database, BellRing } from "lucide-react";

export function HowItWorksSection() {
  const steps = [
    {
      icon: <Camera className="h-8 w-8 text-primary" />,
      title: "Capture Receipt",
      description: "Take a photo or upload an image of your receipt.",
    },
    {
      icon: <Cpu className="h-8 w-8 text-primary" />,
      title: "Automatic Processing",
      description: "Our AI extracts and organizes your receipt data.",
    },
    {
      icon: <Database className="h-8 w-8 text-primary" />,
      title: "Securely Stored",
      description: "Access your organized receipts from anywhere.",
    },
    {
      icon: <BellRing className="h-8 w-8 text-primary" />,
      title: "Get Reminders",
      description: "Receive notifications when payments are due.",
    },
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="text-center space-y-4 mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">How It Works</h2>
          <p className="text-lg text-muted-foreground max-w-[800px] mx-auto">
            Smart Receipt Tracker makes receipt management simple with just a few easy steps.
          </p>
        </div>

        <div className="relative">
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2" />
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center relative">
                <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-4 mb-4 relative z-10 border-4 border-background">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
