export const formatArtifact = (artifact: {
  id: string; title: string; format: string; status: string; visibility: string;
  createdAt: Date; updatedAt: Date; _count: { comments: number; views: number; versions: number };
}) => ({
  id: artifact.id, title: artifact.title, format: artifact.format, status: artifact.status,
  visibility: artifact.visibility, createdAt: artifact.createdAt.toISOString(), updatedAt: artifact.updatedAt.toISOString(),
  comments: artifact._count.comments, views: artifact._count.views, versions: artifact._count.versions,
});
