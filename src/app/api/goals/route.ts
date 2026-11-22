import { errorResponse, readJson } from "@/server/api/responses";
import { getCurrentOwnerId } from "@/server/auth";
import { createGoal, listGoals } from "@/server/services/goals";

export async function GET() {
  try {
    const ownerId = await getCurrentOwnerId();
    return Response.json(await listGoals(ownerId));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const ownerId = await getCurrentOwnerId();
    const goal = await createGoal(ownerId, await readJson(request));
    return Response.json(goal, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
