import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { ApiAuthError, errorResponse } from "@/lib/domureva/security/apiAuth.server";
import { requireCaseAccess } from "@/lib/domureva/security/caseAccess.server";
import { requireCaseAction } from "@/lib/domureva/security/caseAction.server";
import { canPerformCaseAction } from "@/lib/domureva/security/casePermissions";

const getSchema = z.string().uuid();
const createSchema = z.object({
  caseId: z.string().uuid(),
  title: z.string().trim().min(3).max(180),
  taskType: z.enum(["evidence", "funding", "survey", "quote", "works", "review", "other"]),
  blocking: z.boolean().default(false),
  dueOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).strict();
const completeSchema = z.object({
  caseId: z.string().uuid(),
  taskId: z.string().uuid(),
  action: z.literal("complete"),
}).strict();

export const Route = createFileRoute("/api/cases/tasks")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const caseId = getSchema.parse(new URL(request.url).searchParams.get("caseId"));
          const { supabaseAdmin, caseRole, user } = await requireCaseAccess(request, caseId);
          const { data, error } = await supabaseAdmin.from("case_tasks")
            .select("id,title,task_type,status,blocking,due_at,created_at,assigned_to")
            .eq("case_id", caseId).order("created_at", { ascending: false }).limit(100);
          if (error) throw error;
          return Response.json({
            caseId,
            tasks: data ?? [],
            viewerId: user.id,
            canManage: canPerformCaseAction(caseRole, "manage_tasks"),
            limitedTo: 100,
          }, { headers: { "Cache-Control": "private, no-store" } });
        } catch (error) {
          return errorResponse(error, 400);
        }
      },
      POST: async ({ request }) => {
        try {
          const body = createSchema.parse(await request.json());
          const { user, supabaseAdmin } = await requireCaseAction(request, body.caseId, "manage_tasks");
          const due = body.dueOn ? Date.parse(body.dueOn + "T12:00:00Z") : null;
          if (due !== null && (!Number.isFinite(due) || new Date(due).toISOString().slice(0, 10) !== body.dueOn)) {
            return Response.json({ error: "INVALID_DUE_DATE" }, { status: 400 });
          }
          const { data: task, error } = await supabaseAdmin.from("case_tasks").insert({
            case_id: body.caseId,
            title: body.title,
            task_type: body.taskType,
            blocking: body.blocking,
            ...(due === null ? {} : { due_at: new Date(due).toISOString() }),
            status: "open",
            metadata: { createdBy: user.id },
          }).select("id,title,task_type,status,blocking,due_at,created_at,assigned_to").single();
          if (error) throw error;
          const { error: auditError } = await supabaseAdmin.from("audit_log").insert({
            actor_id: user.id,
            entity_type: "case_task",
            entity_id: task.id,
            action: "case_task_created",
            after: { caseId: body.caseId, title: task.title, taskType: task.task_type, blocking: task.blocking },
          });
          if (auditError) {
            return Response.json({ error: "TASK_SAVED_AUDIT_FAILED", task }, { status: 500 });
          }
          return Response.json({ task, status: "created" }, { status: 201 });
        } catch (error) {
          return errorResponse(error, 400);
        }
      },
      PATCH: async ({ request }) => {
        try {
          const body = completeSchema.parse(await request.json());
          const { user, supabaseAdmin, caseRole } = await requireCaseAccess(request, body.caseId);
          const { data: task, error: taskError } = await supabaseAdmin.from("case_tasks")
            .select("id,case_id,status,assigned_to,title")
            .eq("id", body.taskId).eq("case_id", body.caseId).maybeSingle();
          if (taskError) throw taskError;
          if (!task) throw new ApiAuthError("TASK_NOT_FOUND", 404);

          const manager = canPerformCaseAction(caseRole, "manage_tasks");
          const assignee = task.assigned_to === user.id && ["contractor", "surveyor"].includes(caseRole);
          if (!manager && !assignee) throw new ApiAuthError("FORBIDDEN", 403);
          if (task.status === "complete") return Response.json({ task, status: "already_complete" });
          if (task.status !== "open") return Response.json({ error: "TASK_NOT_OPEN" }, { status: 409 });

          const { data: updated, error: updateError } = await supabaseAdmin.from("case_tasks")
            .update({ status: "complete" })
            .eq("id", task.id).eq("case_id", body.caseId).eq("status", "open")
            .select("id,title,task_type,status,blocking,due_at,created_at,assigned_to")
            .maybeSingle();
          if (updateError) throw updateError;
          if (!updated) return Response.json({ error: "TASK_CHANGED_REFRESH" }, { status: 409 });

          const { error: auditError } = await supabaseAdmin.from("audit_log").insert({
            actor_id: user.id, entity_type: "case_task", entity_id: task.id,
            action: "case_task_completed", before: { status: "open" },
            after: { status: updated.status, caseId: body.caseId },
          });
          if (auditError) return Response.json({ error: "TASK_COMPLETED_AUDIT_FAILED" }, { status: 500 });
          return Response.json({ task: updated, status: "complete" });
        } catch (error) {
          return errorResponse(error, 400);
        }
      },
    },
  },
});
