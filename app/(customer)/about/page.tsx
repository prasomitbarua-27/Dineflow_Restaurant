import Image from "next/image";
import { WhyChooseUs } from "@/components/customer/WhyChooseUs";
import { CTASection } from "@/components/customer/CTASection";

export const metadata = { title: "About — DineFlow" };

export default function AboutPage() {
  return (
    <div>
      <section className="bg-ink-950">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-medium uppercase tracking-wide text-ember-400">About DineFlow</p>
          <h1 className="mt-3 font-display text-4xl font-semibold text-cream-50">
            Food, made simple to order
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-ink-300">
            DineFlow began as one kitchen in Dhaka with a simple goal: serve genuinely good food
            without making people jump through hoops to order it. That focus on doing the
            essentials well — fresh ingredients, fast prep, and an ordering flow that gets out of
            your way — still shapes everything we build.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-16 sm:grid-cols-3 sm:px-6 lg:px-8">
        {[
          {
            image:
              "https://images.ctfassets.net/rric2f17v78a/4lDQ68azYdrmQ4ZkLs5M7b/ccfdeb359c65a4fa05e6e10ea78ca3ec/Kitchen-Design.jpg",
            title: "Our kitchen",
            copy: "Every dish is prepared fresh to order by a team that treats consistency as seriously as flavor.",
          },
          {
            image:
              "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80&auto=format&fit=crop",
            title: "Our sourcing",
            copy: "Produce and proteins are sourced daily from trusted local suppliers across Dhaka.",
          },
          {
            image:
              "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80&auto=format&fit=crop",
            title: "Our platform",
            copy: "DineFlow's ordering and tracking experience is built to feel as good as the food tastes.",
          },
        ].map((item) => (
          <div key={item.title} className="overflow-hidden rounded-2xl bg-white shadow-card">
            <div className="relative aspect-[4/3] w-full">
              <Image src={item.image} alt="" fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />
            </div>
            <div className="p-5">
              <h3 className="font-display text-base font-semibold text-ink-900">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{item.copy}</p>
            </div>
          </div>
        ))}
      </div>

      <WhyChooseUs />
      <CTASection />
    </div>
  );
}
