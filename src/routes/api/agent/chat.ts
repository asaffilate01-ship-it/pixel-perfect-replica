import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireApiUser } from "@/lib/domureva/security/apiAuth.server";
import { systemInstruction } from "@/lib/domureva/ai/reva-copilot";

const schema = z.object({
  message: z.string().min(1),
  caseId: z.string().uuid().optional(),
  role: z.enum(["owner", "council", "provider", "contractor", "admin"]).optional(),
  verifiedFacts: z.record(z.string(), z.unknown()).optional(),
  reviewedSchemeFacts: z.record(z.string(), z.unknown()).optional(),
  outstandingTasks: z.array(z.string()).optional(),
  conversationId: z.string().uuid().optional(),
});

export const Route = createFileRoute("/api/agent/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { user, supabaseAdmin } = await requireApiUser(request);
          const body = schema.parse(await request.json());

          const instruction = systemInstruction({
            caseId: body.caseId,
            role: body.role || "owner",
            verifiedFacts: body.verifiedFacts || {},
            reviewedSchemeFacts: body.reviewedSchemeFacts || {},
            outstandingTasks: body.outstandingTasks || [],
          });

          let conversationId = body.conversationId;
          if (!conversationId) {
            const { data: conversation, error: convError } = await supabaseAdmin
              .from("agent_conversations")
              .insert({
                user_id: user.id,
                case_id: body.caseId ?? null,
                title: body.message.slice(0, 80),
              } as never)
              .select()
              .single();
            if (convError) throw convError;
            conversationId = (conversation as { id: string }).id;
          }

          await supabaseAdmin.from("agent_messages").insert({
            conversation_id: conversationId,
            role: "user",
            content: body.message,
          } as never);

          const apiKey = process.env["LOVABLE_API_KEY"];
          if (!apiKey) {
            return Response.json({ error: "AI gateway is not configured" }, { status: 500 });
          }

          const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash",
              messages: [
                { role: "system", content: instruction },
                { role: "user", content: body.message },
              ],
            }),
          });

          if (aiResponse.status === 429) {
            return Response.json(
              { error: "Reva is receiving too many requests right now. Please try again shortly." },
              { status: 429 },
            );
          }
          if (aiResponse.status === 402) {
            return Response.json(
              { error: "AI usage credits are exhausted. Please add credits to continue using Reva." },
              { status: 402 },
            );
          }
          if (!aiResponse.ok) {
            const text = await aiResponse.text();
            throw new Error(`AI gateway error ${aiResponse.status}: ${text}`);
          }

          const completion = (await aiResponse.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
          };
          const answer = completion.choices?.[0]?.message?.content || "";

          await supabaseAdmin.from("agent_messages").insert({
            conversation_id: conversationId,
            role: "assistant",
            content: answer,
            agent_name: "reva",
          } as never);

          return Response.json({
            status: "answered",
            conversationId,
            userId: user.id,
            answer,
            answerMode: "grounded",
          });
        } catch (e) {
          if (e instanceof Response) return e;
          return Response.json({ error: e instanceof Error ? e.message : "bad request" }, { status: 400 });
        }
      },
    },
  },
});
