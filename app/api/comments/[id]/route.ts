import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: RouteContext<"/api/comments/[id]">) {
  const { id } = await params; const { status } = await request.json();
  if (!["OPEN", "RESOLVED"].includes(status)) return Response.json({ error: "Invalid comment status." }, { status: 400 });
  const comment = await prisma.comment.update({ where: { id }, data: { status } }).catch(() => null);
  if (!comment) return Response.json({ error: "Comment not found." }, { status: 404 });
  return Response.json({ comment });
}
