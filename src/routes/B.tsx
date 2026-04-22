import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/Nav";

import { Hero } from "@/components/Hero";
import { Ticker } from "@/components/Ticker";
import { Footer } from "@/components/Footer";
import { AboutSection } from "@/components/sections/AboutSection";
import { EducationSection } from "@/components/sections/EducationSection";
import { SkillsSection } from "@/components/sections/SkillsSection";
import { ActivitiesSection } from "@/components/sections/ActivitiesSection";

import { ContactSection } from "@/components/sections/ContactSection";
import { HireMeProvider } from "@/components/HireMeProvider";
import { useSmoothAnchors } from "@/hooks/useSmoothAnchors";

export const Route = createFileRoute("/B")({
  component: PageB,
  head: () => ({
    meta: [
      { title: "Basic info — Ali Nur Hasan (TasTaj)" },
      {
        name: "description",
        content:
          "Basic info for Ali Nur Hasan (TasTaj) — graphic designer with 2 years of design experience working with TasTaj on branding, logos, posters and basic web design.",
      },
      { property: "og:type", content: "profile" },
      { property: "og:title", content: "Basic info — Ali Nur Hasan (TasTaj)" },
      {
        property: "og:description",
        content:
          "Graphic designer (TasTaj) — branding, logos, posters, product & basic web design.",
      },
      { property: "twitter:card", content: "summary_large_image" },
      { property: "twitter:title", content: "Basic info — Ali Nur Hasan (TasTaj)" },
      {
        property: "twitter:description",
        content:
          "Graphic designer (TasTaj) — branding, logos, posters, product & basic web design.",
      },
    ],
  }),
});

function PageB() {
  useSmoothAnchors();
  return (
    <HireMeProvider>
      <div className="min-h-screen">
        <Nav showHireMe={false} />
        <Hero showHireMe={false} />
        <Ticker />
        <main className="max-w-[1320px] mx-auto px-3.5 md:px-7 pb-16">
          <AboutSection />
          <EducationSection />
          <SkillsSection />
          <ActivitiesSection />
          
          <ContactSection />
        </main>
        <Footer />
      </div>
    </HireMeProvider>
  );
}
