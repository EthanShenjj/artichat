import { prisma } from "@/lib/prisma";

const ownerEmail = "ethan@artichat.local";
export const dynamic = "force-dynamic";
export async function GET(_: Request, { params }: RouteContext<"/api/artifacts/[id]/comments">) {
  const { id } = await params;
  const comments = await prisma.comment.findMany({ where: { artifactId: id }, include: { author: { select: { name: true, email: true } } }, orderBy: { createdAt: "asc" } });
  return Response.json({ comments });
}
export async function POST(request: Request, { params }: RouteContext<"/api/artifacts/[id]/comments">) {
  const { id } = await params; const body = await request.json(); const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!text) return Response.json({ error: "Comment body is required." }, { status: 400 });
  const author = await prisma.user.upsert({ where: { email: ownerEmail }, update: {}, create: { email: ownerEmail, name: "Ethan Shen" } });
  const comment = await prisma.comment.create({ data: { artifactId: id, authorId: author.id, body: text, anchor: body.anchor ?? "document" }, include: { author: { select: { name: true, email: true } } } }).catch(() => null);
  if (!comment) return Response.json({ error: "Artifact not found." }, { status: 404 });
  return Response.json({ comment }, { status: 201 });
}
