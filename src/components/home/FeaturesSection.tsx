
import { ScanText, Database, BellRing } from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      icon: <ScanText className="h-8 w-8 text-primary" />,
      title: "Scan & Extract",
      description:
        "Upload images of your receipts and our OCR technology automatically extracts key information like vendor, date, and total amount.",
    },
    {
      icon: <Database className="h-8 w-8 text-primary" />,
      title: "Track & Organize",
      description:
        "Store all your receipts in one secure place with powerful search, filtering, and sorting capabilities.",
    },
    {
      icon: <BellRing className="h-8 w-8 text-primary" />,
      title: "Smart Reminders",
      description:
        "Receive timely notifications for upcoming due dates via email, SMS, or push notifications.",
    },
  ];

  return (
    <section className="bg-muted/30 py-16 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="text-center space-y-4 mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">Key Features</h2>
          <p className="text-lg text-muted-foreground max-w-[800px] mx-auto">
            Smart Receipt Tracker combines intuitive design with powerful technology to simplify your financial record-keeping.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-background rounded-lg shadow-sm p-8 text-center"
            >
              <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-3 mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
