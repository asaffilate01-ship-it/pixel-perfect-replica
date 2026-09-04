import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Container, PageHeader } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/properties/new")({
  head: () => ({
    meta: [
      { title: "Check an empty property | DOMUREVA" },
      {
        name: "description",
        content:
          "Answer a few questions about an empty property so Reva can match it against reviewed funding rules.",
      },
      { property: "og:title", content: "Check an empty property | DOMUREVA" },
      {
        property: "og:description",
        content: "Reva asks only the facts needed to match reviewed funding rules.",
      },
    ],
  }),
  component: NewPropertyPage,
});

type FieldKey = "postcode" | "emptyMonths" | "relationship" | "intendedUse" | "condition";

type Step = {
  eyebrow: string;
  key: FieldKey;
  label: string;
  options?: string[];
};

const STEPS: Step[] = [
  { eyebrow: "Property", key: "postcode", label: "Postcode" },
  { eyebrow: "Vacancy", key: "emptyMonths", label: "How many months has it been empty?" },
  {
    eyebrow: "Ownership",
    key: "relationship",
    label: "Your relationship to the property",
    options: ["Owner", "Purchaser", "Landlord", "Company", "Housing provider"],
  },
  {
    eyebrow: "Plan",
    key: "intendedUse",
    label: "What should happen after the works?",
    options: ["Owner occupation", "Private rent", "Affordable rent", "Social rent", "Sale"],
  },
  {
    eyebrow: "Condition",
    key: "condition",
    label: "What best describes the condition?",
    options: [
      "Light works",
      "Moderate refurbishment",
      "Major refurbishment",
      "Structural concerns",
    ],
  },
];

const OWNER_TYPE_MAP: Record<string, string> = {
  Owner: "owner",
  Purchaser: "purchaser",
  Landlord: "landlord",
  Company: "company",
  "Housing provider": "housing_provider",
};

const INTENDED_USE_MAP: Record<string, string> = {
  "Owner occupation": "owner_occupation",
  "Private rent": "private_rent",
  "Affordable rent": "affordable_rent",
  "Social rent": "social_rent",
  Sale: "sale",
};

function NewPropertyPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Partial<Record<FieldKey, string>>>({});
  const current = STEPS[step]!;
  const progress = useMemo(() => Math.round(((step + 1) / STEPS.length) * 100), [step]);

  const submit = useMutation({
    mutationFn: async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error("You need to be signed in.");

      const emptyMonths = Number.parseInt(values.emptyMonths ?? "0", 10) || 0;
      const emptySince = new Date();
      emptySince.setMonth(emptySince.getMonth() - emptyMonths);

      const { data: property, error: propertyError } = await supabase
        .from("properties")
        .insert({
          postcode: values.postcode ?? "",
          empty_since: emptySince.toISOString().slice(0, 10),
          owner_type: values.relationship ? (OWNER_TYPE_MAP[values.relationship] ?? null) : null,
          intended_use: values.intendedUse
            ? (INTENDED_USE_MAP[values.intendedUse] ?? null)
            : null,
          created_by: userData.user.id,
        })
        .select("id")
        .single();
      if (propertyError || !property) throw propertyError ?? new Error("Could not save property.");

      const { data: caseRow, error: caseError } = await supabase
        .from("cases")
        .insert({ property_id: property.id })
        .select("id")
        .single();
      if (caseError || !caseRow) throw caseError ?? new Error("Could not open a case.");

      return caseRow.id as string;
    },
    onSuccess: (caseId) => {
      toast.success("Property saved. Running the reviewed funding match…");
      navigate({ to: "/cases/$caseId", params: { caseId } });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Something went wrong saving this property.");
    },
  });

  const value = values[current.key] ?? "";
  const setValue = (next: string) => setValues((prev) => ({ ...prev, [current.key]: next }));
  const isLast = step === STEPS.length - 1;
  const canContinue = value.trim().length > 0;

  return (
    <Container>
      <PageHeader
        eyebrow="Reva Assess"
        title="Check an empty property"
        description="Reva asks only the facts needed to match reviewed funding rules. No grant outcome is guaranteed."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <Progress value={progress} />
          <p className="mt-2 text-xs font-medium text-muted-foreground">
            Step {step + 1} of {STEPS.length} · {progress}%
          </p>

          <p className="eyebrow mt-6 text-accent">{current.eyebrow}</p>
          <h2 className="mt-1 font-display text-xl font-bold text-primary">{current.label}</h2>

          <div className="mt-4">
            {current.options ? (
              <Select value={value} onValueChange={setValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {current.options.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div>
                <Label htmlFor={current.key} className="sr-only">
                  {current.label}
                </Label>
                <Input
                  id={current.key}
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  inputMode={current.key === "emptyMonths" ? "numeric" : undefined}
                  placeholder={current.key === "postcode" ? "e.g. M1 1AE" : undefined}
                />
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-between gap-3">
            {step > 0 ? (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
                Back
              </Button>
            ) : (
              <span />
            )}
            {isLast ? (
              <Button
                className="bg-amber text-amber-foreground hover:bg-amber/90"
                disabled={!canContinue || submit.isPending}
                onClick={() => submit.mutate()}
              >
                {submit.isPending ? "Saving…" : "Run reviewed funding match"}
              </Button>
            ) : (
              <Button disabled={!canContinue} onClick={() => setStep((s) => s + 1)}>
                Continue
              </Button>
            )}
          </div>
        </section>

        <aside className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-bold text-primary">What Reva will do</h2>
          <div className="mt-4 space-y-4">
            {[
              {
                title: "Resolve authority",
                body: "Map postcode to local authority and approved geographic rules.",
              },
              {
                title: "Check reviewed schemes",
                body: "Unreviewed AI discoveries never affect live eligibility.",
              },
              {
                title: "Build your evidence list",
                body: "Only request documents relevant to matched schemes.",
              },
            ].map((agent, index) => (
              <div key={agent.title} className="flex gap-3">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-semibold text-navy-foreground">
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary">{agent.title}</p>
                  <p className="text-sm text-muted-foreground">{agent.body}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </Container>
  );
}
