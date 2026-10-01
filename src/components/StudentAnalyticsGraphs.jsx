import React, { useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  TrendingUp,
  Award,
  Activity,
  Building2,
  ClipboardList,
  CheckCircle,
  Clock,
  Sparkles,
  BarChart3,
  Calendar,
  MessageSquare,
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

// Register ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Clean, high-readability chart options
const cleanChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        boxWidth: 10,
        boxHeight: 10,
        padding: 14,
        font: { size: 12, family: 'Inter', weight: '600' },
        color: '#475569'
      }
    },
    tooltip: {
      backgroundColor: '#0F172A',
      titleFont: { size: 13, weight: '700' },
      bodyFont: { size: 12, weight: '500' },
      padding: 12,
      cornerRadius: 10
    }
  }
};

/* -------------------------------------------------------------
   1. SIMPLIFIED OVERALL PERFORMANCE DASHBOARD
------------------------------------------------------------- */
export function OverallPerformanceDashboard({ data, history = [], attendanceLogs = [] }) {
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all' | 'rgpv' | 'mst' | 'amcat' | 'attendance' | 'placements' | 'activities' | 'certificates' | 'remarks'

  const student = data?.student || {};
  const activities = data?.activities || [];
  const certificates = data?.certificates || [];
  const mstResults = data?.mstResults || [];
  const amcatResults = data?.amcatResults || [];
  const rgpvResults = data?.rgpvResults || [];
  const semesterAttendance = data?.semesterAttendance || [];
  const remarks = student?.remarks || [];
  const placementHistory = history || [];

  // Calculate Scores (0-100%)
  const rgpvScore = useMemo(() => {
    if (student.cgpa) return Math.min(100, Math.round(student.cgpa * 10));
    if (rgpvResults.length > 0) {
      const latest = rgpvResults[rgpvResults.length - 1];
      if (latest.cgpa) return Math.min(100, Math.round(latest.cgpa * 10));
      if (latest.sgpa) return Math.min(100, Math.round(latest.sgpa * 10));
    }
    return 0;
  }, [student, rgpvResults]);

  const mstScore = useMemo(() => {
    if (!mstResults || mstResults.length === 0) return 0;
    let totalObtained = 0;
    let totalPossible = 0;

    mstResults.forEach(mst => {
      const testNameLower = (mst.testName || '').toLowerCase();
      Object.entries(mst.scores || {}).forEach(([sub, score]) => {
        const lowerSub = sub.toLowerCase();
        if (lowerSub.includes('total') || lowerSub.includes('id') || lowerSub.includes('enrollment') || lowerSub.includes('roll')) return;
        const num = Number(score);
        if (!isNaN(num) && num >= 0) {
          const isCrt = lowerSub.includes('crt') || lowerSub.includes('aptitude');
          let maxMarks = 100;
          if (!isCrt) {
            if (testNameLower.includes('mst-1') || testNameLower.includes('mst 1') || testNameLower.includes('mst1')) maxMarks = 28;
            else if (testNameLower.includes('mst-2') || testNameLower.includes('mst 2') || testNameLower.includes('mst2')) maxMarks = 42;
          }
          totalObtained += num;
          totalPossible += maxMarks;
        }
      });
    });

    return totalPossible > 0 ? Math.round((totalObtained / totalPossible) * 100) : 0;
  }, [mstResults]);

  const amcatScore = useMemo(() => {
    if (!amcatResults || amcatResults.length === 0) return 0;
    let totalObtained = 0;
    let count = 0;

    amcatResults.forEach(amcat => {
      Object.entries(amcat.scores || {}).forEach(([sub, score]) => {
        const lowerSub = sub.toLowerCase();
        if (lowerSub.includes('total') || lowerSub.includes('id') || lowerSub.includes('enrollment') || lowerSub.includes('roll')) return;
        const num = Number(score);
        if (!isNaN(num) && num >= 0) {
          const normalized = num > 100 ? (num / 900) * 100 : num;
          totalObtained += normalized;
          count += 1;
        }
      });
    });

    return count > 0 ? Math.round(totalObtained / count) : 0;
  }, [amcatResults]);

  const attendanceScore = useMemo(() => {
    if (student.attendancePercentage !== undefined && student.attendancePercentage !== null) {
      return Math.round(student.attendancePercentage);
    }
    if (semesterAttendance.length > 0) {
      const sum = semesterAttendance.reduce((acc, s) => acc + (s.attendancePercentage || 0), 0);
      return Math.round(sum / semesterAttendance.length);
    }
    if (attendanceLogs.length > 0) {
      const presentCount = attendanceLogs.filter(l => l.status === 'present').length;
      return Math.round((presentCount / attendanceLogs.length) * 100);
    }
    return 0;
  }, [student, semesterAttendance, attendanceLogs]);

  const activitiesScore = useMemo(() => {
    if (activities.length === 0) return 0;
    const approved = activities.filter(a => a.verified === 'approved').length;
    return Math.min(100, (approved * 25) + (activities.length * 10));
  }, [activities]);

  const certificatesScore = useMemo(() => {
    if (certificates.length === 0) return 0;
    const approved = certificates.filter(c => c.verified === 'approved').length;
    return Math.min(100, (approved * 25) + (certificates.length * 10));
  }, [certificates]);

  const placementsScore = useMemo(() => {
    if (placementHistory.length === 0) return 0;
    const selected = placementHistory.filter(h => h.status === 'selected').length;
    if (selected > 0) return 100;
    let totalRounds = 0;
    let clearedRounds = 0;
    placementHistory.forEach(h => {
      (h.roundsProgress || []).forEach(r => {
        totalRounds += 1;
        if (r.status === 'cleared') clearedRounds += 1;
      });
    });
    if (totalRounds === 0) return 35;
    return Math.min(100, Math.round((clearedRounds / totalRounds) * 100));
  }, [placementHistory]);

  const remarksScore = useMemo(() => {
    if (remarks.length === 0) return 50;
    return Math.min(100, 50 + (remarks.length * 15));
  }, [remarks]);

  const overallAvg = Math.round(
    (rgpvScore + mstScore + amcatScore + attendanceScore + activitiesScore + certificatesScore + placementsScore + remarksScore) / 8
  );

  // Simple, clean Bar Chart Data for the 8 Pillars
  const overviewBarData = {
    labels: [
      'RGPV (Academics)',
      'MST Marks',
      'AMCAT Aptitude',
      'Attendance',
      'Activities',
      'Certificates',
      'Placements',
      'Remarks'
    ],
    datasets: [
      {
        label: 'Score Percentage (%)',
        data: [
          rgpvScore,
          mstScore,
          amcatScore,
          attendanceScore,
          activitiesScore,
          certificatesScore,
          placementsScore,
          remarksScore
        ],
        backgroundColor: [
          '#F97316', // RGPV - Orange
          '#6366F1', // MST - Indigo
          '#D946EF', // AMCAT - Fuchsia
          '#10B981', // Attendance - Emerald
          '#F43F5E', // Activities - Rose
          '#06B6D4', // Certificates - Cyan
          '#3B82F6', // Placements - Blue
          '#8B5CF6'  // Remarks - Purple
        ],
        borderRadius: 8,
        barThickness: 28
      }
    ]
  };

  const overviewBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11, family: 'Inter', weight: '700' }, color: '#334155' }
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: '#F1F5F9', borderDash: [4, 4] },
        ticks: { callback: v => `${v}%`, font: { size: 11 }, color: '#64748B' }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `Performance: ${ctx.raw}%`
        }
      }
    }
  };

  const filterTabs = [
    { id: 'all', label: '📊 All-in-One Summary' },
    { id: 'rgpv', label: '🎓 RGPV Marks' },
    { id: 'mst', label: '📝 MST Marks' },
    { id: 'amcat', label: '🏆 AMCAT Marks' },
    { id: 'attendance', label: '📅 Attendance' },
    { id: 'placements', label: '💼 Placements' },
    { id: 'activities', label: '🎯 Activities' },
    { id: 'certificates', label: '📜 Certificates' },
    { id: 'remarks', label: '💬 Remarks' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Simple Scorecard Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-widest">
            <Sparkles size={15} className="text-amber-400" /> Student Performance Scorecard
          </div>
          <h3 className="text-2xl font-black text-white font-display">
            {student.name || 'Student Profile'}
          </h3>
          <p className="text-xs text-slate-300 font-medium max-w-xl leading-relaxed">
            Quick visual insights across all academic records, tests, campus placements, and extracurricular activities.
          </p>
        </div>

        {/* Big Clean Overall Score Ring / Badge */}
        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-white/15">
          <div className="text-right">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-200 block">Overall Score</span>
            <span className="text-2xl font-black text-white">{overallAvg}%</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center font-black text-base text-indigo-300">
            {overallAvg >= 75 ? 'A+' : overallAvg >= 60 ? 'B+' : 'C'}
          </div>
        </div>
      </div>

      {/* 4 Clean Summary Pill Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div
          onClick={() => setSelectedFilter('rgpv')}
          className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-orange-400 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">RGPV CGPA</span>
            <span className="w-2 h-2 rounded-full bg-orange-500" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-2">
            {student.cgpa || (rgpvResults.length > 0 ? rgpvResults[rgpvResults.length - 1]?.cgpa : 'N/A')}
            <span className="text-xs font-medium text-slate-400"> / 10</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-semibold group-hover:text-orange-600 transition-colors">
            {rgpvResults.length} Semesters Recorded →
          </p>
        </div>

        <div
          onClick={() => setSelectedFilter('attendance')}
          className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Attendance</span>
            <span className={`w-2 h-2 rounded-full ${attendanceScore >= 75 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          </div>
          <div className="text-xl font-black text-slate-900 mt-2">
            {attendanceScore}%
          </div>
          <p className={`text-[11px] font-semibold mt-1 ${attendanceScore >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {attendanceScore >= 75 ? '✓ Safe (≥75%)' : '⚠ Below 75%'} →
          </p>
        </div>

        <div
          onClick={() => setSelectedFilter('mst')}
          className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">MST Tests</span>
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-2">
            {mstScore}%
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-semibold group-hover:text-indigo-600 transition-colors">
            {mstResults.length} Tests Evaluated →
          </p>
        </div>

        <div
          onClick={() => setSelectedFilter('placements')}
          className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Placements</span>
            <span className="w-2 h-2 rounded-full bg-blue-500" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-2">
            {placementHistory.filter(h => h.status === 'selected').length > 0 ? 'Selected' : `${placementHistory.length} Drives`}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-semibold group-hover:text-blue-600 transition-colors">
            View Drive History →
          </p>
        </div>
      </div>

      {/* Clean Category Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filterTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedFilter === tab.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 scale-100'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dynamic Content Based on Selected Tab */}
      {selectedFilter === 'all' && (
        <div className="space-y-6">
          {/* Main 8-Pillars Clean Bar Chart */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <BarChart3 size={18} className="text-indigo-600" /> 8-Pillar Performance Breakdown
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct percentage score across all 8 student evaluation areas
                </p>
              </div>
              <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                Max Scale: 100%
              </span>
            </div>

            <div className="h-72 w-full relative">
              <Bar data={overviewBarData} options={overviewBarOptions} />
            </div>
          </div>

          {/* Clean 8 Metric Summary Cards Grid */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
              Click any section below to see its detailed graph:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
              {[
                { id: 'rgpv', label: 'RGPV Academics', value: `${student.cgpa || 'N/A'} CGPA`, desc: `${rgpvResults.length} Semesters`, icon: Award, color: 'text-orange-500 bg-orange-50 border-orange-200' },
                { id: 'mst', label: 'MST Test Marks', value: `${mstScore}% Avg`, desc: `${mstResults.length} Tests Uploaded`, icon: ClipboardList, color: 'text-indigo-500 bg-indigo-50 border-indigo-200' },
                { id: 'amcat', label: 'AMCAT Aptitude', value: `${amcatScore}% Score`, desc: `${amcatResults.length} Assessments`, icon: Award, color: 'text-fuchsia-500 bg-fuchsia-50 border-fuchsia-200' },
                { id: 'attendance', label: 'Attendance', value: `${attendanceScore}%`, desc: attendanceScore >= 75 ? 'Safe Status' : 'Warning Alert', icon: Calendar, color: 'text-emerald-500 bg-emerald-50 border-emerald-200' },
                { id: 'placements', label: 'Placements', value: `${placementHistory.length} Drives`, desc: `${placementHistory.filter(h => h.status === 'selected').length} Selected`, icon: Building2, color: 'text-blue-500 bg-blue-50 border-blue-200' },
                { id: 'activities', label: 'Activities', value: `${activities.length} Total`, desc: `${activities.filter(a => a.verified === 'approved').length} Approved`, icon: Activity, color: 'text-rose-500 bg-rose-50 border-rose-200' },
                { id: 'certificates', label: 'Certificates', value: `${certificates.length} Total`, desc: `${certificates.filter(c => c.verified === 'approved').length} Approved`, icon: Award, color: 'text-cyan-500 bg-cyan-50 border-cyan-200' },
                { id: 'remarks', label: 'Faculty Remarks', value: `${remarks.length} Reviews`, desc: 'Mentorship Logs', icon: MessageSquare, color: 'text-purple-500 bg-purple-50 border-purple-200' }
              ].map(card => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.id}
                    onClick={() => setSelectedFilter(card.id)}
                    className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group flex items-start justify-between"
                  >
                    <div>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${card.color} mb-2.5`}>
                        <Icon size={18} />
                      </div>
                      <h5 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                        {card.label}
                      </h5>
                      <p className="text-base font-black text-slate-900 mt-1">
                        {card.value}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                        {card.desc}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all mt-1" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Individual Filter Views */}
      {selectedFilter === 'rgpv' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-base">RGPV University Results & Trends</h4>
            <button onClick={() => setSelectedFilter('all')} className="text-xs font-bold text-indigo-600 hover:underline">
              ← Back to Summary
            </button>
          </div>
          <RGPVMarksGraph rgpvResults={rgpvResults} />
        </div>
      )}

      {selectedFilter === 'mst' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-base">Mid-Semester Test (MST) Marks</h4>
            <button onClick={() => setSelectedFilter('all')} className="text-xs font-bold text-indigo-600 hover:underline">
              ← Back to Summary
            </button>
          </div>
          <MSTMarksGraph mstResults={mstResults} />
        </div>
      )}

      {selectedFilter === 'amcat' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-base">AMCAT Assessment Sectional Marks</h4>
            <button onClick={() => setSelectedFilter('all')} className="text-xs font-bold text-indigo-600 hover:underline">
              ← Back to Summary
            </button>
          </div>
          <AMCATMarksGraph amcatResults={amcatResults} />
        </div>
      )}

      {selectedFilter === 'attendance' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-base">Attendance History & Class Ratio</h4>
            <button onClick={() => setSelectedFilter('all')} className="text-xs font-bold text-indigo-600 hover:underline">
              ← Back to Summary
            </button>
          </div>
          <AttendanceGraph
            attendancePercentage={student.attendancePercentage}
            semesterAttendance={semesterAttendance}
            attendanceLogs={attendanceLogs}
          />
        </div>
      )}

      {selectedFilter === 'placements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-base">Placement Drives & Rounds Progress</h4>
            <button onClick={() => setSelectedFilter('all')} className="text-xs font-bold text-indigo-600 hover:underline">
              ← Back to Summary
            </button>
          </div>
          <PlacementsGraph history={placementHistory} />
        </div>
      )}

      {selectedFilter === 'activities' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-base">Extracurricular & Co-curricular Activities</h4>
            <button onClick={() => setSelectedFilter('all')} className="text-xs font-bold text-indigo-600 hover:underline">
              ← Back to Summary
            </button>
          </div>
          <ActivitiesGraph activities={activities} />
        </div>
      )}

      {selectedFilter === 'certificates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-base">Certifications & Verifications</h4>
            <button onClick={() => setSelectedFilter('all')} className="text-xs font-bold text-indigo-600 hover:underline">
              ← Back to Summary
            </button>
          </div>
          <CertificatesGraph certificates={certificates} />
        </div>
      )}

      {selectedFilter === 'remarks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-base">Faculty Remarks & Mentorship Feedback</h4>
            <button onClick={() => setSelectedFilter('all')} className="text-xs font-bold text-indigo-600 hover:underline">
              ← Back to Summary
            </button>
          </div>
          <RemarksGraph remarks={remarks} />
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------
   2. ACTIVITIES GRAPH
------------------------------------------------------------- */
export function ActivitiesGraph({ activities = [] }) {
  const stats = useMemo(() => {
    const approved = activities.filter(a => a.verified === 'approved').length;
    const pending = activities.filter(a => !a.verified || a.verified === 'pending').length;
    const rejected = activities.filter(a => a.verified === 'rejected').length;

    const platformMap = {};
    activities.forEach(a => {
      const p = a.platform || a.type || 'Other';
      platformMap[p] = (platformMap[p] || 0) + 1;
    });

    return { approved, pending, rejected, platformMap };
  }, [activities]);

  if (activities.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 mb-6">
        <Activity size={32} className="text-slate-300 mx-auto mb-2" />
        <p className="text-xs font-bold text-slate-500">No activities submitted yet</p>
      </div>
    );
  }

  const doughnutData = {
    labels: ['Approved', 'Pending', 'Rejected'],
    datasets: [
      {
        data: [stats.approved, stats.pending, stats.rejected],
        backgroundColor: ['#10B981', '#F59E0B', '#F43F5E'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  const platformsData = {
    labels: Object.keys(stats.platformMap),
    datasets: [
      {
        label: 'Activities Count',
        data: Object.values(stats.platformMap),
        backgroundColor: '#F43F5E',
        borderRadius: 6
      }
    ]
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6">
      <div>
        <h5 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
          <CheckCircle size={14} className="text-emerald-500" /> Approval Status Breakdown
        </h5>
        <div className="h-44 relative">
          <Doughnut data={doughnutData} options={cleanChartOptions} />
        </div>
      </div>
      <div>
        <h5 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
          <Activity size={14} className="text-rose-500" /> Activities by Platform / Category
        </h5>
        <div className="h-44 relative">
          <Bar
            data={platformsData}
            options={{
              ...cleanChartOptions,
              plugins: { legend: { display: false } },
              scales: {
                x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } } }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------
   3. CERTIFICATES GRAPH
------------------------------------------------------------- */
export function CertificatesGraph({ certificates = [] }) {
  const stats = useMemo(() => {
    const approved = certificates.filter(c => c.verified === 'approved').length;
    const pending = certificates.filter(c => !c.verified || c.verified === 'pending').length;
    const rejected = certificates.filter(c => c.verified === 'rejected').length;

    const issuerMap = {};
    certificates.forEach(c => {
      const issuer = c.issuedBy || 'General';
      issuerMap[issuer] = (issuerMap[issuer] || 0) + 1;
    });

    return { approved, pending, rejected, issuerMap };
  }, [certificates]);

  if (certificates.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 mb-6">
        <Award size={32} className="text-slate-300 mx-auto mb-2" />
        <p className="text-xs font-bold text-slate-500">No certificates uploaded yet</p>
      </div>
    );
  }

  const doughnutData = {
    labels: ['Approved', 'Pending', 'Rejected'],
    datasets: [
      {
        data: [stats.approved, stats.pending, stats.rejected],
        backgroundColor: ['#10B981', '#F59E0B', '#F43F5E'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  const issuersData = {
    labels: Object.keys(stats.issuerMap).slice(0, 6),
    datasets: [
      {
        label: 'Certificates Count',
        data: Object.values(stats.issuerMap).slice(0, 6),
        backgroundColor: '#06B6D4',
        borderRadius: 6
      }
    ]
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6">
      <div>
        <h5 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
          <CheckCircle size={14} className="text-emerald-500" /> Verification Status
        </h5>
        <div className="h-44 relative">
          <Doughnut data={doughnutData} options={cleanChartOptions} />
        </div>
      </div>
      <div>
        <h5 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
          <Award size={14} className="text-cyan-500" /> Certificates by Issuing Body
        </h5>
        <div className="h-44 relative">
          <Bar
            data={issuersData}
            options={{
              ...cleanChartOptions,
              plugins: { legend: { display: false } },
              scales: {
                x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } } }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------
   4. PLACEMENTS GRAPH
------------------------------------------------------------- */
export function PlacementsGraph({ history = [] }) {
  const chartData = useMemo(() => {
    if (!history || history.length === 0) return null;

    const companyLabels = [];
    const clearedCounts = [];
    const totalRoundsCounts = [];

    history.slice(0, 6).forEach(app => {
      const company = app.drive?.companyName || 'Company';
      const rounds = app.roundsProgress || [];
      const cleared = rounds.filter(r => r.status === 'cleared').length;

      companyLabels.push(company.length > 14 ? company.substring(0, 12) + '...' : company);
      clearedCounts.push(cleared);
      totalRoundsCounts.push(rounds.length || 1);
    });

    return { companyLabels, clearedCounts, totalRoundsCounts };
  }, [history]);

  if (!history || history.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 mb-6">
        <Building2 size={32} className="text-slate-300 mx-auto mb-2" />
        <p className="text-xs font-bold text-slate-500">No placement drive history yet</p>
      </div>
    );
  }

  const barData = {
    labels: chartData.companyLabels,
    datasets: [
      {
        label: 'Rounds Cleared',
        data: chartData.clearedCounts,
        backgroundColor: '#10B981',
        borderRadius: 6
      },
      {
        label: 'Total Rounds',
        data: chartData.totalRoundsCounts,
        backgroundColor: '#E2E8F0',
        borderRadius: 6
      }
    ]
  };

  const statusSummary = {
    selected: history.filter(h => h.status === 'selected').length,
    inProgress: history.filter(h => !['selected', 'rejected', 'not-eligible'].includes(h.status)).length,
    eliminated: history.filter(h => h.status === 'rejected').length
  };

  const statusDoughnut = {
    labels: ['Selected', 'In Progress', 'Eliminated'],
    datasets: [
      {
        data: [statusSummary.selected, statusSummary.inProgress, statusSummary.eliminated],
        backgroundColor: ['#10B981', '#3B82F6', '#F43F5E'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6">
      <div className="md:col-span-8">
        <h5 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
          <Building2 size={14} className="text-emerald-500" /> Drive Round Progression
        </h5>
        <div className="h-44 relative">
          <Bar
            data={barData}
            options={{
              ...cleanChartOptions,
              scales: {
                x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } } }
              }
            }}
          />
        </div>
      </div>
      <div className="md:col-span-4">
        <h5 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
          <CheckCircle size={14} className="text-blue-500" /> Placement Status
        </h5>
        <div className="h-44 relative">
          <Doughnut data={statusDoughnut} options={cleanChartOptions} />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------
   5. MST MARKS GRAPH
------------------------------------------------------------- */
export function MSTMarksGraph({ mstResults = [] }) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  if (!mstResults || mstResults.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 mb-6">
        <ClipboardList size={32} className="text-slate-300 mx-auto mb-2" />
        <p className="text-xs font-bold text-slate-500">No MST marks uploaded yet</p>
      </div>
    );
  }

  const currentMst = mstResults[selectedIdx] || mstResults[0];
  const testNameLower = (currentMst.testName || '').toLowerCase();

  const subjects = [];
  const obtainedScores = [];
  const maxScores = [];

  Object.entries(currentMst.scores || {}).forEach(([sub, score]) => {
    const lowerSub = sub.toLowerCase();
    if (lowerSub.includes('total') || lowerSub.includes('id') || lowerSub.includes('enrollment') || lowerSub.includes('roll')) return;
    const num = Number(score);
    if (!isNaN(num) && num >= 0) {
      const isCrt = lowerSub.includes('crt') || lowerSub.includes('aptitude');
      let maxMarks = 100;
      if (!isCrt) {
        if (testNameLower.includes('mst-1') || testNameLower.includes('mst 1') || testNameLower.includes('mst1')) maxMarks = 28;
        else if (testNameLower.includes('mst-2') || testNameLower.includes('mst 2') || testNameLower.includes('mst2')) maxMarks = 42;
      }
      subjects.push(sub.length > 12 ? sub.substring(0, 10) + '...' : sub);
      obtainedScores.push(num);
      maxScores.push(maxMarks);
    }
  });

  const barData = {
    labels: subjects,
    datasets: [
      {
        label: 'Marks Obtained',
        data: obtainedScores,
        backgroundColor: '#6366F1',
        borderRadius: 6
      },
      {
        label: 'Max Marks',
        data: maxScores,
        backgroundColor: '#E2E8F0',
        borderRadius: 6
      }
    ]
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
        <div>
          <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <ClipboardList size={14} className="text-indigo-600" /> Subject-wise Scores vs Max Marks
          </h5>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentMst.testName} (Semester {currentMst.semester})
          </p>
        </div>

        {mstResults.length > 1 && (
          <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
            {mstResults.map((mst, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedIdx(idx)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedIdx === idx
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mst.testName || `MST ${idx + 1}`}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-52 relative">
        <Bar
          data={barData}
          options={{
            ...cleanChartOptions,
            scales: {
              x: { grid: { display: false }, ticks: { font: { size: 10 } } },
              y: { beginAtZero: true, ticks: { font: { size: 10 } } }
            }
          }}
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------
   6. AMCAT MARKS GRAPH
------------------------------------------------------------- */
export function AMCATMarksGraph({ amcatResults = [] }) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  if (!amcatResults || amcatResults.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 mb-6">
        <Award size={32} className="text-slate-300 mx-auto mb-2" />
        <p className="text-xs font-bold text-slate-500">No AMCAT marks uploaded yet</p>
      </div>
    );
  }

  const currentAmcat = amcatResults[selectedIdx] || amcatResults[0];

  const sections = [];
  const scores = [];

  Object.entries(currentAmcat.scores || {}).forEach(([sub, score]) => {
    const lowerSub = sub.toLowerCase();
    if (lowerSub.includes('total') || lowerSub.includes('id') || lowerSub.includes('enrollment') || lowerSub.includes('roll')) return;
    const num = Number(score);
    if (!isNaN(num) && num >= 0) {
      sections.push(sub.length > 14 ? sub.substring(0, 12) + '...' : sub);
      scores.push(num);
    }
  });

  const barData = {
    labels: sections,
    datasets: [
      {
        label: 'Section Score',
        data: scores,
        backgroundColor: '#D946EF',
        borderRadius: 6
      }
    ]
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
        <div>
          <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Award size={14} className="text-fuchsia-600" /> Sectional AMCAT Marks Breakdown
          </h5>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentAmcat.testName} (Semester {currentAmcat.semester})
          </p>
        </div>

        {amcatResults.length > 1 && (
          <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
            {amcatResults.map((amc, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedIdx(idx)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedIdx === idx
                    ? 'bg-white text-fuchsia-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {amc.testName || `AMCAT ${idx + 1}`}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-52 relative">
        <Bar
          data={barData}
          options={{
            ...cleanChartOptions,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false }, ticks: { font: { size: 10 } } },
              y: { beginAtZero: true, ticks: { font: { size: 10 } } }
            }
          }}
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------
   7. RGPV MARKS GRAPH
------------------------------------------------------------- */
export function RGPVMarksGraph({ rgpvResults = [] }) {
  const chartData = useMemo(() => {
    if (!rgpvResults || rgpvResults.length === 0) return null;

    const semesters = [];
    const sgpaList = [];
    const cgpaList = [];
    const gradeCounts = { 'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C+': 0, 'C': 0, 'F': 0 };

    rgpvResults.forEach(r => {
      semesters.push(`Sem ${r.semester}`);
      sgpaList.push(r.sgpa || 0);
      cgpaList.push(r.cgpa || 0);

      Object.values(r.grades || {}).forEach(g => {
        const trimmed = (g || '').trim().toUpperCase();
        if (gradeCounts[trimmed] !== undefined) {
          gradeCounts[trimmed] += 1;
        } else if (trimmed.includes('A')) {
          gradeCounts['A'] += 1;
        } else if (trimmed.includes('B')) {
          gradeCounts['B'] += 1;
        } else if (trimmed.includes('C')) {
          gradeCounts['C'] += 1;
        } else if (trimmed.includes('F')) {
          gradeCounts['F'] += 1;
        }
      });
    });

    return { semesters, sgpaList, cgpaList, gradeCounts };
  }, [rgpvResults]);

  if (!rgpvResults || rgpvResults.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 mb-6">
        <Award size={32} className="text-slate-300 mx-auto mb-2" />
        <p className="text-xs font-bold text-slate-500">No RGPV university results uploaded yet</p>
      </div>
    );
  }

  const lineData = {
    labels: chartData.semesters,
    datasets: [
      {
        label: 'SGPA',
        data: chartData.sgpaList,
        borderColor: '#F97316',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        fill: true,
        tension: 0.3,
        borderWidth: 2.5,
        pointBackgroundColor: '#F97316',
        pointRadius: 4
      },
      {
        label: 'CGPA',
        data: chartData.cgpaList,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        borderDash: [5, 5],
        tension: 0.3,
        borderWidth: 2,
        pointBackgroundColor: '#10B981',
        pointRadius: 4
      }
    ]
  };

  const gradeDoughnutData = {
    labels: Object.keys(chartData.gradeCounts).filter(k => chartData.gradeCounts[k] > 0),
    datasets: [
      {
        data: Object.values(chartData.gradeCounts).filter(v => v > 0),
        backgroundColor: ['#10B981', '#34D399', '#3B82F6', '#60A5FA', '#F59E0B', '#FBBF24', '#F43F5E'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6">
      <div className="md:col-span-8">
        <h5 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
          <TrendingUp size={14} className="text-orange-500" /> SGPA & CGPA Semester Progression
        </h5>
        <div className="h-44 relative">
          <Line
            data={lineData}
            options={{
              ...cleanChartOptions,
              scales: {
                x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                y: { min: 0, max: 10, ticks: { stepSize: 2, font: { size: 10 } } }
              }
            }}
          />
        </div>
      </div>
      <div className="md:col-span-4">
        <h5 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
          <Award size={14} className="text-emerald-500" /> Grade Distribution
        </h5>
        <div className="h-44 relative">
          <Doughnut data={gradeDoughnutData} options={cleanChartOptions} />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------
   8. REMARKS GRAPH
------------------------------------------------------------- */
export function RemarksGraph({ remarks = [] }) {
  const chartData = useMemo(() => {
    if (!remarks || remarks.length === 0) return null;

    const facultyMap = {};
    remarks.forEach(r => {
      const name = r.addedBy?.name || 'Faculty';
      facultyMap[name] = (facultyMap[name] || 0) + 1;
    });

    return { facultyMap };
  }, [remarks]);

  if (!remarks || remarks.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 mb-6">
        <MessageSquare size={32} className="text-slate-300 mx-auto mb-2" />
        <p className="text-xs font-bold text-slate-500">No faculty remarks logged yet</p>
      </div>
    );
  }

  const barData = {
    labels: Object.keys(chartData.facultyMap),
    datasets: [
      {
        label: 'Feedback Entries',
        data: Object.values(chartData.facultyMap),
        backgroundColor: '#8B5CF6',
        borderRadius: 6
      }
    ]
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6">
      <h5 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
        <MessageSquare size={14} className="text-purple-600" /> Faculty Reviews & Mentorship Entries
      </h5>
      <div className="h-40 relative">
        <Bar
          data={barData}
          options={{
            ...cleanChartOptions,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false }, ticks: { font: { size: 10 } } },
              y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } } }
            }
          }}
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------
   9. ATTENDANCE GRAPH
------------------------------------------------------------- */
export function AttendanceGraph({
  attendancePercentage = 0,
  semesterAttendance = [],
  attendanceLogs = []
}) {
  const chartData = useMemo(() => {
    const semLabels = [];
    const semPercentages = [];

    semesterAttendance.forEach(s => {
      semLabels.push(`Sem ${s.semester}`);
      semPercentages.push(s.attendancePercentage || 0);
    });

    const presentCount = attendanceLogs.filter(l => l.status === 'present').length;
    const absentCount = attendanceLogs.filter(l => l.status === 'absent').length;

    return { semLabels, semPercentages, presentCount, absentCount };
  }, [semesterAttendance, attendanceLogs]);

  const hasData =
    semesterAttendance.length > 0 ||
    attendanceLogs.length > 0 ||
    attendancePercentage !== undefined;

  if (!hasData) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 mb-6">
        <Calendar size={32} className="text-slate-300 mx-auto mb-2" />
        <p className="text-xs font-bold text-slate-500">No attendance records logged</p>
      </div>
    );
  }

  const semBarData = {
    labels: chartData.semLabels.length > 0 ? chartData.semLabels : ['Current Attendance'],
    datasets: [
      {
        label: 'Attendance (%)',
        data:
          chartData.semPercentages.length > 0
            ? chartData.semPercentages
            : [attendancePercentage || 0],
        backgroundColor: (context) => {
          const val = context.raw;
          return val >= 75 ? '#10B981' : '#F43F5E';
        },
        borderRadius: 6
      }
    ]
  };

  const logsDoughnutData = {
    labels: ['Present', 'Absent'],
    datasets: [
      {
        data: [chartData.presentCount || (attendancePercentage >= 75 ? 8 : 4), chartData.absentCount || (attendancePercentage < 75 ? 6 : 2)],
        backgroundColor: ['#10B981', '#F43F5E'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6">
      <div className="md:col-span-7">
        <h5 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
          <Calendar size={14} className="text-emerald-500" /> Semester Attendance vs 75% Requirement
        </h5>
        <div className="h-44 relative">
          <Bar
            data={semBarData}
            options={{
              ...cleanChartOptions,
              plugins: { legend: { display: false } },
              scales: {
                x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                y: {
                  min: 0,
                  max: 100,
                  ticks: { callback: v => `${v}%`, font: { size: 10 } }
                }
              }
            }}
          />
        </div>
      </div>
      <div className="md:col-span-5">
        <h5 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
          <CheckCircle size={14} className="text-indigo-500" /> Class Session Ratio
        </h5>
        <div className="h-44 relative">
          <Doughnut data={logsDoughnutData} options={cleanChartOptions} />
        </div>
      </div>
    </div>
  );
}
