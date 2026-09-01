"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell, ChevronDown, ChevronRight, Copy, FileCode2, FileText, Grid2X2,
  HelpCircle, Link, LockKeyhole, MoreHorizontal, Plus, Search, Send, Settings2, Share2,
  Sparkles, Star, Upload, Users, X,
} from "lucide-react";

type Language = "zh" | "en";
type ApiArtifact = {
  id: string; title: string; format: string; status: string; comments: number;
  views: number; versions: number; updatedAt: string;
};
type Artifact = ApiArtifact & { age: string };
type Filter = "ALL" | "IN_REVIEW" | "DRAFT" | "APPROVED";
type WorkspaceView = "all" | "shared" | "activity" | "favorites";
type ArtifactVersion = { id: string; number: number; content: string; message: string | null; createdAt: string };

const copy = {
  zh: {
    all: "全部产物", shared: "与我共享", activity: "动态", new: "新建产物", upload: "上传产物",
    eyebrow: "产物 / 客户项目", title: "让你的成果，在协作中向前。",
    subtitle: "交付精心打磨的 AI 成果，让每一次评审都带来下一步行动。",
    active: "活跃产物", pending: "待处理评论", visits: "外部访问", unlock: "解锁 Pro",
    reviewing: "评审中", drafts: "草稿", approved: "已通过", latest: "最后更新",
    share: "分享", publish: "发布更新", addComment: "添加评论", post: "发送", cancel: "取消",
    uploadTitle: "上传产物", uploadHint: "选择 HTML、Markdown 或 PDF，系统会创建第一个版本。",
    choose: "选择文件", replace: "更换文件", titleLabel: "产物名称", optional: "留空则使用文件名",
    uploadNow: "上传并创建产物", uploading: "正在上传…", supported: "支持 .html、.md、.markdown、.pdf，最大 2 MB",
    uploaded: "已创建并保存到数据库", noArtifacts: "还没有产物，上传第一个文件开始协作。",
    document: "用户研究洞察汇总", docTitle: "留存，是一场产品对话。",
    docLead: "真正留住客户的团队，并不只是拥有更好的留存技巧。他们让每一次回访，都成为清晰自然的下一步。",
  },
  en: {
    all: "All artifacts", shared: "Shared with me", activity: "Activity", new: "New artifact", upload: "Upload artifact",
    eyebrow: "Artifacts / client work", title: "Move your work forward, together.",
    subtitle: "Deliver polished AI work and turn every review into a next action.",
    active: "Active artifacts", pending: "Open comments", visits: "External visits", unlock: "Unlock Pro",
    reviewing: "In review", drafts: "Drafts", approved: "Approved", latest: "Last updated",
    share: "Share", publish: "Publish update", addComment: "Add comment", post: "Send", cancel: "Cancel",
    uploadTitle: "Upload an artifact", uploadHint: "Choose HTML, Markdown, or PDF. We will create its first version.",
    choose: "Choose file", replace: "Replace file", titleLabel: "Artifact title", optional: "Leave blank to use the file name",
    uploadNow: "Upload and create", uploading: "Uploading…", supported: ".html, .md, .markdown, .pdf — up to 2 MB",
    uploaded: "Created and saved to the database", noArtifacts: "No artifacts yet. Upload a file to start a review.",
    document: "User research insights", docTitle: "Retention is a product conversation.",
    docLead: "The teams that keep customers are not merely better at retention. They turn every return visit into a clear, natural next step.",
  },
} as const;

function relativeTime(value: string, language: Language) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 2) return language === "zh" ? "刚刚更新" : "updated just now";
  if (minutes < 60) return language === "zh" ? `${minutes} 分钟前更新` : `updated ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return language === "zh" ? `${hours} 小时前更新` : `updated ${hours}h ago`;
}

function formatMeta(format: string, language: Language) {
  return format === "MARKDOWN" ? "Markdown" : format === "HTML" ? "HTML" : "PDF";
}

export default function Home() {
  const [language, setLanguage] = useState<Language>("zh");
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>("all");
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(window.localStorage.getItem("artichat-favorites") ?? "[]") as string[]; } catch { return []; }
  });
  const [reviewOpen, setReviewOpen] = useState(true);
  const [versions, setVersions] = useState<ArtifactVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [versionMenuOpen, setVersionMenuOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [descending, setDescending] = useState(true);
  const [toast, setToast] = useState("");
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [busy, setBusy] = useState<"comment" | "invite" | "publish" | null>(null);
  const [version, setVersion] = useState(3);
  const t = copy[language];

  useEffect(() => {
    fetch("/api/artifacts")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then(({ artifacts: items }) => {
        const mapped = items.map((item: ApiArtifact) => ({ ...item, age: relativeTime(item.updatedAt, language) }));
        setArtifacts(mapped);
        setSelectedId(mapped[0]?.id ?? null);
        setReviewOpen(Boolean(mapped[0]));
      })
      .catch(() => setToast(language === "zh" ? "无法加载产物，请刷新后重试" : "Couldn't load artifacts. Please refresh."));
  // Only initial data loading belongs here; language is applied when rendering.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => { window.localStorage.setItem("artichat-favorites", JSON.stringify(favoriteIds)); }, [favoriteIds]);

  useEffect(() => {
    if (!selectedId || !reviewOpen) return;
    fetch(`/api/artifacts/${selectedId}`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then(({ artifact }) => {
        const loaded = artifact.versions as ArtifactVersion[];
        setVersions(loaded);
        setSelectedVersion(loaded[0]?.number ?? null);
        setVersion(loaded[0]?.number ?? 1);
      })
      .catch(() => { setVersions([]); setSelectedVersion(null); });
  }, [selectedId, reviewOpen]);

  const selected = useMemo(() => artifacts.find((item) => item.id === selectedId), [artifacts, selectedId]);
  const previewVersion = useMemo(() => versions.find((item) => item.number === selectedVersion) ?? versions[0], [versions, selectedVersion]);
  const addArtifact = (artifact: ApiArtifact) => {
    const item = { ...artifact, age: relativeTime(artifact.updatedAt, language) };
    setArtifacts((current) => [item, ...current]);
    setSelectedId(item.id);
    setReviewOpen(true);
    setUploadOpen(false);
    setToast(t.uploaded);
  };
  const visibleArtifacts = useMemo(() => artifacts
    .filter((item) => filter === "ALL" || item.status === filter)
    .filter((item) => workspaceView !== "shared" || item.comments > 0 || item.views > 0)
    .filter((item) => workspaceView !== "favorites" || favoriteIds.includes(item.id))
    .sort((a, b) => descending ? new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime() : new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()), [artifacts, filter, descending, favoriteIds, workspaceView]);
  const publish = async () => {
    if (!selected) return;
    setBusy("publish");
    try {
      const response = await fetch(`/api/artifacts/${selected.id}/versions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: "Published from ArtiChat", message: "Published update" }) });
      if (!response.ok) throw new Error();
      const { version: created } = await response.json();
      setVersion(created.number); setSelectedVersion(created.number); setVersions((current) => [created, ...current]); setToast(language === "zh" ? `已发布 v${created.number}.0` : `Version ${created.number}.0 published.`);
    } catch { setToast(language === "zh" ? "发布失败，请重试" : "Publish failed. Please retry."); }
    finally { setBusy(null); }
  };
  const postComment = async () => {
    if (!selected || !commentBody.trim()) return;
    setBusy("comment");
    try {
      const response = await fetch(`/api/artifacts/${selected.id}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: commentBody, anchor: "document" }) });
      if (!response.ok) throw new Error();
      setArtifacts((items) => items.map((item) => item.id === selected.id ? { ...item, comments: item.comments + 1 } : item));
      setCommentBody(""); setCommentOpen(false); setToast(language === "zh" ? "评论已保存" : "Comment saved.");
    } catch { setToast(language === "zh" ? "评论保存失败" : "Couldn't save comment."); }
    finally { setBusy(null); }
  };
  const invite = async () => {
    if (!selected || !inviteEmail.trim()) return;
    setBusy("invite");
    try {
      const response = await fetch(`/api/artifacts/${selected.id}/invitations`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: inviteEmail }) });
      const payload = await response.json(); if (!response.ok) throw new Error(payload.error);
      setInviteEmail(""); setShareOpen(false); setToast(language === "zh" ? "邀请已发送" : "Invitation sent.");
    } catch (reason) { setToast(reason instanceof Error ? reason.message : "Invitation failed."); }
    finally { setBusy(null); }
  };
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(`${window.location.origin}/?artifact=${selected?.id ?? ""}`); setToast(language === "zh" ? "链接已复制" : "Link copied."); }
    catch { setToast(language === "zh" ? "复制失败，请手动复制地址栏链接" : "Copy failed. Please copy the address bar URL."); }
  };
  const openReview = (id: string) => { setSelectedId(id); setReviewOpen(true); };
  const toggleFavorite = (id: string) => setFavoriteIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const workspaceTitle = workspaceView === "shared" ? t.shared : workspaceView === "activity" ? t.activity : workspaceView === "favorites" ? (language === "zh" ? "收藏夹" : "Favorites") : t.all;

  return <>
    <aside className="sidebar">
      <div className="brand"><span className="mark">a</span><span>artichat</span></div>
      <button className="create" onClick={() => setUploadOpen(true)}><Plus size={18}/><span>{t.new}</span></button>
      <p className="nav-label">{language === "zh" ? "工作区" : "WORKSPACE"}</p>
      <nav>
        <button className={workspaceView === "all" ? "nav-active" : ""} onClick={() => setWorkspaceView("all")}><Grid2X2 size={18}/><span>{t.all}</span><b>{artifacts.length}</b></button>
        <button className={workspaceView === "shared" ? "nav-active" : ""} onClick={() => setWorkspaceView("shared")}><Users size={18}/><span>{t.shared}</span><b>{artifacts.filter((item) => item.comments > 0 || item.views > 0).length}</b></button>
        <button className={workspaceView === "activity" ? "nav-active" : ""} onClick={() => setWorkspaceView("activity")}><Bell size={18}/><span>{t.activity}</span><i/></button>
      </nav>
      <p className="nav-label spacer">{language === "zh" ? "收藏夹" : "FAVORITES"}</p>
      <nav>
        <button className={workspaceView === "favorites" ? "nav-active" : ""} onClick={() => setWorkspaceView("favorites")}><span className="dot dot-yellow"/><span>{language === "zh" ? "收藏的产物" : "Favorite artifacts"}</span><b>{favoriteIds.length}</b></button>
        <button onClick={() => { setWorkspaceView("all"); setFilter("APPROVED"); }}><span className="dot dot-blue"/><span>{language === "zh" ? "产品" : "Product"}</span><b>{artifacts.filter((item) => item.status === "APPROVED").length}</b></button>
        <button onClick={() => { setWorkspaceView("all"); setFilter("DRAFT"); }}><span className="dot dot-coral"/><span>{language === "zh" ? "研究" : "Research"}</span><b>{artifacts.filter((item) => item.status === "DRAFT").length}</b></button>
      </nav>
      <button className="add-collection" onClick={() => setToast(language === "zh" ? "收藏夹创建功能即将推出" : "Collections are coming soon.")}><Plus size={16}/>{language === "zh" ? "添加收藏夹" : "Add collection"}</button>
      <div className="profile"><span className="avatar">ES</span><div><strong>Ethan Shen</strong><small>{language === "zh" ? "免费版" : "Free plan"}</small></div><button aria-label="Profile menu"><ChevronDown size={15}/></button></div>
    </aside>

    <main className="workspace">
      <header className="topbar">
        <div className="crumb"><span>{workspaceTitle}</span><ChevronRight size={15}/><strong>{selected?.title ?? t.document}</strong></div>
        <div className="top-actions"><div className="language"><button className={language === "zh" ? "active" : ""} onClick={() => setLanguage("zh")}>中</button><span>/</span><button className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")}>EN</button></div><button className="icon-button" aria-label="Search" onClick={() => setSearchOpen((open) => !open)}><Search size={20}/></button><button className="icon-button" aria-label="Settings" onClick={() => setToast(language === "zh" ? "设置将在下一步开放" : "Settings will be available next.")}><Settings2 size={20}/></button><button className="help" aria-label="Help" onClick={() => setToast(language === "zh" ? "需要帮助？上传一个文件即可开始。" : "Need help? Upload a file to get started.")}><HelpCircle size={18}/></button></div>
      </header>
      {searchOpen && <div className="utility-panel"><Search size={16}/><input autoFocus placeholder={language === "zh" ? "搜索产物" : "Search artifacts"} onChange={(event) => { const value = event.target.value.trim().toLowerCase(); const match = artifacts.find((item) => item.title.toLowerCase().includes(value)); if (match) setSelectedId(match.id); }}/><button onClick={() => setSearchOpen(false)}><X size={16}/></button></div>}
      <section className="page-head"><div><p className="eyebrow">{t.eyebrow}</p><h1>{t.title}</h1><p className="subhead">{t.subtitle}</p></div><button className="upload" onClick={() => setUploadOpen(true)}><Upload size={18}/>{t.upload}</button></section>
      <section className="stats"><div><small>{t.active}</small><strong>{artifacts.length}</strong><em>/ 3 {language === "zh" ? "免费" : "free"}</em></div><div><small>{t.pending}</small><strong>{artifacts.reduce((sum, item) => sum + item.comments, 0)}</strong><span className="up">↗ {language === "zh" ? "本周新增 3 条" : "3 new this week"}</span></div><div><small>{t.visits}</small><strong>{artifacts.reduce((sum, item) => sum + item.views, 0)}</strong><span className="up">↗ 18%</span></div><button onClick={() => setToast(language === "zh" ? "Pro 功能即将开放" : "Pro features are coming soon.")}>{t.unlock} ↗</button></section>
      {workspaceView === "activity" ? <ActivityFeed artifacts={artifacts} language={language} onOpen={openReview}/> : <><section className="filter-row"><div className="tabs"><button className={filter === "ALL" ? "current" : ""} onClick={() => setFilter("ALL")}>{t.all}<span>{artifacts.length}</span></button><button className={filter === "IN_REVIEW" ? "current" : ""} onClick={() => setFilter("IN_REVIEW")}>{t.reviewing}<span>{artifacts.filter((item) => item.status === "IN_REVIEW").length}</span></button><button className={filter === "DRAFT" ? "current" : ""} onClick={() => setFilter("DRAFT")}>{t.drafts}<span>{artifacts.filter((item) => item.status === "DRAFT").length}</span></button><button className={filter === "APPROVED" ? "current" : ""} onClick={() => setFilter("APPROVED")}>{t.approved}<span>{artifacts.filter((item) => item.status === "APPROVED").length}</span></button></div><button className="sort" onClick={() => setDescending((current) => !current)}>{t.latest}<ChevronDown className={descending ? "" : "flip"} size={14}/></button></section><section className="artifact-list">{visibleArtifacts.length === 0 ? <div className="empty-state"><p>{workspaceView === "favorites" ? (language === "zh" ? "还没有收藏。点产物右侧的菜单图标即可收藏。" : "No favorites yet. Use the menu beside an artifact to save one.") : filter === "ALL" ? t.noArtifacts : (language === "zh" ? "这个分类暂时没有产物。" : "There are no artifacts in this category.")}</p>{workspaceView === "all" && <button className="upload" onClick={() => setUploadOpen(true)}><Upload size={16}/>{t.upload}</button>}</div> : visibleArtifacts.map((artifact) => <ArtifactRow key={artifact.id} artifact={artifact} selected={artifact.id === selected?.id} favorite={favoriteIds.includes(artifact.id)} language={language} onSelect={() => openReview(artifact.id)} onToggleFavorite={() => toggleFavorite(artifact.id)} />)}</section></>}
    </main>

    {reviewOpen && selected && <aside className="review-pane">
      <header className="review-head"><div><p className="eyebrow">{language === "zh" ? "正在评审" : "IN REVIEW"}</p><h2>{selected.title}</h2></div><button className="close" aria-label="Close review" onClick={() => { setReviewOpen(false); setVersionMenuOpen(false); }}><X size={20}/></button></header>
      <div className="review-actions"><div className="version-picker"><button className="version" onClick={() => setVersionMenuOpen((open) => !open)}>v{selectedVersion ?? version}.0 <ChevronDown className={versionMenuOpen ? "flip" : ""} size={14}/></button>{versionMenuOpen && <div className="version-menu">{versions.length ? versions.map((item) => <button key={item.id} className={item.number === selectedVersion ? "active" : ""} onClick={() => { setSelectedVersion(item.number); setVersionMenuOpen(false); }}><span>v{item.number}.0</span><small>{item.message || (language === "zh" ? "初始版本" : "Initial version")}</small></button>) : <span>{language === "zh" ? "暂无版本" : "No versions"}</span>}</div>}</div><button onClick={() => setShareOpen(true)}><Share2 size={15}/>{t.share}</button><button className="publish" onClick={publish} disabled={busy === "publish"}><Send size={15}/>{busy === "publish" ? (language === "zh" ? "发布中…" : "Publishing…") : t.publish}</button></div>
      <div className="review-canvas"><ArtifactPreview artifact={selected} version={previewVersion} language={language}/>
        <aside className="annotation"><button className="add-note" onClick={() => setCommentOpen(true)}><Plus size={14}/>{t.addComment}</button><div className="thread-line"/><CommentCard initials="MC" name="Maya Chen" body={language === "zh" ? "这个切入点很有力。能否再具体说明等待的实际成本？" : "Strong framing. Can we make the cost of waiting more concrete?"}/><CommentCard initials="JR" name="Jordan Reid" body={language === "zh" ? "这里的客户引用很有效，或许可以把它移到更前面？" : "The customer quote is effective. Could it move earlier?"}/></aside>
      </div>
      <footer className="review-footer"><span>🔒 {language === "zh" ? "私密 · 已邀请 4 位评审者" : "Private · 4 reviewers invited"}</span><span>◷ {selected?.views ?? 0} {language === "zh" ? "次访问" : "views"}</span><button onClick={copyLink}><Link size={12}/>{language === "zh" ? "复制稳定链接" : "Copy stable link"}</button></footer>
    </aside>}

    {uploadOpen && <UploadDialog language={language} onClose={() => setUploadOpen(false)} onCreated={addArtifact}/>}
    {shareOpen && <ShareDialog language={language} email={inviteEmail} setEmail={setInviteEmail} busy={busy === "invite"} onClose={() => setShareOpen(false)} onInvite={invite} onCopy={copyLink}/>}
    {commentOpen && <div className="composer"><div><span className="avatar blue">ES</span><textarea autoFocus value={commentBody} onChange={(event) => setCommentBody(event.target.value)} placeholder={language === "zh" ? "写下你的评论…" : "Write a comment…"}/></div><footer><span>{language === "zh" ? "评论会通知参与者" : "Participants will be notified"}</span><button onClick={postComment} disabled={busy === "comment"}>{busy === "comment" ? "…" : t.post}</button></footer></div>}
    {toast && <div className="toast"><Sparkles size={16}/>{toast}</div>}
  </>;
}

function ArtifactPreview({ artifact, version, language }: { artifact: Artifact; version?: ArtifactVersion; language: Language }) {
  const content = version?.content ?? "";
  if (artifact.format === "HTML") return <article className="document artifact-preview"><div className="doc-top"><span className="doc-chip"><FileCode2 size={14}/>HTML</span><span>{relativeTime(artifact.updatedAt, language)}</span></div><iframe title={`${artifact.title} preview`} className="html-preview" sandbox="" srcDoc={content || "<p>No HTML content</p>"}/></article>;
  if (artifact.format === "PDF") {
    let details: { fileName?: string; size?: number } = {};
    try { details = JSON.parse(content) as { fileName?: string; size?: number }; } catch { /* Earlier PDF records did not include metadata. */ }
    return <article className="document artifact-preview"><div className="doc-top"><span className="doc-chip"><FileText size={14}/>PDF</span><span>{relativeTime(artifact.updatedAt, language)}</span></div><div className="file-preview"><FileText size={34}/><h3>{artifact.title}</h3><p>{details.fileName ?? (language === "zh" ? "已上传 PDF 文件" : "Uploaded PDF file")}</p><small>{details.size ? `${(details.size / 1024).toFixed(1)} KB` : (language === "zh" ? "PDF 预览需要对象存储支持" : "PDF preview needs object storage")}</small></div></article>;
  }
  return <article className="document artifact-preview"><div className="doc-top"><span className="doc-chip"><FileText size={14}/>MARKDOWN</span><span>{relativeTime(artifact.updatedAt, language)}</span></div><MarkdownPreview content={content} fallbackTitle={artifact.title} language={language}/></article>;
}

function MarkdownPreview({ content, fallbackTitle, language }: { content: string; fallbackTitle: string; language: Language }) {
  const lines = content.trim().split("\n");
  if (!content.trim()) return <div className="preview-empty"><h3>{fallbackTitle}</h3><p>{language === "zh" ? "这个版本暂时没有可显示的文本内容。" : "This version has no text content to display yet."}</p></div>;
  return <div className="markdown-preview">{lines.map((line, index) => {
    const key = `${index}-${line.slice(0, 12)}`;
    if (!line.trim()) return <div key={key} className="markdown-space"/>;
    if (line.startsWith("### ")) return <h4 key={key}>{line.slice(4)}</h4>;
    if (line.startsWith("## ")) return <h3 key={key}>{line.slice(3)}</h3>;
    if (line.startsWith("# ")) return <h2 key={key}>{line.slice(2)}</h2>;
    if (line.startsWith("> ")) return <blockquote key={key}>{line.slice(2)}</blockquote>;
    if (line.startsWith("- ") || line.startsWith("* ")) return <li key={key}>{line.slice(2)}</li>;
    return <p key={key}>{line}</p>;
  })}</div>;
}

function ArtifactRow({ artifact, selected, favorite, language, onSelect, onToggleFavorite }: { artifact: Artifact; selected: boolean; favorite: boolean; language: Language; onSelect: () => void; onToggleFavorite: () => void }) {
  const icon = artifact.format === "HTML" ? <FileCode2 size={19}/> : <FileText size={19}/>;
  const tone = artifact.format === "HTML" ? "mint" : artifact.format === "PDF" ? "coral" : artifact.format === "MARKDOWN" ? "amber" : "slate";
  const status = artifact.status === "DRAFT" ? (language === "zh" ? "草稿" : "Draft") : artifact.status;
  return <div className={`artifact ${selected ? "selected" : ""}`}><button className="artifact-main" onClick={onSelect}><span className={`file-icon ${tone}`}>{icon}</span><span className="artifact-name"><strong>{artifact.title}</strong><small>{formatMeta(artifact.format, language)} · {relativeTime(artifact.updatedAt, language)}</small></span><span className="status draft">{status}</span><span className="people"><i>MC</i><i>JR</i><i>+2</i></span><span className="comment-count">{artifact.comments}</span></button><button className={`more-button ${favorite ? "favorited" : ""}`} aria-label={favorite ? "Remove from favorites" : "Add to favorites"} onClick={onToggleFavorite}><Star size={17} fill={favorite ? "currentColor" : "none"}/></button></div>;
}

function ActivityFeed({ artifacts, language, onOpen }: { artifacts: Artifact[]; language: Language; onOpen: (id: string) => void }) {
  const isZh = language === "zh";
  return <section className="activity-feed"><p className="activity-heading">{isZh ? "最近动态" : "Recent activity"}</p>{artifacts.slice().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map((artifact) => <button key={artifact.id} className="activity-item" onClick={() => onOpen(artifact.id)}><span className="activity-bullet"/><span><strong>{artifact.title}</strong><small>{isZh ? `更新了 v${artifact.versions}.0` : `updated v${artifact.versions}.0`} · {relativeTime(artifact.updatedAt, language)}</small></span><ChevronRight size={16}/></button>)}</section>;
}

function CommentCard({ initials, name, body }: { initials: string; name: string; body: string }) {
  return <div className="comment-card"><span className={`avatar ${initials === "MC" ? "coral" : "blue"}`}>{initials}</span><div><strong>{name} <small>12m</small></strong><p>{body}</p><button>回复</button><button>解决</button></div></div>;
}

function ShareDialog({ language, email, setEmail, busy, onClose, onInvite, onCopy }: { language: Language; email: string; setEmail: (value: string) => void; busy: boolean; onClose: () => void; onInvite: () => void; onCopy: () => void }) {
  const isZh = language === "zh";
  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="share-title" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}><div className="share-modal"><button className="modal-close" onClick={onClose} disabled={busy} aria-label="Close"><X size={18}/></button><span className="mini-mark">a</span><h3 id="share-title">{isZh ? "安全分享" : "Share securely"}</h3><p>{isZh ? "邀请评审者查看此产物。邀请有效期为 7 天。" : "Invite reviewers to view this artifact. Invitations expire in 7 days."}</p><label>{isZh ? "评审者邮箱" : "Reviewer email"}</label><div className="invite-field"><input autoFocus type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com"/><button onClick={onInvite} disabled={busy}>{busy ? "…" : (isZh ? "发送邀请" : "Send invite")}</button></div><div className="share-rule"/><div className="link-row"><div><LockKeyhole size={15}/><span><strong>{isZh ? "私密链接" : "Private link"}</strong><small>{isZh ? "只有受邀评审者可以打开" : "Only invited reviewers can open it"}</small></span></div><button onClick={onCopy}><Copy size={14}/>{isZh ? "复制链接" : "Copy link"}</button></div></div></div>;
}

function UploadDialog({ language, onClose, onCreated }: { language: Language; onClose: () => void; onCreated: (artifact: ApiArtifact) => void }) {
  const t = copy[language];
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setError("");
    if (selected && !title) setTitle(selected.name.replace(/\.[^.]+$/, ""));
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!file) { setError(language === "zh" ? "请先选择文件。" : "Choose a file first."); return; }
    setUploading(true); setError("");
    const data = new FormData(); data.append("file", file); data.append("title", title);
    try {
      const response = await fetch("/api/artifacts", { method: "POST", body: data });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Upload failed.");
      onCreated(payload.artifact);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Upload failed."); }
    finally { setUploading(false); }
  };
  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="upload-title" onMouseDown={(event) => { if (event.target === event.currentTarget && !uploading) onClose(); }}><form className="share-modal upload-dialog" onSubmit={submit}><button type="button" className="modal-close" aria-label="Close" onClick={onClose} disabled={uploading}><X size={18}/></button><span className="mini-mark">a</span><h3 id="upload-title">{t.uploadTitle}</h3><p>{t.uploadHint}</p><input ref={inputRef} className="file-input" type="file" accept=".html,.htm,.md,.markdown,.pdf,text/html,text/markdown,application/pdf" onChange={chooseFile}/><button type="button" className="file-picker" onClick={() => inputRef.current?.click()}><Upload size={18}/><span>{file ? t.replace : t.choose}</span><small>{file ? `${file.name} · ${(file.size / 1024).toFixed(1)} KB` : t.supported}</small></button><label>{t.titleLabel}<span> · {t.optional}</span></label><input className="title-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder={language === "zh" ? "例如：Q3 用户研究洞察" : "e.g. Q3 user research insights"}/>{error && <p className="upload-error">{error}</p>}<div className="upload-actions"><button type="button" onClick={onClose} disabled={uploading}>{t.cancel}</button><button className="publish" disabled={uploading}>{uploading ? t.uploading : t.uploadNow}</button></div></form></div>;
}
