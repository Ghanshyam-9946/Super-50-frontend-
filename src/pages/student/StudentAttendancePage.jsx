import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Loader2, Check, X, Calendar } from 'lucide-react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function StudentAttendancePage() {
  const { user } = useSelector((state) => state.auth);
  const [data, setData] = useState(null);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?._id) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileRes, logsRes] = await Promise.all([
        api.get(`/students/${user._id}`),
        api.get(`/attendance/super50/student/${user._id}`).catch(() => ({ data: { data: [] } }))
      ]);
      setData(profileRes.data.data);
      setAttendanceLogs(logsRes.data.data || []);
    } catch (error) {
      toast.error('Failed to load your attendance details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header className="glass-card flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)] flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-200 shadow-sm shrink-0">
              <ClipboardList size={32} />
            </div>
            My Attendance
          </h1>
          <p className="text-[var(--text-secondary)] font-medium mt-1">View your overall attendance percentage, semester-wise logs, and individual class history.</p>
        </div>
        {data?.student && (
          <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm text-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Overall Attendance</span>
            <span className="text-3xl font-display font-black text-indigo-600">
              {Math.round(data.student.attendancePercentage || 0)}%
            </span>
          </div>
        )}
      </header>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
          <Loader2 size={36} className="animate-spin text-indigo-500" />
          <p className="text-xs font-bold uppercase tracking-wider">Loading your attendance...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {/* Semester Attendance */}
          <div className="glass-card bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-display font-black text-slate-900 mb-6 flex items-center gap-2">
              <Calendar size={20} className="text-indigo-500" />
              Semester-wise History
            </h3>
            
            {(!data?.semesterAttendance || data.semesterAttendance.length === 0) ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl p-6">
                <ClipboardList size={36} className="text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-500 text-sm">No previous semester attendance records found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {data.semesterAttendance.map((semAtt) => (
                  <div key={semAtt._id} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-slate-900">Semester {semAtt.semester}</h5>
                      {semAtt.batch && <p className="text-xs text-slate-500 font-medium">Batch {semAtt.batch}</p>}
                    </div>
                    <div className="text-lg font-display font-black text-indigo-600">
                      {semAtt.attendancePercentage}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Super 50 Class Attendance */}
          {user?.isSuper50 && (
            <div className="glass-card bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-xl font-display font-black text-slate-900 mb-6 flex items-center gap-2">
                <ClipboardList size={20} className="text-indigo-500" />
                Super 50 Class Log
              </h3>

              {attendanceLogs.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl p-6">
                  <ClipboardList size={36} className="text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-500 text-sm">No class attendance logs recorded yet.</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-medium">
                      <thead className="text-[10px] uppercase bg-slate-50 text-slate-500 font-black tracking-widest border-b border-slate-200">
                        <tr>
                          <th className="p-4">Date</th>
                          <th className="p-4">Class Topic</th>
                          <th className="p-4">Recorded By</th>
                          <th className="p-4 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {attendanceLogs.map((log) => (
                          <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 font-bold text-slate-900 whitespace-nowrap">
                              {new Date(log.classDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="p-4 font-bold text-slate-900 text-sm">{log.className}</td>
                            <td className="p-4 text-slate-500 whitespace-nowrap">{log.uploadedBy}</td>
                            <td className="p-4 text-right whitespace-nowrap">
                              <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                                log.status === 'present'
                                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                                }`}>
                                {log.status === 'present' ? <Check size={12} /> : <X size={12} />}
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
