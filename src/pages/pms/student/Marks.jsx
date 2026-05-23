import { useState, useEffect } from 'react';
import { Award, Lock, ClipboardCheck, Inbox } from 'lucide-react';
import toast from 'react-hot-toast';
import { studentAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner, EmptyState, StatusBadge } from '../../../components/pms/Common';
import { formatDate } from '../../../utils/pms/helpers';

const StudentMarks = () => {
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentAPI.getMarks()
      .then((res) => setMarks(res.data.marks || []))
      .catch((err) => toast.error(handleError(err)))
      .finally(() => setLoading(false));
  }, []);

  // Compute total awarded
  const totalEarned = marks.reduce((sum, m) => sum + (m.marksObtained || 0), 0);
  const totalPossible = marks.filter((m) => m.marksObtained != null).reduce((sum, m) => sum + (m.totalMarks || 0), 0);

  if (loading) return <div className="py-20 flex justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Marks &amp; Status</h1>
        <p className="text-sm text-slate-500 mt-1">View your presentation scores and approval status.</p>
      </div>

      {/* Total */}
      {totalPossible > 0 && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Marks Awarded</div>
              <div className="text-3xl font-bold">
                {totalEarned} <span className="text-slate-400 font-normal text-xl">/ {totalPossible}</span>
              </div>
            </div>
            <Award className="w-10 h-10 text-amber-500" />
          </div>
        </Card>
      )}

      <Card title="All Presentations" icon={ClipboardCheck} noPadding>
        {marks.length === 0 ? (
          <EmptyState icon={Inbox} title="No presentations yet" message="Your scheduled presentations will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th>Presentation</th><th>Date</th><th>Status</th><th className="text-center">Marks</th><th>Locked</th><th>Guide Comment</th></tr>
              </thead>
              <tbody>
                {marks.map((m) => (
                  <tr key={m.presentationId}>
                    <td className="font-semibold">{m.presentationTitle}</td>
                    <td>{formatDate(m.presentationDate)}</td>
                    <td><StatusBadge status={m.status} /></td>
                    <td className="text-center">
                      {m.marksObtained != null ? (
                        <span className="font-bold text-emerald-600">
                          {m.marksObtained} <span className="text-slate-400 font-normal">/ {m.totalMarks}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td>
                      {m.isLocked ? <span className="badge-secondary"><Lock className="w-3 h-3" /> Locked</span> : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="text-sm text-slate-500 italic max-w-[240px] truncate">
                      {m.guideComment || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default StudentMarks;
