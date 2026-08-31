import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const owner = await prisma.user.upsert({ where: { email: "ethan@artichat.local" }, update: {}, create: { email: "ethan@artichat.local", name: "Ethan Shen" } });
const data = [
  ["Q3 留存策略简报", "MARKDOWN", "IN_REVIEW"],
  ["新手引导原型", "HTML", "APPROVED"],
  ["企业 GTM 提案", "PDF", "CHANGES_REQUESTED"],
  ["用户研究洞察汇总", "MARKDOWN", "DRAFT"],
];
for (const [title, format, status] of data) {
  const existing = await prisma.artifact.findFirst({ where: { title } });
  if (existing) continue;
  const artifact = await prisma.artifact.create({ data: { title, format, status, visibility: "PRIVATE", ownerId: owner.id, versions: { create: { number: 1, content: "# Artifact content", message: "Initial version" } }, views: { create: Array.from({ length: title === "Q3 留存策略简报" ? 8 : 2 }, (_, i) => ({ visitorHash: `seed-${title}-${i}`, duration: 90 + i * 12 })) } } });
  if (title === "Q3 留存策略简报") await prisma.comment.createMany({ data: [{ artifactId: artifact.id, authorId: owner.id, body: "这个切入点很有力。能否再具体说明等待的实际成本？", status: "OPEN" }, { artifactId: artifact.id, authorId: owner.id, body: "这里的客户引用很有效，或许可以把它移到更前面？", status: "OPEN" }] });
}
await prisma.$disconnect();
