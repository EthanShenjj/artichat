import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: RouteContext<"/api/artifacts/[id]/invitations">) {
  const { id } = await params; const { email } = await request.json();
  if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) return Response.json({ error: "A valid email is required." }, { status: 400 });
  const invitation = await prisma.invitation.upsert({ where: { artifactId_email: { artifactId: id, email: email.toLowerCase() } }, update: { status: "PENDING", expiresAt: new Date(Date.now() + 7 * 86400000) }, create: { artifactId: id, email: email.toLowerCase(), expiresAt: new Date(Date.now() + 7 * 86400000) } }).catch(() => null);
  if (!invitation) return Response.json({ error: "Artifact not found." }, { status: 404 });
  return Response.json({ invitation }, { status: 201 });
}
