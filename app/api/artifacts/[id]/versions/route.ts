import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: RouteContext<"/api/artifacts/[id]/versions">) {
  const { id } = await params; const body = await request.json();
  const artifact = await prisma.artifact.findUnique({ where: { id }, include: { versions: { orderBy: { number: "desc" }, take: 1 } } });
  if (!artifact) return Response.json({ error: "Artifact not found." }, { status: 404 });
  const version = await prisma.artifactVersion.create({ data: { artifactId: id, number: (artifact.versions[0]?.number ?? 0) + 1, content: body.content ?? "", message: body.message?.trim() || null } });
  return Response.json({ version }, { status: 201 });
}
