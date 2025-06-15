
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FAQSection() {
  const faqs = [
    {
      question: "How does the OCR technology work?",
      answer:
        "Our advanced OCR technology scans your receipt images and extracts key information like vendor name, date, total amount, and itemized entries. The system becomes more accurate over time as it learns from your receipts.",
    },
    {
      question: "Is my receipt data secure?",
      answer:
        "Absolutely. We use bank-level encryption to store your data, and your information is never shared with third parties without your explicit consent. We implement strict access controls and regular security audits.",
    },
    {
      question: "What types of reminders can I set?",
      answer:
        "You can set reminders for due dates, payment deadlines, or warranty expirations. Notifications can be delivered via email, SMS, or browser push notifications based on your preferences.",
    },
    {
      question: "Is there a limit to how many receipts I can upload?",
      answer:
        "Our free plan includes storage for up to 50 receipts. Premium plans offer unlimited receipt storage along with additional features like advanced analytics and priority OCR processing.",
    },
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="text-center space-y-4 mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">Frequently Asked Questions</h2>
          <p className="text-lg text-muted-foreground max-w-[800px] mx-auto">
            Find answers to common questions about Smart Receipt Tracker.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
