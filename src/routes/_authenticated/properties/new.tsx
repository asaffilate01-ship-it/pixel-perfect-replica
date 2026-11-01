import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Building2, CheckCircle2, Coins, FileCheck2, MapPin, Sparkles } from "lucide-react";

import { Container } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/properties/new")({
  head: () => ({
    meta: [
      { title: "Check an empty property | DOMUREVA" },
      { name: "description", content: "Open a property case and check its facts against human-reviewed funding rules." },
    ],
  }),
  component: NewPropertyPage,
});

type FieldKey = "postcode" | "addressLine" | "emptyMonths" | "relationship" | "intendedUse" | "condition";
type Step = {
  eyebrow: string;
  key: FieldKey;
  label: string;
  helper: string;
  options?: string[];
  icon: typeof MapPin;
};

const STEPS: Step[] = [
  { eyebrow: "Location", key: "postcode", label: "Where is the empty property?", helper: "Postcodes help identify the appropriate local authority and location-specific funding rules.", icon: MapPin },
  { eyebrow: "Location", key: "addressLine", label: "What is the property address?", helper: "Enter the building name or number and street. This stays in your private case record.", icon: Building2 },
  { eyebrow: "Vacancy", key: "emptyMonths", label: "How long has it been empty?", helper: "Estimate the total number of months. Schemes often have a minimum vacancy period.", icon: Building2 },
  { eyebrow: "Ownership", key: "relationship", label: "What is your relationship to the property?", helper: "Different ownership and provider routes may have different rules.", options: ["Owner", "Purchaser", "Landlord", "Company", "Housing provider"], icon: CheckCircle2 },
  { eyebrow: "Plan", key: "intendedUse", label: "What should happen after the works?", helper: "Intended use can affect eligibility, nominations and provider arrangements.", options: ["Owner occupation", "Private rent", "Affordable rent", "Social rent", "Sale"], icon: Coins },
  { eyebrow: "Condition", key: "condition", label: "What best describes its condition?", helper: "This helps assess likely works, evidence requirements and delivery complexity.", options: ["Light works", "Moderate refurbishment", "Major refurbishment", "Structural concerns"], icon: FileCheck2 },
];

const OWNER_TYPES: Record<string, string> = { Owner: "owner", Purchaser: "purchaser", Landlord: "landlord", Company: "company", "Housing provider": "housing_provider" };
const USE_TYPES: Record<string, string> = { "Owner occupation": "owner_occupation", "Private rent": "private_rent", "Affordable rent": "affordable_rent", "Social rent": "social_rent", Sale: "sale" };
const CONDITIONS: Record<string, string> = { "Light works": "light_works", "Moderate refurbishment": "moderate_refurbishment", "Major refurbishment": "major_refurbishment", "Structural concerns": "structural_concerns" };
const UK_POSTCODE = /^(GIR\s?0AA|[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})$/i;

type IntakeResponse = { case?: { id: string }; conditionSaved?: boolean; error?: string };
type MatchResponse = { output?: Array<{ schemeId: string; eligible: boolean }> };

function validAnswer(key: FieldKey, value: string) {
  const trimmed = value.trim();
  if (key === "postcode") return UK_POSTCODE.test(trimmed);
  if (key === "addressLine") return trimmed.length >= 3 && trimmed.length <= 180;
  if (key === "emptyMonths") {
    const months = Number(trimmed);
    return trimmed !== "" && /^\d+$/.test(trimmed) && Number.isInteger(months) && months >= 0 && months <= 1200;
  }
  if (key === "relationship") return Object.hasOwn(OWNER_TYPES, trimmed);
  if (key === "intendedUse") return Object.hasOwn(USE_TYPES, trimmed);
  return Object.hasOwn(CONDITIONS, trimmed);
}

function NewPropertyPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Partial<Record<FieldKey, string>>>({});
  const current = STEPS[step]!;
  const progress = useMemo(() => Math.round(((step + 1) / STEPS.length) * 100), [step]);
  const value = values[current.key] ?? "";
  const canContinue = validAnswer(current.key, value);
  const isLast = step === STEPS.length - 1;
  const Icon = current.icon;

  const save = useMutation({
    mutationFn: async () => {
      if (!STEPS.every((item) => validAnswer(item.key, values[item.key] ?? ""))) {
        throw new Error("Please complete each property question before submitting.");
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Sign in again to create a property case.");

      const months = Number(values.emptyMonths);
      const emptySince = new Date();
      emptySince.setMonth(emptySince.getMonth() - months);

      const response = await fetch("/api/workflow/intake", {
        method: "POST",
        headers: { "content-type": "application/json", Authorization: "Bearer " + session.access_token },
        body: JSON.stringify({
          postcode: (values.postcode ?? "").trim().toUpperCase().replace(/\s+/g, " "),
          addressLine: values.addressLine?.trim(),
          emptySince: emptySince.toISOString().slice(0, 10),
          ownerType: OWNER_TYPES[values.relationship ?? ""],
          intendedUse: USE_TYPES[values.intendedUse ?? ""],
          condition: CONDITIONS[values.condition ?? ""],
        }),
      });
      const result = await response.json() as IntakeResponse;
      if (!response.ok || !result.case?.id) {
        throw new Error(result.error ?? "The property case could not be opened.");
      }

      // Creating the case is independent of scheme availability or funding-service health.
      // Do not discard a saved case if the subsequent funding check fails.
      let matchCount = 0;
      let matchFailed = false;
      try {
        const matchResponse = await fetch("/api/workflow/match-funding", {
          method: "POST",
          headers: { "content-type": "application/json", Authorization: "Bearer " + session.access_token },
          body: JSON.stringify({ caseId: result.case.id }),
        });
        if (!matchResponse.ok) {
          matchFailed = true;
        } else {
          const matched = await matchResponse.json() as MatchResponse;
          matchCount = (matched.output ?? []).filter((item) => item.eligible).length;
        }
      } catch {
        matchFailed = true;
      }
      return {
        caseId: result.case.id,
        matchCount,
        matchFailed,
        conditionSaved: result.conditionSaved ?? false,
      };
    },
    onSuccess: (result) => {
      if (result.matchFailed) {
        toast.warning("Case opened. The funding check needs another attempt.");
      } else if (result.matchCount > 0) {
        toast.success("Case opened with preliminary funding matches to review.");
      } else {
        toast.success("Case opened. No preliminary funding matches were found.");
      }
      if (!result.conditionSaved) toast.warning("Your condition answer needs to be saved again.");
      void navigate({ to: "/cases/$caseId", params: { caseId: result.caseId } });
    },
    onError: (error: Error) => toast.error(error.message || "Something went wrong opening the case."),
  });

  const setValue = (next: string) => setValues((prev) => ({ ...prev, [current.key]: next }));
  const advance = () => { if (!canContinue || save.isPending) return; if (isLast) save.mutate(); else setStep((prev) => prev + 1); };

  return (
    <Container className="max-w-[1180px] pt-7">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(290px,.85fr)]">
        <section className="overflow-hidden rounded-[30px] border border-border bg-card shadow-card" aria-labelledby="property-check-title">
          <div className="bg-navy px-7 py-8 text-navy-foreground md:px-9">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-leaf-soft">Property assessment</p>
                <h1 id="property-check-title" className="mt-3 font-display text-3xl font-semibold md:text-4xl">Check an empty property</h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-navy-foreground/75">
                  Six focused questions create an auditable case and start a reviewed funding check.
                </p>
              </div>
              <Sparkles aria-hidden="true" className="hidden size-7 shrink-0 text-leaf-soft sm:block" />
            </div>
            <Progress value={progress} className="mt-7" aria-label="Assessment completion" />
            <p className="mt-2 text-xs text-navy-foreground/75">Step {step + 1} of {STEPS.length} · {progress}% complete</p>
          </div>

          <div className="p-7 md:p-9">
            <div className="flex items-center gap-3">
              <Icon className="size-5 text-accent" aria-hidden="true" />
              <p className="text-xs font-semibold text-accent">{current.eyebrow}</p>
            </div>
            <h2 className="mt-4 font-display text-2xl font-semibold text-primary">{current.label}</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{current.helper}</p>

            <div className="mt-7">
              <Label htmlFor={current.key} className="sr-only">{current.label}</Label>
              {current.options ? (
                <Select value={value} onValueChange={setValue}>
                  <SelectTrigger id={current.key} className="h-12 w-full rounded-xl"><SelectValue placeholder="Choose an answer" /></SelectTrigger>
                  <SelectContent>{current.options.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
                </Select>
              ) : (
                <Input
                  id={current.key}
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); advance(); } }}
                  inputMode={current.key === "emptyMonths" ? "numeric" : "text"}
                  maxLength={current.key === "postcode" ? 9 : current.key === "addressLine" ? 180 : 4}
                  aria-invalid={value.length > 0 && !canContinue}
                  placeholder={current.key === "postcode" ? "e.g. LU1 2AA" : current.key === "addressLine" ? "House number and street" : "Number of months"}
                  className="h-12 rounded-xl"
                />
              )}
              {value.length > 0 && !canContinue ? (
                <p className="mt-2 text-sm text-destructive" role="alert">
                  {current.key === "postcode" ? "Enter a valid UK postcode." : current.key === "emptyMonths" ? "Enter a whole number between 0 and 1,200." : "Please provide a valid answer."}
                </p>
              ) : null}
            </div>

            <div className="mt-9 flex flex-wrap items-center justify-between gap-3">
              {step > 0 ? <Button type="button" variant="outline" className="rounded-full" disabled={save.isPending} onClick={() => setStep((prev) => prev - 1)}>Back</Button> : <span />}
              <Button type="button" disabled={!canContinue || save.isPending} className="rounded-full bg-amber px-6 text-amber-foreground hover:bg-amber/90" onClick={advance}>
                {save.isPending ? "Opening case…" : isLast ? "Open case and check funding" : "Continue"}
              </Button>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-[30px] bg-secondary p-7">
            <h2 className="font-display text-2xl font-semibold text-primary">From property to action.</h2>
            <ol className="mt-6 space-y-6">
              {[
                ["Identify the location", "Keep the address and vacancy facts attached to your case."],
                ["Check reviewed schemes", "Use published, human-reviewed funding criteria. A match is not an award."],
                ["Build the evidence plan", "Prepare the right documents before approaching an authority."],
              ].map(([title, detail], index) => (
                <li key={title} className="flex gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-xs font-semibold text-primary">{index + 1}</span>
                  <div><p className="font-semibold text-primary">{title}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{detail}</p></div>
                </li>
              ))}
            </ol>
          </section>
          <section className="rounded-3xl border border-border bg-card p-6">
            <h2 className="text-sm font-semibold text-primary">Funding decisions remain with the authority</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Domureva can match reviewed rules and highlight missing information; eligibility and award decisions require official confirmation.
            </p>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              The funding check may send the property's postcode to Postcodes.io to resolve its local authority.
              The street address, case ID and account information are not sent to that service.
            </p>
          </section>
        </aside>
      </div>
    </Container>
  );
}
