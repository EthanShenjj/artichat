"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell, ChevronDown, ChevronRight, FileCode2, FileText, Grid2X2,
  HelpCircle, Link, MoreHorizontal, Plus, Search, Send, Settings2, Share2,
  Sparkles, Upload, Users, X,
} from "lucide-react";

type Language = "zh" | "en";
type ApiArtifact = {
  id: string; title: string; format: string; status: string; comments: number;
  views: number; versions: number; updatedAt: string;
};
type Artifact = ApiArtifact & { age: string };

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
  const [uploadOpen, setUploadOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [commentOpen, setCommentOpen] = useState(false);
  const [version, setVersion] = useState(3);
  const t = copy[language];

  useEffect(() => {
    fetch("/api/artifacts")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then(({ artifacts: items }) => {
        const mapped = items.map((item: ApiArtifact) => ({ ...item, age: relativeTime(item.updatedAt, language) }));
        setArtifacts(mapped);
        setSelectedId(mapped[0]?.id ?? null);
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

  const selected = useMemo(() => artifacts.find((item) => item.id === selectedId) ?? artifacts[0], [artifacts, selectedId]);
  const addArtifact = (artifact: ApiArtifact) => {
    const item = { ...artifact, age: relativeTime(artifact.updatedAt, language) };
    setArtifacts((current) => [item, ...current]);
    setSelectedId(item.id);
    setUploadOpen(false);
    setToast(t.uploaded);
  };

  return <>
    <aside className="sidebar">
      <div className="brand"><span className="mark">a</span><span>artichat</span></div>
      <button className="create" onClick={() => setUploadOpen(true)}><Plus size={18}/><span>{t.new}</span></button>
      <p className="nav-label">{language === "zh" ? "工作区" : "WORKSPACE"}</p>
      <nav>
        <button className="nav-active"><Grid2X2 size={18}/><span>{t.all}</span><b>{artifacts.length}</b></button>
        <button onClick={() => setToast(language === "zh" ? "共享产物将在这里显示" : "Shared artifacts will appear here.")}><Users size={18}/><span>{t.shared}</span><b>4</b></button>
        <button onClick={() => setToast(language === "zh" ? "暂无新动态" : "No new activity.")}><Bell size={18}/><span>{t.activity}</span><i/></button>
      </nav>
      <p className="nav-label spacer">{language === "zh" ? "收藏夹" : "FAVORITES"}</p>
      <nav>
        <button onClick={() => setToast(language === "zh" ? "客户项目已选中" : "Client work selected.")}><span className="dot dot-yellow"/><span>{language === "zh" ? "客户项目" : "Client work"}</span><b>6</b></button>
        <button onClick={() => setToast(language === "zh" ? "产品已选中" : "Product selected.")}><span className="dot dot-blue"/><span>{language === "zh" ? "产品" : "Product"}</span><b>3</b></button>
        <button onClick={() => setToast(language === "zh" ? "研究已选中" : "Research selected.")}><span className="dot dot-coral"/><span>{language === "zh" ? "研究" : "Research"}</span><b>3</b></button>
      </nav>
      <button className="add-collection" onClick={() => setToast(language === "zh" ? "收藏夹创建功能即将推出" : "Collections are coming soon.")}><Plus size={16}/>{language === "zh" ? "添加收藏夹" : "Add collection"}</button>
      <div className="profile"><span className="avatar">ES</span><div><strong>Ethan Shen</strong><small>{language === "zh" ? "免费版" : "Free plan"}</small></div><button aria-label="Profile menu"><ChevronDown size={15}/></button></div>
    </aside>

    <main className="workspace">
      <header className="topbar">
        <div className="crumb"><span>{t.all}</span><ChevronRight size={15}/><strong>{selected?.title ?? t.document}</strong></div>
        <div className="top-actions"><div className="language"><button className={language === "zh" ? "active" : ""} onClick={() => setLanguage("zh")}>中</button><span>/</span><button className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")}>EN</button></div><button className="icon-button" aria-label="Search" onClick={() => setToast(language === "zh" ? "搜索即将推出" : "Search is coming soon.")}><Search size={20}/></button><button className="icon-button" aria-label="Settings" onClick={() => setToast(language === "zh" ? "设置已准备好" : "Settings are ready.")}><Settings2 size={20}/></button><button className="help" aria-label="Help" onClick={() => setToast(language === "zh" ? "需要帮助？上传一个文件即可开始。" : "Need help? Upload a file to get started.")}><HelpCircle size={18}/></button></div>
      </header>
      <section className="page-head"><div><p className="eyebrow">{t.eyebrow}</p><h1>{t.title}</h1><p className="subhead">{t.subtitle}</p></div><button className="upload" onClick={() => setUploadOpen(true)}><Upload size={18}/>{t.upload}</button></section>
      <section className="stats"><div><small>{t.active}</small><strong>{artifacts.length}</strong><em>/ 3 {language === "zh" ? "免费" : "free"}</em></div><div><small>{t.pending}</small><strong>{artifacts.reduce((sum, item) => sum + item.comments, 0)}</strong><span className="up">↗ {language === "zh" ? "本周新增 3 条" : "3 new this week"}</span></div><div><small>{t.visits}</small><strong>{artifacts.reduce((sum, item) => sum + item.views, 0)}</strong><span className="up">↗ 18%</span></div><button onClick={() => setToast(language === "zh" ? "Pro 功能即将开放" : "Pro features are coming soon.")}>{t.unlock} ↗</button></section>
      <section className="filter-row"><div className="tabs"><button className="current">{t.all}<span>{artifacts.length}</span></button><button>{t.reviewing}<span>1</span></button><button>{t.drafts}<span>{artifacts.filter((item) => item.status === "DRAFT").length}</span></button><button>{t.approved}<span>1</span></button></div><button className="sort">{t.latest}<ChevronDown size={14}/></button></section>
      <section className="artifact-list">{artifacts.length === 0 ? <div className="empty-state"><p>{t.noArtifacts}</p><button className="upload" onClick={() => setUploadOpen(true)}><Upload size={16}/>{t.upload}</button></div> : artifacts.map((artifact) => <ArtifactRow key={artifact.id} artifact={artifact} selected={artifact.id === selected?.id} language={language} onSelect={() => setSelectedId(artifact.id)} />)}</section>
    </main>

    <aside className="review-pane">
      <header className="review-head"><div><p className="eyebrow">{language === "zh" ? "正在评审" : "IN REVIEW"}</p><h2>{selected?.title ?? t.document}</h2></div><button className="close" aria-label="Close review" onClick={() => setSelectedId(null)}><X size={20}/></button></header>
      <div className="review-actions"><button className="version">v{version}.0 <ChevronDown size={14}/></button><button onClick={() => setToast(language === "zh" ? "稳定链接已复制" : "Stable link copied.")}><Share2 size={15}/>{t.share}</button><button className="publish" onClick={() => { setVersion((current) => current + 1); setToast(language === "zh" ? "新版本已发布" : "New version published."); }}><Send size={15}/>{t.publish}</button></div>
      <div className="review-canvas"><article className="document"><div className="doc-top"><span className="doc-chip"><FileText size={14}/>{formatMeta(selected?.format ?? "MARKDOWN", language).toUpperCase()}</span><span>{selected?.age ?? ""}</span></div><p className="doc-kicker">{language === "zh" ? "北极星指标 / 2025 Q3" : "NORTH STAR / 2025 Q3"}</p><h3>{t.docTitle}</h3><p className="lede">{t.docLead}</p><div className="quote"><span>“</span><p>{language === "zh" ? "我们不再问如何让用户回来，而是问：什么值得他们再回来。" : "We no longer ask how to bring people back. We ask what is worth returning for."}</p></div><h4>{language === "zh" ? "流失背后的信号" : "Signals behind churn"}</h4><p>{language === "zh" ? "在过去 90 天中，第一个错失的关键时刻，比仪表盘所显示的更早到来。首次使用时未能获得明确成果，往往就是后来流失的开始。" : "Across the last 90 days, the first missed moment arrives earlier than the dashboard suggests. A missing early outcome often becomes the start of churn."}</p><div className="data-strip"><div><small>{language === "zh" ? "首周成果" : "WEEK-ONE OUTCOME"}</small><b>41%</b></div><div><small>{language === "zh" ? "再次访问" : "RETURN VISITS"}</small><b>2.4×</b></div></div></article>
        <aside className="annotation"><button className="add-note" onClick={() => setCommentOpen(true)}><Plus size={14}/>{t.addComment}</button><div className="thread-line"/><CommentCard initials="MC" name="Maya Chen" body={language === "zh" ? "这个切入点很有力。能否再具体说明等待的实际成本？" : "Strong framing. Can we make the cost of waiting more concrete?"}/><CommentCard initials="JR" name="Jordan Reid" body={language === "zh" ? "这里的客户引用很有效，或许可以把它移到更前面？" : "The customer quote is effective. Could it move earlier?"}/></aside>
      </div>
      <footer className="review-footer"><span>🔒 {language === "zh" ? "私密 · 已邀请 4 位评审者" : "Private · 4 reviewers invited"}</span><span>◷ {selected?.views ?? 0} {language === "zh" ? "次访问" : "views"}</span><span><Link size={12}/>{language === "zh" ? "稳定链接" : "Stable link"}</span></footer>
    </aside>

    {uploadOpen && <UploadDialog language={language} onClose={() => setUploadOpen(false)} onCreated={addArtifact}/>}
    {commentOpen && <div className="composer"><div><span className="avatar blue">ES</span><textarea autoFocus placeholder={language === "zh" ? "写下你的评论…" : "Write a comment…"}/></div><footer><span>{language === "zh" ? "评论会通知参与者" : "Participants will be notified"}</span><button onClick={() => { setCommentOpen(false); setToast(language === "zh" ? "评论已发送" : "Comment sent."); }}>{t.post}</button></footer></div>}
    {toast && <div className="toast"><Sparkles size={16}/>{toast}</div>}
  </>;
}

function ArtifactRow({ artifact, selected, language, onSelect }: { artifact: Artifact; selected: boolean; language: Language; onSelect: () => void }) {
  const icon = artifact.format === "HTML" ? <FileCode2 size={19}/> : <FileText size={19}/>;
  const tone = artifact.format === "HTML" ? "mint" : artifact.format === "PDF" ? "coral" : artifact.format === "MARKDOWN" ? "amber" : "slate";
  const status = artifact.status === "DRAFT" ? (language === "zh" ? "草稿" : "Draft") : artifact.status;
  return <div className={`artifact ${selected ? "selected" : ""}`}><button className="artifact-main" onClick={onSelect}><span className={`file-icon ${tone}`}>{icon}</span><span className="artifact-name"><strong>{artifact.title}</strong><small>{formatMeta(artifact.format, language)} · {relativeTime(artifact.updatedAt, language)}</small></span><span className="status draft">{status}</span><span className="people"><i>MC</i><i>JR</i><i>+2</i></span><span className="comment-count">{artifact.comments}</span></button><button className="more-button" aria-label="More options" onClick={() => onSelect()}><MoreHorizontal size={18}/></button></div>;
}

function CommentCard({ initials, name, body }: { initials: string; name: string; body: string }) {
  return <div className="comment-card"><span className={`avatar ${initials === "MC" ? "coral" : "blue"}`}>{initials}</span><div><strong>{name} <small>12m</small></strong><p>{body}</p><button>回复</button><button>解决</button></div></div>;
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
