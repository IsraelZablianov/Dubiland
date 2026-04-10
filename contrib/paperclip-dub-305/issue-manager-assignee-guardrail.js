import { and, asc, eq, inArray, notInArray } from "drizzle-orm";
import { agents } from "@paperclipai/db";
import { unprocessable } from "../errors.js";
const MANAGER_ASSIGNMENT_ROLES = new Set(["ceo", "cto", "cmo", "cfo", "pm"]);
const IC_ASSIGNMENT_ROLES = ["engineer", "designer", "qa", "devops", "researcher", "general"];
const IMPLEMENTATION_LANE_BRACKET_RE = /\[(?:FED|Backend|QA|Performance|Architect|UX|Media|SEO|Content|Gaming|DevOps)\b[^\]]*\]/i;
const IMPLEMENTATION_TITLE_PREFIX_RE = /^Implement(?:ing)?\b/i;
export function isImplementationLaneTitle(title) {
    const t = title.trim();
    if (IMPLEMENTATION_TITLE_PREFIX_RE.test(t))
        return true;
    return IMPLEMENTATION_LANE_BRACKET_RE.test(t);
}
export function isManagerAssignmentRole(role) {
    return MANAGER_ASSIGNMENT_ROLES.has(role);
}
async function pickDefaultIcAgent(db, companyId) {
    const row = await db
        .select({ id: agents.id })
        .from(agents)
        .where(and(eq(agents.companyId, companyId), inArray(agents.role, IC_ASSIGNMENT_ROLES), notInArray(agents.status, ["pending_approval", "terminated"])))
        .orderBy(asc(agents.name))
        .limit(1)
        .then((rows) => rows[0] ?? null);
    return row?.id ?? null;
}
export async function resolveManagerAssigneeGuardrail(db, companyId, input) {
    if (!isImplementationLaneTitle(input.title)) {
        return { assigneeAgentId: input.assigneeAgentId, resolution: { kind: "noop" }, logDetails: null };
    }
    const assigneeRow = await db
        .select({ id: agents.id, role: agents.role })
        .from(agents)
        .where(and(eq(agents.id, input.assigneeAgentId), eq(agents.companyId, companyId)))
        .then((rows) => rows[0] ?? null);
    if (!assigneeRow || !isManagerAssignmentRole(assigneeRow.role)) {
        return { assigneeAgentId: input.assigneeAgentId, resolution: { kind: "noop" }, logDetails: null };
    }
    if (input.managerAssigneeOverride === true) {
        const rationale = input.managerAssigneeOverrideRationale?.trim() ?? "";
        if (rationale.length < 10) {
            throw unprocessable("managerAssigneeOverride requires managerAssigneeOverrideRationale with at least 10 characters");
        }
        return {
            assigneeAgentId: input.assigneeAgentId,
            resolution: { kind: "override_allowed", managerAgentId: input.assigneeAgentId },
            logDetails: {
                outcome: "override",
                implementationLaneTitle: true,
                fromAgentId: input.assigneeAgentId,
                toAgentId: input.assigneeAgentId,
                rationalePreview: rationale.slice(0, 240),
            },
        };
    }
    const toAgentId = await pickDefaultIcAgent(db, companyId);
    return {
        assigneeAgentId: toAgentId,
        resolution: { kind: "rerouted", fromAgentId: input.assigneeAgentId, toAgentId },
        logDetails: {
            outcome: "rerouted",
            implementationLaneTitle: true,
            fromAgentId: input.assigneeAgentId,
            toAgentId,
        },
    };
}
