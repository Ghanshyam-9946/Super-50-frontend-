import { useState, useEffect, useRef } from 'react';
import {
  FileText, Save, Download, Send, BookOpen, Award, Users as UsersIcon,
  ListChecks, FileSpreadsheet, Type, BookMarked, ScrollText, BookOpenCheck,
  Lightbulb, Quote, Plus, Trash2, AlertTriangle, CheckCircle2, Lock,
  Bold, Italic, Underline, List, ListOrdered, Heading1, Heading2,
  Heading3, Link2, Code, Strikethrough, Undo2, Redo2, AlignLeft,
  AlignCenter, ChevronLeft, ChevronRight,
  Image as ImageIcon, Upload, ChevronUp, ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { studentAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner, EmptyState, Modal, confirmAction } from '../../../components/pms/Common';
import { cn } from '../../../utils/pms/helpers';

// ===========  RICH HTML EDITOR (shared mini-component) ===========
const TbBtn = ({ onClick, icon: Icon, label, active }) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    title={label}
    className={cn('p-1.5 rounded hover:bg-slate-200 transition-colors', active && 'bg-brand-100 text-brand-700')}
  >
    <Icon className="w-3.5 h-3.5" />
  </button>
);

const RichEditor = ({ value, onChange, minHeight = '200px' }) => {
  const editorRef = useRef(null);
  const [, force] = useState(0);

  // Set initial content ONCE per instance
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== (value || '')) {
      editorRef.current.innerHTML = value || '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exec = (cmd, val = null) => {
    document.execCommand(cmd, false, val);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
    force((n) => n + 1);
  };

  const handleInput = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const handleLink = () => {
    const url = window.prompt('URL', 'https://');
    if (url) exec('createLink', url);
  };

  const isActive = (cmd) => { try { return document.queryCommandState(cmd); } catch { return false; } };

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 p-1.5 flex flex-wrap items-center gap-0.5">
        <TbBtn onClick={() => exec('undo')} icon={Undo2} label="Undo" />
        <TbBtn onClick={() => exec('redo')} icon={Redo2} label="Redo" />
        <div className="w-px h-4 bg-slate-300 mx-1" />
        <TbBtn onClick={() => exec('formatBlock', '<h1>')} icon={Heading1} label="H1" />
        <TbBtn onClick={() => exec('formatBlock', '<h2>')} icon={Heading2} label="H2" />
        <TbBtn onClick={() => exec('formatBlock', '<h3>')} icon={Heading3} label="H3" />
        <TbBtn onClick={() => exec('formatBlock', '<p>')} icon={Type} label="Paragraph" />
        <div className="w-px h-4 bg-slate-300 mx-1" />
        <TbBtn onClick={() => exec('bold')} icon={Bold} label="Bold" active={isActive('bold')} />
        <TbBtn onClick={() => exec('italic')} icon={Italic} label="Italic" active={isActive('italic')} />
        <TbBtn onClick={() => exec('underline')} icon={Underline} label="Underline" active={isActive('underline')} />
        <TbBtn onClick={() => exec('strikeThrough')} icon={Strikethrough} label="Strike" active={isActive('strikeThrough')} />
        <div className="w-px h-4 bg-slate-300 mx-1" />
        <TbBtn onClick={() => exec('insertUnorderedList')} icon={List} label="Bullet" active={isActive('insertUnorderedList')} />
        <TbBtn onClick={() => exec('insertOrderedList')} icon={ListOrdered} label="Numbered" active={isActive('insertOrderedList')} />
        <div className="w-px h-4 bg-slate-300 mx-1" />
        <TbBtn onClick={() => exec('justifyLeft')} icon={AlignLeft} label="Left" />
        <TbBtn onClick={() => exec('justifyCenter')} icon={AlignCenter} label="Center" />
        <TbBtn onClick={() => exec('formatBlock', '<blockquote>')} icon={Quote} label="Quote" />
        <TbBtn onClick={() => exec('formatBlock', '<pre>')} icon={Code} label="Code" />
        <TbBtn onClick={handleLink} icon={Link2} label="Link" />
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        suppressContentEditableWarning
        className="prose prose-sm prose-slate max-w-none p-3 focus:outline-none"
        style={{ minHeight, fontSize: '14px' }}
      />
    </div>
  );
};

// ===========  SECTIONS ===========
const SECTIONS = [
  { id: 'cover', label: 'Cover Page', icon: BookMarked },
  { id: 'certificate', label: 'Certificate', icon: Award },
  { id: 'acknowledgement', label: 'Acknowledgement', icon: Quote },
  { id: 'abstract', label: 'Abstract', icon: BookOpen },
  { id: 'abbreviations', label: 'List of Abbreviations', icon: ListChecks },
  { id: 'figures', label: 'List of Figures', icon: FileSpreadsheet },
  { id: 'tables', label: 'List of Tables', icon: FileSpreadsheet },
  { id: 'chapters', label: 'Chapters', icon: BookOpenCheck },
  { id: 'references', label: 'References', icon: ScrollText },
  { id: 'summary', label: 'Project Summary', icon: Lightbulb },
  { id: 'glossary', label: 'Glossary (Appendix)', icon: BookOpen },
];

// ===========  MAIN PAGE ===========
const ProjectReport = () => {
  const [team, setTeam] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('cover');
  const [dirty, setDirty] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await studentAPI.getReport();
      setTeam(res.data.team);
      setReport(res.data.report);
      setDirty(false);
    } catch (err) { toast.error(handleError(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // Update helpers
  const updateField = (path, value) => {
    setReport((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const parts = path.split('.');
      let cur = next;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!cur[parts[i]]) cur[parts[i]] = {};
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = value;
      return next;
    });
    setDirty(true);
  };

  const handleSave = async () => {
    if (!report) return;
    setSaving(true);
    try {
      // Send all editable sections
      const payload = {
        coverPage: report.coverPage,
        certificate: report.certificate,
        acknowledgement: report.acknowledgement,
        abstract: report.abstract,
        abbreviations: report.abbreviations,
        figures: report.figures,
        tables: report.tables,
        chapters: report.chapters,
        references: report.references,
        projectSummary: report.projectSummary,
        glossary: report.glossary,
      };
      await studentAPI.updateReport(payload);
      toast.success('Report saved');
      setDirty(false);
    } catch (err) { toast.error(handleError(err)); }
    finally { setSaving(false); }
  };

  const handleSubmit = async () => {
    if (dirty) {
      if (!window.confirm('You have unsaved changes. Save first?')) return;
      await handleSave();
    }
    if (!confirmAction('Submit your final report? You can still edit later unless admin locks the team.')) return;
    try {
      await studentAPI.submitReport();
      toast.success('Report submitted! Guide has been notified.');
      fetchData();
    } catch (err) { toast.error(handleError(err)); }
  };

  if (loading) return <div className="py-20 flex justify-center"><Spinner size="lg" /></div>;

  if (!team) {
    return (
      <Card>
        <EmptyState
          icon={AlertTriangle}
          title="Form a team first"
          message="You need to be in a team before you can write the project report."
        />
      </Card>
    );
  }

  if (team.isLocked) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Project Report</h1>
        </div>
        <div className="alert-warning">
          <Lock className="w-5 h-5 flex-shrink-0" />
          <div>
            <strong>Team is locked by admin.</strong> You cannot edit the report. Contact your admin to unlock.
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return <div className="py-20 flex justify-center"><Spinner size="lg" /></div>;
  }

  const currentIdx = SECTIONS.findIndex((s) => s.id === activeSection);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Project Report</h1>
          <p className="text-sm text-slate-500 mt-1">Edit all sections following SISTec format. Download as Word document anytime.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <a
            href={studentAPI.reportDownloadUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-outline"
            onClick={(e) => {
              if (dirty && !window.confirm('You have unsaved changes. Download anyway? (only saved content will be exported)')) {
                e.preventDefault();
              }
            }}
          >
            <Download className="w-4 h-4" /> Download DOCX
          </a>
          <button onClick={handleSave} disabled={saving || !dirty} className="btn-primary">
            {saving ? <Spinner size="sm" className="text-white" /> : <><Save className="w-4 h-4" /> {dirty ? 'Save Changes' : 'Saved'}</>}
          </button>
          {!report.isSubmitted && (
            <button onClick={handleSubmit} className="btn-success">
              <Send className="w-4 h-4" /> Submit Final
            </button>
          )}
        </div>
      </div>

      {report.isSubmitted && (
        <div className="alert-success text-sm">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span><strong>Report submitted</strong> on {new Date(report.submittedAt).toLocaleDateString()}. You can still edit until admin locks the team.</span>
        </div>
      )}

      {dirty && (
        <div className="alert-warning text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>You have unsaved changes. Click "Save Changes" before closing this page.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Sidebar nav */}
        <div className="lg:col-span-1">
          <Card noPadding>
            <div className="py-2">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                const active = activeSection === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={cn(
                      'w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-slate-50 border-l-2',
                      active ? 'bg-brand-50 border-brand-500 text-brand-700 font-semibold' : 'border-transparent text-slate-700'
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Section editor */}
        <div className="lg:col-span-3">
          <Card title={<span className="flex items-center gap-2">{(() => { const Icon = SECTIONS[currentIdx]?.icon; return Icon ? <Icon className="w-5 h-5 text-brand-600" /> : null; })()}{SECTIONS[currentIdx]?.label}</span>}>
            {activeSection === 'cover' && <CoverPageEditor report={report} update={updateField} />}
            {activeSection === 'certificate' && <RichSectionEditor value={report.certificate?.content} onChange={(v) => updateField('certificate.content', v)} hint="The certificate page declares this is the team's own work." />}
            {activeSection === 'acknowledgement' && <RichSectionEditor value={report.acknowledgement?.content} onChange={(v) => updateField('acknowledgement.content', v)} hint="Thank guide, HOD, principal, and others." />}
            {activeSection === 'abstract' && <RichSectionEditor value={report.abstract?.content} onChange={(v) => updateField('abstract.content', v)} hint="150-250 word summary of your project." minHeight="250px" />}
            {activeSection === 'abbreviations' && <AbbreviationsEditor items={report.abbreviations || []} onChange={(v) => updateField('abbreviations', v)} />}
            {activeSection === 'figures' && <FigTableEditor items={report.figures || []} onChange={(v) => updateField('figures', v)} label="Figure" />}
            {activeSection === 'tables' && <FigTableEditor items={report.tables || []} onChange={(v) => updateField('tables', v)} label="Table" />}
            {activeSection === 'chapters' && <ChaptersEditor chapters={report.chapters || []} onChange={(v) => updateField('chapters', v)} />}
            {activeSection === 'references' && <ReferencesEditor items={report.references || []} onChange={(v) => updateField('references', v)} />}
            {activeSection === 'summary' && <ProjectSummaryEditor summary={report.projectSummary || {}} update={updateField} />}
            {activeSection === 'glossary' && <RichSectionEditor value={report.glossary} onChange={(v) => updateField('glossary', v)} hint="Optional glossary of terms used in your report." />}

            {/* Section navigation */}
            <div className="flex justify-between items-center mt-5 pt-4 border-t border-slate-100">
              <button
                onClick={() => setActiveSection(SECTIONS[Math.max(0, currentIdx - 1)].id)}
                disabled={currentIdx === 0}
                className="btn-secondary btn-sm"
              >
                <ChevronLeft className="w-3 h-3" /> Previous
              </button>
              <div className="text-xs text-slate-500">Section {currentIdx + 1} of {SECTIONS.length}</div>
              <button
                onClick={() => setActiveSection(SECTIONS[Math.min(SECTIONS.length - 1, currentIdx + 1)].id)}
                disabled={currentIdx === SECTIONS.length - 1}
                className="btn-secondary btn-sm"
              >
                Next <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// =========== SUB-EDITORS ===========

const RichSectionEditor = ({ value, onChange, hint, minHeight }) => (
  <div>
    {hint && <p className="text-xs text-slate-500 mb-2">{hint}</p>}
    <RichEditor value={value || ''} onChange={onChange} minHeight={minHeight} key={value === undefined ? 'empty' : 'ready'} />
  </div>
);

const CoverPageEditor = ({ report, update }) => {
  const cp = report.coverPage || {};
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="md:col-span-2">
        <label className="form-label">Project Title</label>
        <input className="form-input" value={cp.projectTitle || ''} onChange={(e) => update('coverPage.projectTitle', e.target.value)} />
      </div>
      <div>
        <label className="form-label">Project Type</label>
        <select className="form-select" value={cp.projectType || ''} onChange={(e) => update('coverPage.projectType', e.target.value)}>
          <option value="">Select</option>
          <option value="MINOR PROJECT-I REPORT">MINOR PROJECT-I REPORT</option>
          <option value="MINOR PROJECT-II REPORT">MINOR PROJECT-II REPORT</option>
          <option value="MAJOR PROJECT-I REPORT">MAJOR PROJECT-I REPORT</option>
          <option value="MAJOR PROJECT-II REPORT">MAJOR PROJECT-II REPORT</option>
        </select>
      </div>
      <div>
        <label className="form-label">Group No</label>
        <input className="form-input" value={cp.groupNo || ''} onChange={(e) => update('coverPage.groupNo', e.target.value)} />
      </div>
      <div>
        <label className="form-label">Degree</label>
        <input className="form-input" value={cp.degree || 'BACHELOR OF TECHNOLOGY'} onChange={(e) => update('coverPage.degree', e.target.value)} />
      </div>
      <div>
        <label className="form-label">Branch</label>
        <input className="form-input" value={cp.branch || 'COMPUTER SCIENCE & ENGINEERING'} onChange={(e) => update('coverPage.branch', e.target.value)} />
      </div>
      <div>
        <label className="form-label">Guide Name</label>
        <input className="form-input" value={cp.guideName || ''} onChange={(e) => update('coverPage.guideName', e.target.value)} />
      </div>
      <div>
        <label className="form-label">Guide Designation</label>
        <input className="form-input" value={cp.guideDesignation || ''} onChange={(e) => update('coverPage.guideDesignation', e.target.value)} placeholder="e.g. Associate Professor" />
      </div>
      <div>
        <label className="form-label">Month & Year</label>
        <input className="form-input" value={cp.monthYear || ''} onChange={(e) => update('coverPage.monthYear', e.target.value)} placeholder="e.g. June 2026" />
      </div>
      <div>
        <label className="form-label">Session</label>
        <input className="form-input" value={cp.session || ''} onChange={(e) => update('coverPage.session', e.target.value)} placeholder="e.g. Jul-2025 to Dec-2025" />
      </div>
    </div>
  );
};

const AbbreviationsEditor = ({ items, onChange }) => {
  const add = () => onChange([...items, { abbr: '', description: '' }]);
  const remove = (idx) => onChange(items.filter((_, i) => i !== idx));
  const update = (idx, field, value) => onChange(items.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  return (
    <div>
      <p className="text-xs text-slate-500 mb-3">Add abbreviations used in your report (e.g., SDLC = Software Development Life Cycle).</p>
      <div className="space-y-2">
        {items.map((it, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-2 items-center">
            <input className="form-input col-span-3" placeholder="Abbreviation" value={it.abbr} onChange={(e) => update(idx, 'abbr', e.target.value)} />
            <input className="form-input col-span-8" placeholder="Description" value={it.description} onChange={(e) => update(idx, 'description', e.target.value)} />
            <button type="button" onClick={() => remove(idx)} className="col-span-1 text-slate-400 hover:text-red-600">
              <Trash2 className="w-4 h-4 mx-auto" />
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={add} className="btn-outline btn-sm mt-3">
        <Plus className="w-3 h-3" /> Add Row
      </button>
    </div>
  );
};

const FigTableEditor = ({ items, onChange, label }) => {
  const add = () => onChange([...items, { number: '', title: '', pageNo: '' }]);
  const remove = (idx) => onChange(items.filter((_, i) => i !== idx));
  const update = (idx, field, value) => onChange(items.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  return (
    <div>
      <p className="text-xs text-slate-500 mb-3">Add {label.toLowerCase()}s used in your report.</p>
      <div className="space-y-2">
        {items.map((it, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-2 items-center">
            <input className="form-input col-span-2" placeholder={`${label} No`} value={it.number} onChange={(e) => update(idx, 'number', e.target.value)} />
            <input className="form-input col-span-7" placeholder="Title" value={it.title} onChange={(e) => update(idx, 'title', e.target.value)} />
            <input className="form-input col-span-2" placeholder="Page" value={it.pageNo} onChange={(e) => update(idx, 'pageNo', e.target.value)} />
            <button type="button" onClick={() => remove(idx)} className="col-span-1 text-slate-400 hover:text-red-600">
              <Trash2 className="w-4 h-4 mx-auto" />
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={add} className="btn-outline btn-sm mt-3">
        <Plus className="w-3 h-3" /> Add {label}
      </button>
    </div>
  );
};

const ChaptersEditor = ({ chapters, onChange }) => {
  const [activeIdx, setActiveIdx] = useState(0);

  const updateChapter = (idx, field, value) => {
    onChange(chapters.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };

  const addChapter = () => {
    const num = chapters.length + 1;
    onChange([...chapters, { number: num, title: `Chapter ${num}`, content: '<p></p>', screens: [] }]);
    setActiveIdx(chapters.length);
  };

  const removeChapter = (idx) => {
    if (!confirmAction(`Delete chapter "${chapters[idx].title}"? This cannot be undone.`)) return;
    onChange(chapters.filter((_, i) => i !== idx));
    if (activeIdx >= idx) setActiveIdx(Math.max(0, activeIdx - 1));
  };

  // 🆕 Screens management
  const updateScreens = (chapterIdx, newScreens) => {
    onChange(chapters.map((c, i) => i === chapterIdx ? { ...c, screens: newScreens } : c));
  };

  const active = chapters[activeIdx];
  const screens = active?.screens || [];

  return (
    <div>
      <p className="text-xs text-slate-500 mb-3">Edit each chapter individually. Add screens with images for "Project Screens"-style chapters.</p>

      {/* Chapter tabs */}
      <div className="flex flex-wrap gap-1 mb-4 pb-3 border-b border-slate-100">
        {chapters.map((ch, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActiveIdx(idx)}
            className={cn(
              'text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1',
              activeIdx === idx ? 'bg-brand-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            )}
            title={ch.title}
          >
            Ch {ch.number}
            {ch.screens?.length > 0 && (
              <span className={cn(
                'text-[9px] px-1 rounded',
                activeIdx === idx ? 'bg-white/30' : 'bg-brand-200 text-brand-700'
              )}>
                {ch.screens.length}📷
              </span>
            )}
          </button>
        ))}
        <button
          type="button"
          onClick={addChapter}
          className="text-xs px-3 py-1.5 rounded-lg font-medium bg-emerald-100 hover:bg-emerald-200 text-emerald-700 flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Add Chapter
        </button>
      </div>

      {active && (
        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-2">
              <label className="form-label">Number</label>
              <input
                type="number"
                className="form-input"
                value={active.number}
                onChange={(e) => updateChapter(activeIdx, 'number', Number(e.target.value))}
              />
            </div>
            <div className="col-span-9">
              <label className="form-label">Title</label>
              <input
                className="form-input"
                value={active.title}
                onChange={(e) => updateChapter(activeIdx, 'title', e.target.value)}
                placeholder="e.g. Introduction"
              />
            </div>
            <div className="col-span-1 flex items-end">
              <button
                type="button"
                onClick={() => removeChapter(activeIdx)}
                className="btn-secondary text-red-600 w-full"
                title="Delete chapter"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="form-label">Content (text before screens)</label>
            <RichEditor
              key={`ch-${activeIdx}`}
              value={active.content}
              onChange={(v) => updateChapter(activeIdx, 'content', v)}
              minHeight="250px"
            />
          </div>

          {/* 🆕 SCREENS SECTION */}
          <ScreensEditor
            screens={screens}
            onChange={(newScreens) => updateScreens(activeIdx, newScreens)}
            chapterTitle={active.title}
          />
        </div>
      )}
    </div>
  );
};

// 🆕 SCREENS EDITOR - allows multiple screens per chapter with image uploads
const ScreensEditor = ({ screens, onChange, chapterTitle }) => {
  const addScreen = () => {
    onChange([...screens, {
      title: `Screen ${screens.length + 1}`,
      description: '<p></p>',
      imageData: '',
      imageMimeType: '',
      imageFileName: '',
    }]);
  };

  const updateScreen = (idx, field, value) => {
    onChange(screens.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const removeScreen = (idx) => {
    if (!confirmAction(`Delete this screen?`)) return;
    onChange(screens.filter((_, i) => i !== idx));
  };

  const moveUp = (idx) => {
    if (idx === 0) return;
    const next = [...screens];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onChange(next);
  };

  const moveDown = (idx) => {
    if (idx === screens.length - 1) return;
    const next = [...screens];
    [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
    onChange(next);
  };

  const handleImageUpload = (idx, file) => {
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, etc.)');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large (max 5MB). Please resize and try again.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      // reader.result is a data URL: "data:image/png;base64,..."
      onChange(screens.map((s, i) => i === idx ? {
        ...s,
        imageData: reader.result,
        imageMimeType: file.type,
        imageFileName: file.name,
      } : s));
      toast.success(`Image uploaded for ${screens[idx].title || 'screen'}`);
    };
    reader.onerror = () => toast.error('Could not read image file');
    reader.readAsDataURL(file);
  };

  const removeImage = (idx) => {
    if (!confirmAction('Remove image?')) return;
    onChange(screens.map((s, i) => i === idx ? {
      ...s, imageData: '', imageMimeType: '', imageFileName: '',
    } : s));
  };

  return (
    <div className="border border-dashed border-brand-200 bg-brand-50/30 rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <h6 className="font-semibold text-sm text-brand-700 flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          Screens ({screens.length})
        </h6>
        <button
          type="button"
          onClick={addScreen}
          className="btn-primary btn-sm"
        >
          <Plus className="w-3 h-3" /> Add Screen
        </button>
      </div>

      {screens.length === 0 && (
        <div className="text-center py-6 text-sm text-slate-500">
          <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No screens added yet.</p>
          <p className="text-xs mt-1">Click "Add Screen" to add screenshots with title + description.</p>
          <p className="text-xs text-slate-400 mt-2">Best for the "Project Screens" chapter to show your app UI.</p>
        </div>
      )}

      <div className="space-y-4">
        {screens.map((sc, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase">Screen {idx + 1}</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => moveUp(idx)}
                  disabled={idx === 0}
                  className="text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed p-1"
                  title="Move up"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(idx)}
                  disabled={idx === screens.length - 1}
                  className="text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed p-1"
                  title="Move down"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => removeScreen(idx)}
                  className="text-slate-400 hover:text-red-600 p-1"
                  title="Delete screen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="form-label">Screen Title</label>
              <input
                className="form-input"
                value={sc.title || ''}
                onChange={(e) => updateScreen(idx, 'title', e.target.value)}
                placeholder="e.g. Login Screen, Dashboard, Settings Page"
              />
            </div>

            <div>
              <label className="form-label">Image</label>
              {sc.imageData ? (
                <div className="relative inline-block max-w-full">
                  <img
                    src={sc.imageData}
                    alt={sc.title}
                    className="max-w-full max-h-64 rounded border border-slate-200"
                  />
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <span className="truncate flex-1">{sc.imageFileName || 'image'}</span>
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-colors">
                  <div className="text-center">
                    <Upload className="w-6 h-6 mx-auto text-slate-400 mb-1" />
                    <span className="text-xs text-slate-500">Click to upload image (max 5MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(idx, e.target.files[0])}
                    />
                  </div>
                </label>
              )}
            </div>

            <div>
              <label className="form-label">Description</label>
              <RichEditor
                key={`sc-${idx}-${sc.imageFileName || 'empty'}`}
                value={sc.description}
                onChange={(v) => updateScreen(idx, 'description', v)}
                minHeight="100px"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ReferencesEditor = ({ items, onChange }) => {
  const add = () => onChange([...items, { type: 'other', citation: '' }]);
  const remove = (idx) => onChange(items.filter((_, i) => i !== idx));
  const update = (idx, field, value) => onChange(items.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  return (
    <div>
      <p className="text-xs text-slate-500 mb-3">Add references (journals, books, websites). They'll appear in order.</p>
      <div className="space-y-2">
        {items.map((it, idx) => (
          <div key={idx} className="flex gap-2 items-start">
            <span className="text-sm font-semibold text-slate-500 pt-2">[{idx + 1}]</span>
            <select className="form-select w-32 text-xs" value={it.type} onChange={(e) => update(idx, 'type', e.target.value)}>
              <option value="journal">Journal</option>
              <option value="book">Book</option>
              <option value="website">Website</option>
              <option value="other">Other</option>
            </select>
            <textarea
              className="form-input flex-1 text-sm"
              rows="2"
              placeholder="Citation text..."
              value={it.citation}
              onChange={(e) => update(idx, 'citation', e.target.value)}
            />
            <button type="button" onClick={() => remove(idx)} className="text-slate-400 hover:text-red-600 pt-2">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={add} className="btn-outline btn-sm mt-3">
        <Plus className="w-3 h-3" /> Add Reference
      </button>
    </div>
  );
};

const ProjectSummaryEditor = ({ summary, update }) => {
  const Field = ({ label, k, type = 'text', placeholder = '' }) => (
    <div>
      <label className="form-label">{label}</label>
      {type === 'textarea'
        ? <textarea className="form-input" rows="2" value={summary[k] || ''} onChange={(e) => update(`projectSummary.${k}`, e.target.value)} placeholder={placeholder} />
        : <input className="form-input" value={summary[k] || ''} onChange={(e) => update(`projectSummary.${k}`, e.target.value)} placeholder={placeholder} />}
    </div>
  );
  return (
    <div className="space-y-5">
      <div>
        <h6 className="font-semibold text-sm mb-3 text-slate-700">Basics</h6>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Title of the project" k="titleOfProject" />
          <Field label="Semester" k="semester" />
          <Field label="Members" k="members" type="textarea" />
          <Field label="Team Leader" k="teamLeader" />
          <Field label="Role of every member" k="memberRoles" type="textarea" />
          <Field label="Motivation for project" k="motivation" type="textarea" />
          <Field label="Project Type (Desktop/Web/Mobile)" k="projectType" />
        </div>
      </div>

      <div>
        <h6 className="font-semibold text-sm mb-3 text-slate-700">Tools & Technologies</h6>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Programming language used" k="programmingLanguage" />
          <Field label="Compiler used (with version)" k="compiler" />
          <Field label="IDE used (with version)" k="ide" />
          <Field label="Front End Technologies" k="frontendTech" placeholder="React 18, Tailwind 3..." />
          <Field label="Back End Technologies" k="backendTech" placeholder="Node 18, Express 4..." />
          <Field label="Database (with version)" k="database" />
        </div>
      </div>

      <div>
        <h6 className="font-semibold text-sm mb-3 text-slate-700">Software Design & Coding</h6>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Prototype developed?" k="prototypeDeveloped" />
          <Field label="SDLC model followed" k="sdlcModel" placeholder="Agile / Waterfall / Spiral..." />
          <Field label="Why this SDLC model?" k="sdlcReason" type="textarea" />
          <Field label="Justify SDLC model in project" k="sdlcJustification" type="textarea" />
          <Field label="Design approach (Functional/OO)" k="designApproach" />
          <Field label="Diagrams developed" k="diagramsDeveloped" type="textarea" />
          <Field label="OOPS principles covered" k="oopsPrinciples" type="textarea" />
          <Field label="Number of Tiers (e.g. 3-tier)" k="numberOfTiers" />
        </div>
      </div>
    </div>
  );
};

export default ProjectReport;
