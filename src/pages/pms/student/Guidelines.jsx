import { useState, useEffect } from 'react';
import { BookOpen, Inbox, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { studentAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner, EmptyState } from '../../../components/pms/Common';

const StudentGuidelines = () => {
  const [guidelines, setGuidelines] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentAPI.getGuidelines()
      .then((res) => setGuidelines(res.data.guidelines || ''))
      .catch((err) => toast.error(handleError(err)))
      .finally(() => setLoading(false));
  }, []);

  // If content has no HTML tags (legacy markdown-ish), auto-convert basic line breaks
  const renderContent = () => {
    if (!guidelines) return null;
    const hasHtml = /<[a-z][\s\S]*>/i.test(guidelines);
    if (hasHtml) {
      return <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: guidelines }} />;
    }
    // Fallback: simple markdown-ish render for legacy content
    const lines = guidelines.split('\n');
    const out = [];
    let listBuffer = [];
    const flushList = () => {
      if (listBuffer.length) {
        out.push(<ul key={out.length} className="list-disc pl-6 space-y-1.5 mb-4">{listBuffer.map((li, i) => <li key={i} className="text-sm text-slate-700">{li}</li>)}</ul>);
        listBuffer = [];
      }
    };
    lines.forEach((line, idx) => {
      if (/^# /.test(line)) { flushList(); out.push(<h1 key={idx} className="text-2xl font-bold mt-5 mb-3 text-brand-800 border-b border-brand-100 pb-2">{line.slice(2)}</h1>); }
      else if (/^## /.test(line)) { flushList(); out.push(<h2 key={idx} className="text-lg font-bold mt-4 mb-2 text-brand-700">{line.slice(3)}</h2>); }
      else if (/^### /.test(line)) { flushList(); out.push(<h3 key={idx} className="text-base font-semibold mt-3 mb-1.5 text-slate-800">{line.slice(4)}</h3>); }
      else if (/^- /.test(line)) { listBuffer.push(line.slice(2)); }
      else if (line.trim() === '') { flushList(); out.push(<div key={idx} className="h-2" />); }
      else { flushList(); out.push(<p key={idx} className="text-sm leading-relaxed mb-2 text-slate-700">{line}</p>); }
    });
    flushList();
    return <div className="prose prose-slate max-w-none">{out}</div>;
  };

  const handlePrint = () => window.print();

  if (loading) return <div className="py-20 flex justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Project Guidelines</h1>
          <p className="text-sm text-slate-500 mt-1">Official guidelines for preparing your project report and presentations.</p>
        </div>
        {guidelines && (
          <button onClick={handlePrint} className="btn-outline btn-sm">
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
        )}
      </div>

      <Card title="Guidelines" icon={BookOpen}>
        {!guidelines ? (
          <EmptyState icon={Inbox} title="No guidelines available" message="Your administrator hasn't published guidelines yet." />
        ) : (
          renderContent()
        )}
      </Card>
    </div>
  );
};

export default StudentGuidelines;
