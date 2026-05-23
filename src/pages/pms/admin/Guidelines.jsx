import { useState, useEffect, useRef } from 'react';
import {
  BookOpen, Save, Eye, RotateCcw, Info, Bold, Italic, Underline,
  List, ListOrdered, Heading1, Heading2, Heading3, Link2, Code,
  AlignLeft, AlignCenter, AlignRight, Image as ImageIcon, Quote,
  Strikethrough, Type, Undo2, Redo2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner } from '../../../components/pms/Common';
import { cn } from '../../../utils/pms/helpers';

// =============== TOOLBAR BUTTON ===============
const TbBtn = ({ onClick, icon: Icon, label, active, disabled }) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()} // prevent losing focus
    onClick={onClick}
    title={label}
    disabled={disabled}
    className={cn(
      'p-1.5 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors',
      active && 'bg-brand-100 text-brand-700'
    )}
  >
    <Icon className="w-4 h-4" />
  </button>
);

// =============== RICH HTML EDITOR ===============
const RichEditor = ({ value, onChange }) => {
  const editorRef = useRef(null);
  const [, force] = useState(0); // re-render trigger for toolbar state

  // Set initial content once (avoid React fighting contentEditable)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper: run document.execCommand
  const exec = (command, val = null) => {
    document.execCommand(command, false, val);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      editorRef.current.focus();
      force((n) => n + 1);
    }
  };

  const handleInput = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const handleLink = () => {
    const url = window.prompt('Enter URL (include https://)', 'https://');
    if (url) exec('createLink', url);
  };

  const handleImage = () => {
    const url = window.prompt('Image URL', 'https://');
    if (url) exec('insertImage', url);
  };

  const handleHeading = (level) => {
    exec('formatBlock', `<h${level}>`);
  };

  const handleParagraph = () => {
    exec('formatBlock', '<p>');
  };

  // Detect current state for active toolbar highlighting
  const isActive = (cmd) => {
    try { return document.queryCommandState(cmd); } catch { return false; }
  };

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-slate-50 border-b border-slate-200 p-2 flex flex-wrap items-center gap-0.5">
        {/* History */}
        <TbBtn onClick={() => exec('undo')} icon={Undo2} label="Undo (Ctrl+Z)" />
        <TbBtn onClick={() => exec('redo')} icon={Redo2} label="Redo (Ctrl+Y)" />
        <div className="w-px h-5 bg-slate-300 mx-1" />

        {/* Headings */}
        <TbBtn onClick={() => handleHeading(1)} icon={Heading1} label="Heading 1" />
        <TbBtn onClick={() => handleHeading(2)} icon={Heading2} label="Heading 2" />
        <TbBtn onClick={() => handleHeading(3)} icon={Heading3} label="Heading 3" />
        <TbBtn onClick={handleParagraph} icon={Type} label="Paragraph" />
        <div className="w-px h-5 bg-slate-300 mx-1" />

        {/* Formatting */}
        <TbBtn onClick={() => exec('bold')} icon={Bold} label="Bold (Ctrl+B)" active={isActive('bold')} />
        <TbBtn onClick={() => exec('italic')} icon={Italic} label="Italic (Ctrl+I)" active={isActive('italic')} />
        <TbBtn onClick={() => exec('underline')} icon={Underline} label="Underline" active={isActive('underline')} />
        <TbBtn onClick={() => exec('strikeThrough')} icon={Strikethrough} label="Strikethrough" active={isActive('strikeThrough')} />
        <div className="w-px h-5 bg-slate-300 mx-1" />

        {/* Lists */}
        <TbBtn onClick={() => exec('insertUnorderedList')} icon={List} label="Bullet list" active={isActive('insertUnorderedList')} />
        <TbBtn onClick={() => exec('insertOrderedList')} icon={ListOrdered} label="Numbered list" active={isActive('insertOrderedList')} />
        <div className="w-px h-5 bg-slate-300 mx-1" />

        {/* Alignment */}
        <TbBtn onClick={() => exec('justifyLeft')} icon={AlignLeft} label="Left" active={isActive('justifyLeft')} />
        <TbBtn onClick={() => exec('justifyCenter')} icon={AlignCenter} label="Center" active={isActive('justifyCenter')} />
        <TbBtn onClick={() => exec('justifyRight')} icon={AlignRight} label="Right" active={isActive('justifyRight')} />
        <div className="w-px h-5 bg-slate-300 mx-1" />

        {/* Insert */}
        <TbBtn onClick={() => exec('formatBlock', '<blockquote>')} icon={Quote} label="Blockquote" />
        <TbBtn onClick={() => exec('formatBlock', '<pre>')} icon={Code} label="Code block" />
        <TbBtn onClick={handleLink} icon={Link2} label="Insert link" />
        <TbBtn onClick={handleImage} icon={ImageIcon} label="Insert image" />
        <div className="w-px h-5 bg-slate-300 mx-1" />

        {/* Clear formatting */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec('removeFormat')}
          className="text-xs px-2 py-1 rounded hover:bg-slate-200"
          title="Clear formatting"
        >
          Clear
        </button>
      </div>

      {/* Editor area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyUp={() => force((n) => n + 1)} // update toolbar state
        onMouseUp={() => force((n) => n + 1)}
        suppressContentEditableWarning
        className="prose prose-slate max-w-none p-4 min-h-[450px] focus:outline-none focus:ring-2 focus:ring-brand-200 focus:ring-inset"
        style={{ fontSize: '14px' }}
      />
    </div>
  );
};

// =============== MAIN PAGE ===============
const Guidelines = () => {
  const [guidelines, setGuidelines] = useState('');
  const [original, setOriginal] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    adminAPI.getGuidelines()
      .then((res) => {
        const text = res.data.guidelines || '';
        // Migrate plain text / markdown-ish content to <p> tags if needed
        const html = /<[a-z][\s\S]*>/i.test(text) ? text : autoMigrate(text);
        setGuidelines(html);
        setOriginal(html);
      })
      .catch((err) => toast.error(handleError(err)))
      .finally(() => setLoading(false));
  }, []);

  // Auto-convert old markdown-ish content to basic HTML
  const autoMigrate = (text) => {
    if (!text) return '';
    return text.split('\n').map((line) => {
      const t = line.trim();
      if (!t) return '<p><br></p>';
      if (t.startsWith('# ')) return `<h1>${t.slice(2)}</h1>`;
      if (t.startsWith('## ')) return `<h2>${t.slice(3)}</h2>`;
      if (t.startsWith('### ')) return `<h3>${t.slice(4)}</h3>`;
      if (t.startsWith('- ')) return `<li>${t.slice(2)}</li>`;
      return `<p>${t}</p>`;
    }).join('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminAPI.updateGuidelines(guidelines);
      setOriginal(guidelines);
      toast.success('Guidelines saved');
    } catch (err) { toast.error(handleError(err)); }
    finally { setSubmitting(false); }
  };

  const resetChanges = () => {
    if (!window.confirm('Discard unsaved changes?')) return;
    setGuidelines(original);
    toast.success('Changes reverted');
    // Force re-render of RichEditor by remounting
    setLoading(true);
    setTimeout(() => setLoading(false), 50);
  };

  const isDirty = guidelines !== original;

  if (loading) return <div className="py-20 flex justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Student Guidelines</h1>
          <p className="text-sm text-slate-500 mt-1">Edit guidelines using a rich HTML editor. Format with headings, lists, links, images and more.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPreview(!preview)} className="btn-outline">
            <Eye className="w-4 h-4" /> {preview ? 'Edit' : 'Preview'}
          </button>
          {isDirty && (
            <button onClick={resetChanges} className="btn-secondary">
              <RotateCcw className="w-4 h-4" /> Revert
            </button>
          )}
        </div>
      </div>

      <div className="alert-info text-sm">
        <Info className="w-4 h-4 flex-shrink-0" />
        <span>Use the toolbar buttons to format text. Students will see this content rendered with all your formatting.</span>
      </div>

      <form onSubmit={handleSubmit}>
        <Card title={preview ? 'Preview (How students see it)' : 'Edit Content'} icon={BookOpen} noPadding>
          {preview ? (
            <div
              className="prose prose-slate max-w-none p-6 min-h-[450px]"
              dangerouslySetInnerHTML={{ __html: guidelines || '<p class="text-slate-400 italic">No content yet</p>' }}
            />
          ) : (
            <div className="p-4">
              <RichEditor value={guidelines} onChange={setGuidelines} />
            </div>
          )}

          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              {(guidelines || '').replace(/<[^>]*>/g, '').length.toLocaleString()} characters
              {isDirty && <span className="ml-2 text-amber-600">· Unsaved changes</span>}
            </div>
            <button type="submit" disabled={submitting || !isDirty} className="btn-primary">
              {submitting ? <Spinner size="sm" className="text-white" /> : <><Save className="w-4 h-4" /> Save Guidelines</>}
            </button>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default Guidelines;
