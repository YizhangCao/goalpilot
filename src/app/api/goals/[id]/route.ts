import { goalIdSchema } from "@/lib/schemas/goal";
import { errorResponse, invalidId, notFound, readJson } from "@/server/api/responses";
import { getCurrentOwnerId } from "@/server/auth";
import { deleteGoal, updateGoal } from "@/server/services/goals";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Context) {
  try {
    const id = goalIdSchema.safeParse((await ctx.params).id);
    if (!id.success) return invalidId();

    const ownerId = await getCurrentOwnerId();
    const goal = await updateGoal(ownerId, id.data, await readJson(request));
    return goal ? Response.json(goal) : notFound();
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, ctx: Context) {
  try {
    const id = goalIdSchema.safeParse((await ctx.params).id);
    if (!id.success) return invalidId();

    const ownerId = await getCurrentOwnerId();
    return (await deleteGoal(ownerId, id.data)) ? new Response(null, { status: 204 }) : notFound();
  } catch (error) {
    return errorResponse(error);
  }
}
