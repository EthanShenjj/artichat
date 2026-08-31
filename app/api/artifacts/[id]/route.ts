import { prisma } from "@/lib/prisma";
import { formatArtifact } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: RouteContext<"/api/artifacts/[id]">) {
  const { id } = await params;
  const artifact = await prisma.artifact.findUnique({ where: { id }, include: { versions: { orderBy: { number: "desc" } }, invitations: { orderBy: { createdAt: "desc" } }, _count: { select: { comments: true, views: true, versions: true } } } });
  if (!artifact) return Response.json({ error: "Artifact not found." }, { status: 404 });
  return Response.json({ artifact: { ...formatArtifact(artifact), versions: artifact.versions, invitations: artifact.invitations } });
}

export async function PATCH(request: Request, { params }: RouteContext<"/api/artifacts/[id]">) {
  const { id } = await params; const body = await request.json();
  const data: { archived?: boolean; status?: string } = {};
  if (typeof body.archived === "boolean") data.archived = body.archived;
  if (body.status && ["DRAFT", "IN_REVIEW", "CHANGES_REQUESTED", "APPROVED"].includes(body.status)) data.status = body.status;
  const artifact = await prisma.artifact.update({ where: { id }, data, include: { _count: { select: { comments: true, views: true, versions: true } } } }).catch(() => null);
  if (!artifact) return Response.json({ error: "Artifact not found." }, { status: 404 });
  return Response.json({ artifact: formatArtifact(artifact) });
}
