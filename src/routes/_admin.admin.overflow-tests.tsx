import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { TruncatedText } from "@/components/ui/truncated-text";

/**
 * Dev/QA route — visual regression bench for the long-string overflow
 * safeguards. Renders worst-case URLs, hashes, handles, transaction IDs,
 * file paths and pasted blobs in every container we use across the site
 * (cards, tables, lists, links, inputs, badges) so we can confirm at a
 * glance that none of them produce horizontal page scroll on mobile.
 *
 * Live at: /admin/overflow-tests
 *
 * How to verify:
 *   1. Open in mobile viewport (375px) — the page must NOT scroll
 *      horizontally. Only the marked "expected scroll" zones may scroll.
 *   2. Resize 320 → 1440 — every card/table/list stays within viewport.
 *   3. Tap any TruncatedText sample — clipboard receives the FULL value.
 */
export const Route = createFileRoute("/_admin/admin/overflow-tests")({
  component: OverflowTestsPage,
});

const SAMPLES = {
  longUrl:
    "https://example.com/very/deeply/nested/path/segment/that/keeps-going-and-going?utm_source=newsletter&utm_medium=email&utm_campaign=2026-spring-launch&ref=anh-portfolio&session=abc123def456",
  shortUrl: "https://lovable.dev",
  sha256:
    "0xa7f4c9b2d8e1f3a6c5b9d2e8f1a4c7b0d3e6f9a2c5b8d1e4f7a0c3b6d9e2f5a8b1c4d7e0",
  txHash:
    "0xdeadbeefcafebabe1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  handle: "@aliVeryLongUsernameWithoutAnySpacesOrBreaksAtAll_2026_official",
  email: "alinurhasan.portfolio.contact.address.test@verylongdomainname-example.co.uk",
  filePath:
    "/Users/ali/Documents/Projects/portfolio/src/components/SomeReallyLongFileName.component.tsx",
  pastedBlob:
    "supercalifragilisticexpialidociouspneumonoultramicroscopicsilicovolcanoconiosishippopotomonstrosesquippedaliophobia",
  multiWord:
    "This is a normal sentence that should wrap softly on word boundaries the way regular paragraph copy is expected to behave across breakpoints.",
};

function OverflowTestsPage() {
  return (
    <div className="container mx-auto max-w-5xl space-y-8 px-4 py-10">
      <header className="space-y-2">
        <Badge variant="outline">Dev / QA</Badge>
        <h1 className="text-3xl font-bold">Overflow safeguard test bench</h1>
        <p className="text-muted-foreground">
          Worst-case strings rendered in every primitive. Open this page on
          a 320–414px viewport and confirm the page itself never scrolls
          horizontally. Each card is independently verifiable.
        </p>
      </header>

      {/* 1. Raw text in cards */}
      <TestCard
        title="1. Cards — raw long strings"
        description="Cards must clip / wrap; never push the viewport wider."
      >
        <Field label="Long URL">
          <p>{SAMPLES.longUrl}</p>
        </Field>
        <Field label="SHA-256">
          <p>{SAMPLES.sha256}</p>
        </Field>
        <Field label="Long handle">
          <p>{SAMPLES.handle}</p>
        </Field>
        <Field label="Pasted blob (no spaces)">
          <p>{SAMPLES.pastedBlob}</p>
        </Field>
      </TestCard>

      {/* 2. Anchor tags */}
      <TestCard
        title="2. Anchor tags"
        description="Global rule wraps mid-URL via overflow-wrap: anywhere."
      >
        <p>
          Visit{" "}
          <a href={SAMPLES.longUrl} target="_blank" rel="noreferrer">
            {SAMPLES.longUrl}
          </a>{" "}
          for the full reference, or contact{" "}
          <a href={`mailto:${SAMPLES.email}`}>{SAMPLES.email}</a>.
        </p>
      </TestCard>

      {/* 3. Code & pre */}
      <TestCard
        title="3. <code> and <pre>"
        description="<code> wraps anywhere; <pre> scrolls inside itself (this is the only allowed scroll zone)."
      >
        <Field label="Inline code">
          <p>
            Run <code>{SAMPLES.txHash}</code> in your terminal.
          </p>
        </Field>
        <Field label="Preformatted block (expected horizontal scroll inside)">
          <pre className="rounded-md bg-muted p-3 text-xs">
            {`curl -X POST https://api.example.com/v1/transactions/${SAMPLES.txHash} \\\n  -H "Authorization: Bearer ${SAMPLES.sha256}" \\\n  -d '{"path":"${SAMPLES.filePath}"}'`}
          </pre>
        </Field>
      </TestCard>

      {/* 4. TruncatedText component */}
      <TestCard
        title="4. <TruncatedText /> — single-line ellipsis + tap to copy"
        description="Each row truncates with ellipsis. Tap anywhere on the text to copy the full value."
      >
        <Row label="Plain">
          <TruncatedText value={SAMPLES.longUrl} />
        </Row>
        <Row label="As link">
          <TruncatedText value={SAMPLES.longUrl} href={SAMPLES.longUrl} showIcon />
        </Row>
        <Row label="Hash">
          <TruncatedText value={SAMPLES.txHash} showIcon />
        </Row>
        <Row label="Email">
          <TruncatedText value={SAMPLES.email} />
        </Row>
        <Row label="Handle (custom display)">
          <TruncatedText value={SAMPLES.handle} display="@aliNurHasan" showIcon />
        </Row>
      </TestCard>

      {/* 5. Tables */}
      <TestCard
        title="5. Tables — long IDs in cells"
        description="Cells wrap inside their column. Table itself scrolls inside its own container if needed (allowed)."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Field</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Transaction</TableCell>
              <TableCell>{SAMPLES.txHash}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>URL</TableCell>
              <TableCell>{SAMPLES.longUrl}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Path</TableCell>
              <TableCell>{SAMPLES.filePath}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Truncated cell</TableCell>
              <TableCell className="max-w-[160px] truncate">
                {SAMPLES.longUrl}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TestCard>

      {/* 6. Lists */}
      <TestCard
        title="6. Lists"
        description="Bulleted and ordered lists with long items."
      >
        <ul className="list-disc space-y-1 pl-5">
          <li>{SAMPLES.longUrl}</li>
          <li>{SAMPLES.handle}</li>
          <li>{SAMPLES.pastedBlob}</li>
          <li>{SAMPLES.multiWord}</li>
        </ul>
      </TestCard>

      {/* 7. Form controls */}
      <TestCard
        title="7. Inputs"
        description="Pre-filled inputs with long values must clamp to their container."
      >
        <Field label="Text input">
          <Input defaultValue={SAMPLES.longUrl} />
        </Field>
        <Field label="Read-only">
          <Input readOnly value={SAMPLES.txHash} />
        </Field>
        <Field label="Inside narrow flex">
          <div className="flex gap-2">
            <Input defaultValue={SAMPLES.longUrl} className="flex-1" />
            <button className="shrink-0 rounded-md border px-3 text-sm">Save</button>
          </div>
        </Field>
      </TestCard>

      {/* 8. Flex/grid edge cases */}
      <TestCard
        title="8. Flex / grid edge cases"
        description="Flex children with min-w-0 must not blow out their parent."
      >
        <Field label="Flex row with avatar + long text">
          <div className="flex min-w-0 items-start gap-3">
            <div className="h-10 w-10 shrink-0 rounded-full bg-primary/20" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">Long URL inside a flex child:</p>
              <p className="text-sm text-muted-foreground">{SAMPLES.longUrl}</p>
            </div>
          </div>
        </Field>
        <Field label="Two-column grid with hashes">
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0 rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Left</p>
              <p className="text-sm">{SAMPLES.txHash}</p>
            </div>
            <div className="min-w-0 rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Right</p>
              <p className="text-sm">{SAMPLES.longUrl}</p>
            </div>
          </div>
        </Field>
      </TestCard>

      <footer className="border-t pt-6 text-sm text-muted-foreground">
        If any card above causes the page to scroll horizontally on mobile,
        the overflow-safeguard rules in <code>src/styles.css</code> have
        regressed. The <code>html, body</code> <code>overflow-x: clip</code>
        rule should make this impossible.
      </footer>
    </div>
  );
}

function TestCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-3 border-b py-2 last:border-0">
      <span className="w-32 shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
