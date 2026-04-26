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
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSiteSettings, isSectionVisible } from "@/hooks/useSiteSettings";

export function BasicPage() {
  useSmoothAnchors();
  const settings = useSiteSettings("B");
  const showHero = isSectionVisible(settings, "hero", true);
  const showAbout = isSectionVisible(settings, "about", true);
  const showSkills = isSectionVisible(settings, "skills", true);
  const showFooterCta = isSectionVisible(settings, "footer_cta", true);
  return (
    <HireMeProvider>
      <div className="min-h-screen">
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <Nav showHireMe={false} />
        {showHero && <Hero showHireMe={false} />}
        <Ticker />
        <main className="max-w-[1320px] mx-auto px-3.5 md:px-7 pb-16">
          {showAbout && <AboutSection />}
          <EducationSection />
          {showSkills && <SkillsSection />}
          <ActivitiesSection />
          {showFooterCta && <ContactSection />}
        </main>
        <Footer />
      </div>
    </HireMeProvider>
  );
}
