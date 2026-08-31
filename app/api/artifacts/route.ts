import { prisma } from "@/lib/prisma";
import { formatArtifact } from "@/lib/serializers";

export const dynamic = "force-dynamic";

const ownerEmail = "ethan@artichat.local";

export async function GET() {
  const artifacts = await prisma.artifact.findMany({
    where: { archived: false }, orderBy: { updatedAt: "desc" },
    include: { _count: { select: { comments: true, views: true, versions: true } } },
  });
  return Response.json({ artifacts: artifacts.map(formatArtifact) });
}

export async function POST(request: Request) {
  const body = await request.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const format = body.format as string;
  if (!title || !["HTML", "MARKDOWN", "PDF"].includes(format)) return Response.json({ error: "A title and supported format are required." }, { status: 400 });
  const owner = await prisma.user.upsert({ where: { email: ownerEmail }, update: {}, create: { email: ownerEmail, name: "Ethan Shen" } });
  const artifact = await prisma.artifact.create({
    data: { title, format, ownerId: owner.id, status: "DRAFT", visibility: "PRIVATE", versions: { create: { number: 1, content: body.content ?? "", message: "Initial draft" } } },
    include: { _count: { select: { comments: true, views: true, versions: true } } },
  });
  return Response.json({ artifact: formatArtifact(artifact) }, { status: 201 });
}
