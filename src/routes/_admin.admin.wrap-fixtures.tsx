import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/SectionHeader";
import { BreakToken } from "@/components/ui/break-token";
import { TruncatedText } from "@/components/ui/truncated-text";

/**
 * Dev/QA route — wrap behaviour fixtures.
 *
 * Sister page to /admin/overflow-tests:
 *   - overflow-tests = primitives + edge cases (raw <code>, raw <pre>, etc.)
 *   - wrap-fixtures  = real Card / Hero / Section variants from the site,
 *                      filled with worst-case content (long URLs, hashes,
 *                      multilingual prose) so we can confirm the global
 *                      rules behave correctly inside the actual containers
 *                      users see.
 *
 * Live at: /admin/wrap-fixtures
 *
 * Verify on 320 / 375 / 414 / 768 / 1024 / 1440px:
 *   - Page never scrolls horizontally.
 *   - Headings break gracefully (no orphan single character on its own line).
 *   - Multilingual paragraphs wrap at correct script boundaries.
 *   - RTL block reads right-to-left and stays inside its card.
 *   - Long URL inside a Card title wraps without breaking the card layout.
 */
export const Route = createFileRoute("/_admin/admin/wrap-fixtures")({
  component: WrapFixturesPage,
});

const LONG = {
  url: "https://subdomain.example-portfolio.co.uk/projects/2026/case-studies/brand-identity-system-for-acme-corporation?ref=homepage&utm_source=newsletter&utm_campaign=spring-launch",
  hash: "0xa7f4c9b2d8e1f3a6c5b9d2e8f1a4c7b0d3e6f9a2c5b8d1e4f7a0c3b6d9e2f5a8b1c4d7e0",
  handle: "@aliNurHasan_VeryLongUsernameWithoutAnySpaces_2026_official_handle",
  idnUrl: "https://例え.テスト/路径/页面?查询=值",
  cyrillicUrl: "https://пример.рф/раздел/страница-с-очень-длинным-именем-без-пробелов",
};

const I18N = {
  bn: "আলী নূর হাসান একজন ক্রিয়েটিভ ডিজাইনার, যিনি লোগো, ব্যানার, পোস্টার এবং ব্র্যান্ড আইডেন্টিটি তৈরিতে দক্ষ। তিনি বাংলাদেশের চট্টগ্রাম থেকে কাজ করেন।",
  ar: "علي نور حسن مصمم جرافيكي مبدع متخصص في تصميم الشعارات والبانرات والملصقات وهويات العلامات التجارية، يعمل من تشيتاجونج، بنغلاديش.",
  zh: "阿里·努尔·哈桑是一位创意设计师，专注于标志设计、横幅设计、海报设计和品牌视觉识别系统设计，常驻孟加拉国吉大港。",
  ja: "アリ・ヌル・ハサンはロゴ、バナー、ポスター、ブランドアイデンティティのデザインを専門とするクリエイティブデザイナーです。バングラデシュのチッタゴン在住。",
  th: "อาลีนูร์ฮาซานคือนักออกแบบกราฟิกที่เชี่ยวชาญด้านโลโก้แบนเนอร์โปสเตอร์และการออกแบบอัตลักษณ์แบรนด์อาศัยอยู่ในจิตตะกองประเทศบังกลาเทศ",
  de: "Donaudampfschifffahrtselektrizitätenhauptbetriebswerkbauunterbeamtengesellschaft beschäftigt sich mit Markenidentitätsentwicklung und Plakatgestaltungsdienstleistungen.",
  ru: "Али Нур Хасан — креативный дизайнер, специализирующийся на разработке логотипов, баннеров, постеров и фирменного стиля для брендов и компаний.",
  hi: "अली नूर हसन एक रचनात्मक डिज़ाइनर हैं जो लोगो, बैनर, पोस्टर और ब्रांड पहचान डिज़ाइन में विशेषज्ञता रखते हैं।",
};

function WrapFixturesPage() {
  return (
    <div className="container mx-auto max-w-6xl space-y-12 px-4 py-10">
      <header className="space-y-2">
        <Badge variant="outline">Dev / QA</Badge>
        <h1 className="text-3xl font-bold">Wrap fixtures — Card / Hero / Section</h1>
        <p className="text-muted-foreground">
          Worst-case URLs, hashes, handles, and multilingual prose rendered
          inside every container variant. Resize 320 → 1440 and confirm
          no horizontal scroll.
        </p>
      </header>

      {/* === PAGE-HERO STRIP (matches Portfolio / Projects landing pattern) === */}
      <Section title="1. Page-hero strip (centered)">
        <div className="text-center mx-auto max-w-3xl">
          <p className="text-xs uppercase tracking-[0.13em] text-muted-foreground mb-3">
            Eyebrow · with · a · few · separators
          </p>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            A very long hero headline that would normally orphan its last word and wrap awkwardly on mobile devices
          </h1>
          <p className="text-lg text-muted-foreground">
            Sub-headline body copy — ideally wraps with `text-pretty` so the
            last line doesn't end on a single short word, and stays balanced
            across breakpoints.
          </p>
        </div>
      </Section>

      {/* === HERO WITH LONG URL EYEBROW === */}
      <Section title="2. Hero variant with URL in eyebrow">
        <div className="text-center mx-auto max-w-3xl">
          <p className="text-xs uppercase tracking-[0.13em] text-muted-foreground mb-3">
            <BreakToken>{LONG.url}</BreakToken>
          </p>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            Headline above {' '}
            <BreakToken asChild><code className="text-3xl">{LONG.hash}</code></BreakToken>
          </h1>
        </div>
      </Section>

      {/* === SECTION HEADER + CARD GRID === */}
      <Section title="3. SectionHeader + Card grid (real component)">
        <SectionHeader label="WORK" title="Selected projects with annoyingly long titles that test wrap behaviour" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>
                Branding system for an organisation with an unreasonably long name limited liability company
              </CardTitle>
              <CardDescription>{I18N.bn}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                Repository: <BreakToken asChild><a href={LONG.url}>{LONG.url}</a></BreakToken>
              </p>
              <p>
                Commit: <BreakToken asChild mode="hard"><code>{LONG.hash}</code></BreakToken>
              </p>
            </CardContent>
            <CardFooter>
              <Button size="sm" variant="outline">View case study</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{LONG.handle}</CardTitle>
              <CardDescription>Long handle as the title.</CardDescription>
            </CardHeader>
            <CardContent>
              <TruncatedText value={LONG.url} href={LONG.url} showIcon />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Internationalised domain</CardTitle>
              <CardDescription>IDN URL with non-ASCII characters.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <BreakToken asChild><a href={LONG.idnUrl}>{LONG.idnUrl}</a></BreakToken>
              <BreakToken asChild><a href={LONG.cyrillicUrl}>{LONG.cyrillicUrl}</a></BreakToken>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* === MULTILINGUAL PROSE === */}
      <Section title="4. Multilingual prose inside Cards">
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["Bengali (bn)", "bn", I18N.bn, "ltr"],
              ["Arabic (ar) — RTL", "ar", I18N.ar, "rtl"],
              ["Chinese (zh)", "zh", I18N.zh, "ltr"],
              ["Japanese (ja)", "ja", I18N.ja, "ltr"],
              ["Thai (th) — no spaces", "th", I18N.th, "ltr"],
              ["German (de) — compounds", "de", I18N.de, "ltr"],
              ["Russian (ru)", "ru", I18N.ru, "ltr"],
              ["Hindi (hi)", "hi", I18N.hi, "ltr"],
            ] as const
          ).map(([title, lang, body, dir]) => (
            <Card key={lang}>
              <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p lang={lang} dir={dir} className="text-sm leading-relaxed">
                  {body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* === MIXED CONTENT CARD === */}
      <Section title="5. Mixed content — multilingual + URL + hash in one card">
        <Card>
          <CardHeader>
            <CardTitle>
              {I18N.zh} — collaboration with{' '}
              <BreakToken asChild><code>{LONG.handle}</code></BreakToken>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p lang="ar" dir="rtl">{I18N.ar}</p>
            <p lang="ja">{I18N.ja}</p>
            <p>
              Reference link:{' '}
              <BreakToken asChild><a href={LONG.url}>{LONG.url}</a></BreakToken>
            </p>
          </CardContent>
        </Card>
      </Section>

      {/* === DENSE LIST CARD === */}
      <Section title="6. Dense list card (services-style)">
        <Card>
          <CardHeader>
            <CardTitle>What I do</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex min-w-0 items-start gap-3">
                <Badge variant="outline" className="shrink-0">01</Badge>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">Brand identity systems</p>
                  <p className="text-sm text-muted-foreground">
                    {I18N.bn}
                  </p>
                </div>
              </li>
              <li className="flex min-w-0 items-start gap-3">
                <Badge variant="outline" className="shrink-0">02</Badge>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">Portfolio link</p>
                  <BreakToken asChild>
                    <a href={LONG.url} className="text-sm">{LONG.url}</a>
                  </BreakToken>
                </div>
              </li>
              <li className="flex min-w-0 items-start gap-3">
                <Badge variant="outline" className="shrink-0">03</Badge>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">Compound German term</p>
                  <p className="text-sm text-muted-foreground" lang="de">{I18N.de}</p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </Section>

      <footer className="border-t pt-6 text-sm text-muted-foreground">
        Sister page: <a href="/admin/overflow-tests" className="underline">/admin/overflow-tests</a> for
        primitive-level edge cases. If anything here causes the page to
        scroll horizontally, the wrap-contract test
        (<code>src/styles/wrap-contract.test.ts</code>) and the rules in
        <code>src/styles.css</code> need to be re-examined.
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}
