import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { ApiAuthError, errorResponse, requireUser } from "@/lib/domureva/security/apiAuth.server";
import { requireCaseAccess } from "@/lib/domureva/security/caseAccess.server";
import { systemInstruction, type RevaContext } from "@/lib/domureva/ai/reva-copilot";

const schema = z.object({
  message: z.string().trim().min(1).max(2400),
  caseId: z.string().uuid().optional(),
  conversationId: z.string().uuid().optional(),
});

function revaRole(caseRole: string): RevaContext["role"] {
  if (caseRole === "council_officer") return "council";
  if (caseRole === "contractor") return "contractor";
  if (caseRole === "admin") return "admin";
  if (caseRole === "housing_provider" || caseRole === "surveyor") return "provider";
  return "owner";
}

export const Route = createFileRoute("/api/agent/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { user, supabaseAdmin } = await requireUser(request);
          const body = schema.parse(await request.json());
          const apiKey = process.env["LOVABLE_API_KEY"];
          if (!apiKey) {
            return Response.json({ error: "Reva's AI service is not configured." }, { status: 503 });
          }

          let caseId: string | null = body.caseId ?? null;
          let conversationId: string | null = body.conversationId ?? null;

          if (conversationId) {
            const { data: conversation, error: conversationError } = await supabaseAdmin
              .from("agent_conversations")
              .select("id, user_id, case_id")
              .eq("id", conversationId)
              .maybeSingle();
            if (conversationError) throw conversationError;
            if (!conversation || conversation.user_id !== user.id) {
              throw new ApiAuthError("CONVERSATION_NOT_FOUND", 404);
            }
            if (body.caseId && body.caseId !== conversation.case_id) {
              throw new ApiAuthError("CONVERSATION_CASE_MISMATCH", 409);
            }
            caseId = conversation.case_id;
          }

          let role: RevaContext["role"] = "owner";
          let verifiedFacts: Record<string, unknown> = {};
          let reviewedSchemeFacts: Record<string, unknown> = {};
          let outstandingTasks: string[] = [];

          if (caseId) {
            const access = await requireCaseAccess(request, caseId);
            role = revaRole(access.caseRole);
            const property = access.property;
            verifiedFacts = {
              postcode: property.postcode,
              emptySince: property.empty_since,
              ownerType: property.owner_type,
              intendedUse: property.intended_use,
            };

            const { data: matches, error: matchError } = await supabaseAdmin
              .from("funding_matches")
              .select("scheme_id, eligible, confidence")
              .eq("case_id", caseId)
              .limit(20);
            if (matchError) throw matchError;

            const schemeIds = [...new Set((matches ?? []).map((m) => m.scheme_id))];
            if (schemeIds.length > 0) {
              const { data: schemes, error: schemeError } = await supabaseAdmin
                .from("funding_schemes")
                .select("id, name, authority, status, source_id")
                .eq("status", "reviewed")
                .in("id", schemeIds);
              if (schemeError) throw schemeError;
              reviewedSchemeFacts = {
                schemes: (schemes ?? []).map((scheme) => {
                  const match = (matches ?? []).find((m) => m.scheme_id === scheme.id);
                  return {
                    schemeId: scheme.id,
                    schemeName: scheme.name,
                    authority: scheme.authority,
                    sourceId: scheme.source_id,
                    potentiallyEligible: match?.eligible ?? null,
                    matchConfidence: match?.confidence ?? null,
                  };
                }),
              };
            }

            const { data: tasks, error: taskError } = await supabaseAdmin
              .from("case_tasks")
              .select("title")
              .eq("case_id", caseId)
              .eq("status", "open")
              .limit(20);
            if (taskError) throw taskError;
            outstandingTasks = (tasks ?? []).map((task) => task.title);
          }

          const instruction = systemInstruction({
            ...(caseId ? { caseId } : {}),
            role,
            verifiedFacts,
            reviewedSchemeFacts,
            outstandingTasks,
          });

          if (!conversationId) {
            const { data: conversation, error: creationError } = await supabaseAdmin
              .from("agent_conversations")
              .insert({
                user_id: user.id,
                case_id: caseId,
                title: body.message.slice(0, 80),
              })
              .select("id")
              .single();
            if (creationError || !conversation) throw creationError ?? new Error("Conversation could not be created");
            conversationId = conversation.id;
          }

          const { data: previous, error: historyError } = await supabaseAdmin
            .from("agent_messages")
            .select("role, content")
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: false })
            .limit(10);
          if (historyError) throw historyError;

          const history = (previous ?? [])
            .reverse()
            .filter((message) => message.role === "user" || message.role === "assistant")
            .map((message) => ({ role: message.role, content: message.content }));

          const { error: insertError } = await supabaseAdmin.from("agent_messages").insert({
            conversation_id: conversationId,
            role: "user",
            content: body.message,
          });
          if (insertError) throw insertError;

          const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-3-flash",
              messages: [
                { role: "system", content: instruction },
                ...history,
                { role: "user", content: body.message },
              ],
            }),
            signal: AbortSignal.timeout(30000),
          });

          if (aiResponse.status === 429) {
            return Response.json({ error: "Reva is busy. Try again in a moment." }, { status: 429 });
          }
          if (aiResponse.status === 402) {
            return Response.json({ error: "AI usage credits are exhausted." }, { status: 402 });
          }
          if (!aiResponse.ok) {
            return Response.json({ error: "Reva's AI service is temporarily unavailable." }, { status: 502 });
          }

          const result = (await aiResponse.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
          };
          const answer = result.choices?.[0]?.message?.content?.trim();
          if (!answer) return Response.json({ error: "Reva returned an empty response." }, { status: 502 });

          const { error: replyError } = await supabaseAdmin.from("agent_messages").insert({
            conversation_id: conversationId,
            role: "assistant",
            content: answer,
            agent_name: "reva",
          });
          if (replyError) throw replyError;

          return Response.json({
            status: "answered",
            conversationId,
            answer,
            answerMode: caseId ? "case-grounded" : "general-guidance",
          });
        } catch (error) {
          if (error instanceof ApiAuthError || error instanceof z.ZodError) return errorResponse(error, 400);
          return Response.json({ error: "Reva could not complete your request." }, { status: 500 });
        }
      },
    },
  },
});
