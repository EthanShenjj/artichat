import { prisma } from "@/lib/prisma";
import { formatArtifact } from "@/lib/serializers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ownerEmail = "ethan@artichat.local";
const supportedExtensions = new Map([
  ["html", "HTML"], ["htm", "HTML"], ["md", "MARKDOWN"],
  ["markdown", "MARKDOWN"], ["pdf", "PDF"],
]);

export async function GET() {
  const artifacts = await prisma.artifact.findMany({
    where: { archived: false }, orderBy: { updatedAt: "desc" },
    include: { _count: { select: { comments: true, views: true, versions: true } } },
  });
  return Response.json({ artifacts: artifacts.map(formatArtifact) });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  let title = "";
  let format = "";
  let content = "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return Response.json({ error: "Choose a non-empty file to upload." }, { status: 400 });
    }
    if (file.size > 2 * 1024 * 1024) {
      return Response.json({ error: "Files larger than 2 MB need file storage. Please choose a smaller file." }, { status: 413 });
    }
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    format = supportedExtensions.get(extension) ?? "";
    title = (formData.get("title")?.toString().trim() || file.name.replace(/\.[^.]+$/, ""));
    content = format === "PDF"
      ? JSON.stringify({ fileName: file.name, mimeType: file.type || "application/pdf", size: file.size })
      : await file.text();
  } else {
    const body = await request.json();
    title = typeof body.title === "string" ? body.title.trim() : "";
    format = body.format as string;
    content = typeof body.content === "string" ? body.content : "";
  }

  if (!title || !["HTML", "MARKDOWN", "PDF"].includes(format)) return Response.json({ error: "A title and supported format are required." }, { status: 400 });
  const owner = await prisma.user.upsert({ where: { email: ownerEmail }, update: {}, create: { email: ownerEmail, name: "Ethan Shen" } });
  const artifact = await prisma.artifact.create({
    data: { title, format, ownerId: owner.id, status: "DRAFT", visibility: "PRIVATE", versions: { create: { number: 1, content, message: "Initial upload" } } },
    include: { _count: { select: { comments: true, views: true, versions: true } } },
  });
  return Response.json({ artifact: formatArtifact(artifact) }, { status: 201 });
}
