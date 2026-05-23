import { useState, useEffect } from 'react';
import { Download, FileText, Inbox, FolderOpen, FileSpreadsheet, Presentation } from 'lucide-react';
import toast from 'react-hot-toast';
import { studentAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner, EmptyState } from '../../../components/pms/Common';
import { formatDate } from '../../../utils/pms/helpers';

const formatBytes = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const categoryIcon = (cat) => {
  if (cat?.includes('Report')) return FileText;
  if (cat?.includes('PPT')) return Presentation;
  if (cat?.includes('Synopsis')) return FileSpreadsheet;
  return FolderOpen;
};

const categoryColor = (cat) => {
  if (cat?.includes('Report')) return 'bg-blue-100 text-blue-700';
  if (cat?.includes('PPT')) return 'bg-orange-100 text-orange-700';
  if (cat?.includes('Synopsis')) return 'bg-purple-100 text-purple-700';
  return 'bg-slate-100 text-slate-700';
};

const StudentResources = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentAPI.listTemplates()
      .then((res) => setTemplates(res.data.templates))
      .catch((err) => toast.error(handleError(err)))
      .finally(() => setLoading(false));
  }, []);

  // Group by category
  const grouped = templates.reduce((acc, t) => {
    const key = t.category || 'Other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  if (loading) return <div className="py-20 flex justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Resources & Templates</h1>
        <p className="text-sm text-slate-500 mt-1">Download official report formats, PPT templates, and other resources from your admin.</p>
      </div>

      {templates.length === 0 ? (
        <Card>
          <EmptyState
            icon={Inbox}
            title="No resources yet"
            message="Your admin hasn't uploaded any templates. Check back later."
          />
        </Card>
      ) : (
        Object.entries(grouped).map(([category, items]) => {
          const Icon = categoryIcon(category);
          return (
            <Card key={category} title={<>{category} <span className="badge-secondary ml-1">{items.length}</span></>} icon={Icon}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {items.map((t) => (
                  <div key={t._id} className="border border-slate-200 rounded-lg p-4 hover:border-brand-300 hover:shadow-soft transition-all">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-base mb-1 truncate">{t.title}</h4>
                        {t.description && <p className="text-xs text-slate-500 line-clamp-2">{t.description}</p>}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium whitespace-nowrap ${categoryColor(t.category)}`}>
                        {t.category}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                      <div className="text-xs text-slate-500">
                        <div className="font-mono truncate max-w-[140px]" title={t.originalName}>{t.originalName}</div>
                        <div>{formatBytes(t.size)} · {formatDate(t.createdAt)}</div>
                      </div>
                      <a
                        href={studentAPI.templateDownloadUrl(t._id)}
                        className="btn-primary btn-sm"
                      >
                        <Download className="w-3 h-3" /> Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
};

export default StudentResources;
