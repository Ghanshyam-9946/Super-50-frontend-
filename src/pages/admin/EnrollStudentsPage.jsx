import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, UserPlus, FileSpreadsheet, Users, ChevronDown, ChevronUp,
  Search, X, CheckCircle, Mail, Phone, BookOpen, GraduationCap, RefreshCw, Trash2,
  Download, CheckCircle2, XCircle, Filter, AlertTriangle, FileText,
  MessageSquare, Edit3
} from 'lucide-react';

const PRESET_NOT_WANT_REMARKS = [
  'Higher Studies (GATE / CAT / GRE / MS / M.Tech / MBA)',
  'Family Business / Entrepreneurship / Startup',
  'Govt. Job / UPSC / State PCS / Defense Exams Preparation',
  'Already Placed / Off-Campus Placement Offer Received',
  'Not Interested in Corporate Placements',
  'Location / Relocation Constraints',
  'Personal / Health Reasons',
];
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';
import api from '../../services/api';

const EnrollStudentsPage = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [batches, setBatches] = useState([]);
  const [total, setTotal] = useState(0);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [expandedBatch, setExpandedBatch] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [preferenceFilter, setPreferenceFilter] = useState('all'); // 'all', 'want', 'not_want'

  const [showManualAddModal, setShowManualAddModal] = useState(false);
  const [selectedBatchForManualAdd, setSelectedBatchForManualAdd] = useState('');
  const [manualEnrollmentNumbers, setManualEnrollmentNumbers] = useState('');
  const [enrollingManual, setEnrollingManual] = useState(false);

  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadFilter, setDownloadFilter] = useState('all'); // 'all', 'want', 'not_want'
  const [downloadBatch, setDownloadBatch] = useState('all');
  const [updatingStudentId, setUpdatingStudentId] = useState(null);

  // Remark Modal State for 'Not Want' Placement
  const [remarkModalStudent, setRemarkModalStudent] = useState(null);
  const [remarkText, setRemarkText] = useState('');
  const [savingRemark, setSavingRemark] = useState(false);

  const handleManualEnroll = async (e) => {
    e.preventDefault();
    if (!manualEnrollmentNumbers.trim()) {
      return toast.error('Please enter enrollment numbers');
    }

    setEnrollingManual(true);
    const toastId = toast.loading('Enrolling student(s)...');
    try {
      const res = await api.post('/placement/enroll-student-manual', {
        enrollmentNumbers: manualEnrollmentNumbers,
        batch: selectedBatchForManualAdd
      });
      toast.success(res.data.message || 'Students enrolled successfully!', { id: toastId, duration: 5000 });
      setManualEnrollmentNumbers('');
      setShowManualAddModal(false);
      fetchEnrolledStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to enroll student(s)', { id: toastId });
    } finally {
      setEnrollingManual(false);
    }
  };

  const fetchEnrolledStudents = async () => {
    setLoadingStudents(true);
    try {
      const res = await api.get('/placement/enrolled-students');
      setBatches(res.data.data.batches || []);
      setTotal(res.data.data.total || 0);
    } catch (err) {
      toast.error('Failed to load enrolled students');
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    fetchEnrolledStudents();
  }, []);

  const handleUnenroll = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to remove ${studentName} from placement enrollment?`)) return;
    
    const toastId = toast.loading('Removing student from placement...');
    try {
      await api.delete(`/placement/enrolled-students/${studentId}`);
      toast.success('Student removed from placements successfully', { id: toastId });
      fetchEnrolledStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove student', { id: toastId });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select an Excel file');
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    const toastId = toast.loading('Enrolling students & sending emails...');
    try {
      const res = await api.post('/placement/enroll-students', formData);
      toast.success(res.data.message || 'Students enrolled!', { id: toastId, duration: 5000 });
      setFile(null);
      document.getElementById('enroll-excel-input').value = '';
      fetchEnrolledStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  // Aggregate student preference counts
  const allStudents = batches.flatMap(b => b.students || []);
  const wantCount = allStudents.filter(s => (s.placementPreference || 'want') === 'want').length;
  const notWantCount = allStudents.filter(s => s.placementPreference === 'not_want').length;
  const notEligibleAcademicCount = allStudents.filter(s => s.placementPreference === 'not_eligible_academic').length;

  const handleUpdatePreference = async (studentId, preference, remark) => {
    const prevBatches = batches;
    // Optimistic UI update
    setBatches(current =>
      current.map(b => ({
        ...b,
        students: b.students.map(s =>
          s._id === studentId
            ? {
                ...s,
                placementPreference: preference,
                ...(remark !== undefined
                  ? { placementPreferenceRemark: remark }
                  : (preference === 'want' ? { placementPreferenceRemark: '' } : {})),
              }
            : s
        ),
      }))
    );

    setUpdatingStudentId(studentId);
    try {
      const payload = { preference };
      if (remark !== undefined) {
        payload.remark = remark;
      }
      await api.patch(`/placement/enrolled-students/${studentId}/preference`, payload);
      toast.success(
        preference === 'want'
          ? 'Marked: Wants placement from institute'
          : preference === 'not_want'
          ? 'Marked: Does not want placement (remark saved)'
          : 'Marked: Not eligible due to academic criteria'
      );
    } catch (err) {
      setBatches(prevBatches);
      toast.error(err.response?.data?.message || 'Failed to update preference');
    } finally {
      setUpdatingStudentId(null);
    }
  };

  const handleOpenNotWantModal = (student) => {
    setRemarkModalStudent(student);
    setRemarkText(student.placementPreferenceRemark || '');
  };

  const handleCloseNotWantModal = () => {
    if (savingRemark) return;
    setRemarkModalStudent(null);
    setRemarkText('');
  };

  const handleSaveNotWantRemark = async (e) => {
    if (e) e.preventDefault();
    if (!remarkModalStudent) return;
    setSavingRemark(true);
    try {
      await handleUpdatePreference(remarkModalStudent._id, 'not_want', remarkText.trim());
      setRemarkModalStudent(null);
      setRemarkText('');
    } finally {
      setSavingRemark(false);
    }
  };

  const getFilteredExportList = () => {
    let listToExport = [];
    if (downloadBatch === 'all') {
      listToExport = batches.flatMap(b => b.students || []);
    } else {
      const found = batches.find(b => b.batch === downloadBatch);
      listToExport = found ? found.students : [];
    }

    if (downloadFilter === 'want') {
      listToExport = listToExport.filter(s => (s.placementPreference || 'want') === 'want');
    } else if (downloadFilter === 'not_want') {
      listToExport = listToExport.filter(s => s.placementPreference === 'not_want');
    } else if (downloadFilter === 'not_eligible_academic') {
      listToExport = listToExport.filter(s => s.placementPreference === 'not_eligible_academic');
    }

    return listToExport;
  };

  const handleDownloadExcel = () => {
    const listToExport = getFilteredExportList();

    if (listToExport.length === 0) {
      return toast.error('No students found matching the selected download criteria');
    }

    const data = listToExport.map((s, idx) => ({
      'S.No': idx + 1,
      'Student Name': s.name || '',
      'Enrollment Number': s.enrollmentNumber || '',
      'Email': s.email || '',
      'Mobile': s.mobile || '',
      'Department': s.department || '',
      'Batch': s.batch || '',
      'Placement Preference': s.placementPreference === 'not_eligible_academic'
        ? 'Not Eligible due to Academic Criteria'
        : (s.placementPreference || 'want') === 'want'
        ? 'Want Placement from Institute'
        : 'Not Want Placement from Institute',
      'Placement Reason / Remark': s.placementPreferenceRemark || '—',
      'Mentor': s.mentor?.name || (typeof s.mentor === 'string' ? s.mentor : 'Unassigned'),
      'Status': 'Enrolled'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Enrolled Students');

    const filterLabel = downloadFilter === 'want'
      ? 'Want_Placement'
      : downloadFilter === 'not_want'
      ? 'Not_Want_Placement'
      : downloadFilter === 'not_eligible_academic'
      ? 'Not_Eligible_Academic_Criteria'
      : 'All_Students';
    const batchLabel = downloadBatch === 'all' ? 'All_Batches' : `Batch_${downloadBatch}`;
    const filename = `Placement_${filterLabel}_${batchLabel}_${new Date().toISOString().split('T')[0]}.xlsx`;

    XLSX.writeFile(wb, filename);
    toast.success(`Successfully exported ${listToExport.length} students to ${filename}!`);
    setShowDownloadModal(false);
  };

  const handleDownloadPdf = () => {
    const listToExport = getFilteredExportList();

    if (listToExport.length === 0) {
      return toast.error('No students found matching the selected download criteria');
    }

    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
      const pageHeight = doc.internal.pageSize.getHeight(); // 210mm
      const margin = 12;

      const filterTitle = downloadFilter === 'want'
        ? 'WANT PLACEMENT FROM INSTITUTE'
        : downloadFilter === 'not_want'
        ? 'NOT WANT PLACEMENT FROM INSTITUTE'
        : downloadFilter === 'not_eligible_academic'
        ? 'NOT ELIGIBLE DUE TO ACADEMIC CRITERIA'
        : 'ALL ENROLLED STUDENTS';

      const batchTitle = downloadBatch === 'all' ? 'All Batches' : `Batch ${downloadBatch}`;
      const exportDate = new Date().toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      });

      // Columns configuration (Total printable: 273mm)
      const cols = [
        { header: '#', width: 12, align: 'center' },
        { header: 'Student Name', width: 48, align: 'left' },
        { header: 'Enrollment No', width: 36, align: 'left' },
        { header: 'Email ID', width: 54, align: 'left' },
        { header: 'Department', width: 26, align: 'left' },
        { header: 'Batch', width: 18, align: 'center' },
        { header: 'Placement Preference / Status', width: 54, align: 'left' },
        { header: 'Mentor', width: 25, align: 'left' },
      ];

      const drawHeader = (startY) => {
        // Dark Navy Banner
        doc.setFillColor(15, 23, 42);
        doc.rect(margin, startY, pageWidth - margin * 2, 17, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(255, 255, 255);
        doc.text('T&P CELL - PLACEMENT ENROLLED STUDENTS REPORT', margin + 6, startY + 6.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(203, 213, 225);
        doc.text(`Category: ${filterTitle}  |  Batch: ${batchTitle}  |  Export Count: ${listToExport.length}  |  Date: ${exportDate}`, margin + 6, startY + 12.5);

        // Summary badges
        let chipY = startY + 21;
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');

        const stats = [
          { label: `Total Enrolled: ${total}`, bg: [241, 245, 249], fg: [51, 65, 85] },
          { label: `Want Placement: ${wantCount}`, bg: [236, 253, 245], fg: [5, 150, 105] },
          { label: `Not Want: ${notWantCount}`, bg: [255, 241, 242], fg: [225, 29, 72] },
          { label: `Not Eligible (Academic): ${notEligibleAcademicCount}`, bg: [254, 243, 199], fg: [217, 119, 6] },
        ];

        let chipX = margin;
        stats.forEach(st => {
          doc.setFillColor(st.bg[0], st.bg[1], st.bg[2]);
          const chipW = doc.getTextWidth(st.label) + 6;
          doc.roundedRect(chipX, chipY, chipW, 5.5, 1.2, 1.2, 'F');
          doc.setTextColor(st.fg[0], st.fg[1], st.fg[2]);
          doc.text(st.label, chipX + 3, chipY + 3.8);
          chipX += chipW + 3;
        });

        return chipY + 9;
      };

      const drawTableHeader = (startY) => {
        doc.setFillColor(30, 41, 59);
        doc.rect(margin, startY, pageWidth - margin * 2, 7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(255, 255, 255);

        let curX = margin;
        cols.forEach(col => {
          if (col.align === 'center') {
            doc.text(col.header, curX + col.width / 2, startY + 4.6, { align: 'center' });
          } else {
            doc.text(col.header, curX + 2, startY + 4.6);
          }
          curX += col.width;
        });

        return startY + 7;
      };

      let currentY = drawHeader(margin);
      currentY = drawTableHeader(currentY);

      // Data Rows
      const rowHeight = 6.5;
      const bottomLimit = pageHeight - 14;

      listToExport.forEach((s, idx) => {
        if (currentY + rowHeight > bottomLimit) {
          doc.addPage();
          currentY = drawTableHeader(margin);
        }

        // Alternating background
        if (idx % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, currentY, pageWidth - margin * 2, rowHeight, 'F');
        }

        // Row border
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, currentY + rowHeight, pageWidth - margin, currentY + rowHeight);

        // Cells
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.2);
        doc.setTextColor(30, 41, 59);

        let curX = margin;

        // 1. S.No
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text(String(idx + 1), curX + cols[0].width / 2, currentY + 4.3, { align: 'center' });
        curX += cols[0].width;

        // 2. Student Name
        doc.setTextColor(15, 23, 42);
        doc.text(doc.splitTextToSize(s.name || '—', cols[1].width - 3)[0] || '', curX + 2, currentY + 4.3);
        curX += cols[1].width;

        // 3. Enrollment No
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(s.enrollmentNumber || '—', curX + 2, currentY + 4.3);
        curX += cols[2].width;

        // 4. Email
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        doc.text(doc.splitTextToSize(s.email || '—', cols[3].width - 3)[0] || '', curX + 2, currentY + 4.3);
        curX += cols[3].width;

        // 5. Department
        doc.text(doc.splitTextToSize(s.department || '—', cols[4].width - 3)[0] || '', curX + 2, currentY + 4.3);
        curX += cols[4].width;

        // 6. Batch
        doc.text(String(s.batch || '—'), curX + cols[5].width / 2, currentY + 4.3, { align: 'center' });
        curX += cols[5].width;

        // 7. Status / Placement Preference
        const pref = s.placementPreference || 'want';
        doc.setFont('helvetica', 'bold');
        if (pref === 'not_eligible_academic') {
          doc.setTextColor(180, 83, 9); // amber-700
          doc.text('Not Eligible (Academic Criteria)', curX + 2, currentY + 4.3);
        } else if (pref === 'not_want') {
          doc.setTextColor(190, 18, 60); // rose-700
          const remarkPart = s.placementPreferenceRemark ? ` (${s.placementPreferenceRemark})` : '';
          const fullText = `Not Want Placement${remarkPart}`;
          doc.text(doc.splitTextToSize(fullText, cols[6].width - 3)[0] || 'Not Want Placement', curX + 2, currentY + 4.3);
        } else {
          doc.setTextColor(4, 120, 87); // emerald-700
          doc.text('Want Placement', curX + 2, currentY + 4.3);
        }
        curX += cols[6].width;

        // 8. Mentor
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        const mentorName = s.mentor?.name || (typeof s.mentor === 'string' ? s.mentor : 'Unassigned');
        doc.text(doc.splitTextToSize(mentorName, cols[7].width - 3)[0] || '', curX + 2, currentY + 4.3);

        currentY += rowHeight;
      });

      // Footer with page numbering
      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.2);
        doc.setTextColor(148, 163, 184);
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, pageHeight - 9, pageWidth - margin, pageHeight - 9);
        doc.text('Confidential - Training & Placement Department', margin, pageHeight - 5);
        doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
      }

      const filterLabel = downloadFilter === 'want'
        ? 'Want_Placement'
        : downloadFilter === 'not_want'
        ? 'Not_Want_Placement'
        : downloadFilter === 'not_eligible_academic'
        ? 'Not_Eligible_Academic_Criteria'
        : 'All_Students';
      const batchLabel = downloadBatch === 'all' ? 'All_Batches' : `Batch_${downloadBatch}`;
      const filename = `Placement_${filterLabel}_${batchLabel}_${new Date().toISOString().split('T')[0]}.pdf`;

      doc.save(filename);
      toast.success(`Successfully exported PDF for ${listToExport.length} students!`);
      setShowDownloadModal(false);
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  const batchColors = [
    { bg: 'from-purple-500/10 to-violet-500/5', border: 'border-purple-500/20', text: 'text-purple-500', badge: 'bg-purple-500/10 text-purple-400' },
    { bg: 'from-blue-500/10 to-cyan-500/5', border: 'border-blue-500/20', text: 'text-blue-500', badge: 'bg-blue-500/10 text-blue-400' },
    { bg: 'from-emerald-500/10 to-teal-500/5', border: 'border-emerald-500/20', text: 'text-emerald-500', badge: 'bg-emerald-500/10 text-emerald-400' },
    { bg: 'from-amber-500/10 to-orange-500/5', border: 'border-amber-500/20', text: 'text-amber-500', badge: 'bg-amber-500/10 text-amber-400' },
    { bg: 'from-rose-500/10 to-pink-500/5', border: 'border-rose-500/20', text: 'text-rose-500', badge: 'bg-rose-500/10 text-rose-400' },
  ];

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="glass-card p-8"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <UserPlus className="text-emerald-500" size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-display font-black text-[var(--text-primary)] tracking-tight">Enroll Students</h1>
                <p className="text-[var(--text-secondary)] text-sm font-medium mt-0.5">Upload Excel to enroll students in T&P placement drives</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="glass-card px-4 py-2.5 flex items-center gap-3">
              <Users className="text-purple-500" size={18} />
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Total</p>
                <p className="text-xl font-display font-black text-[var(--text-primary)]">{total}</p>
              </div>
            </div>

            <div className="glass-card px-4 py-2.5 flex items-center gap-3 border-emerald-500/20 bg-emerald-500/5">
              <CheckCircle2 className="text-emerald-500" size={18} />
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Want Placement</p>
                <p className="text-xl font-display font-black text-emerald-600">{wantCount}</p>
              </div>
            </div>

            <div className="glass-card px-4 py-2.5 flex items-center gap-3 border-rose-500/20 bg-rose-500/5">
              <XCircle className="text-rose-500" size={18} />
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-rose-500">Not Want</p>
                <p className="text-xl font-display font-black text-rose-500">{notWantCount}</p>
              </div>
            </div>

            <div className="glass-card px-4 py-2.5 flex items-center gap-3 border-amber-500/20 bg-amber-500/5">
              <AlertTriangle className="text-amber-500" size={18} />
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-amber-600">Not Eligible (Academic)</p>
                <p className="text-xl font-display font-black text-amber-600">{notEligibleAcademicCount}</p>
              </div>
            </div>

            <button
              onClick={() => setShowDownloadModal(true)}
              className="flex items-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              title="Download Students List"
            >
              <Download size={16} /> Download List
            </button>

            <button onClick={fetchEnrolledStudents} className="btn-outline-premium p-3 rounded-xl" title="Refresh">
              <RefreshCw size={18} className={loadingStudents ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Excel Upload Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
        className="glass-card p-8"
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-lg font-display font-black text-[var(--text-primary)] mb-1">Upload Enrollment Excel</h2>
            <p className="text-[13px] text-[var(--text-secondary)] font-medium">
              Excel should have columns: <span className="font-bold text-[var(--text-primary)]">Name, Enrollment No, Email, Mobile</span> (batch & department optional)
            </p>
          </div>
          <a
            href="/upload/enroll%20for%20drive.xlsx"
            download="enroll_for_drive.xlsx"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/20 transition-all text-xs font-bold whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet size={16} /> Download Template
          </a>
        </div>

        <form onSubmit={handleUpload} className="space-y-6">
          {/* Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
              file ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-[var(--border-light)] bg-[var(--bg-input)]/20 hover:bg-[var(--bg-input)]/40 hover:border-[var(--primary)]/50'
            }`}
            onClick={() => document.getElementById('enroll-excel-input').click()}
          >
            <input
              id="enroll-excel-input"
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => setFile(e.target.files[0])}
            />
            {file ? (
              <div className="space-y-3">
                <FileSpreadsheet className="text-emerald-500 mx-auto" size={48} />
                <p className="text-base font-black text-[var(--text-primary)]">{file.name}</p>
                <p className="text-[11px] text-emerald-500 uppercase font-bold tracking-widest">Click to change file</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-light)] flex items-center justify-center mx-auto">
                  <Upload className="text-[var(--text-secondary)]" size={28} />
                </div>
                <p className="text-base font-black text-[var(--text-primary)]">Drop Excel file here or click to browse</p>
                <p className="text-xs text-[var(--text-secondary)]">Supports .xlsx and .xls files</p>
              </div>
            )}
          </div>

          {/* Info boxes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { label: 'Required Columns', value: 'Name, Enrollment No, Email', icon: FileSpreadsheet },
              { label: 'Optional Columns', value: 'Mobile, Department, Batch', icon: BookOpen },
              { label: 'On Success', value: 'Email sent to each student', icon: Mail },
            ].map((item, i) => (
              <div key={i} className="bg-[var(--bg-input)]/30 border border-[var(--border-light)] rounded-xl p-3 flex items-start gap-3">
                <item.icon size={16} className="text-[var(--primary)] mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">{item.label}</p>
                  <p className="text-[12px] font-bold text-[var(--text-primary)] mt-0.5">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={uploading || !file}
            className="btn-premium w-full py-4 text-base flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enrolling & Sending Emails...</>
            ) : (
              <><UserPlus size={20} /> Upload & Enroll Students</>
            )}
          </button>
        </form>
      </motion.div>

      {/* Enrolled Students by Batch */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-display font-black text-[var(--text-primary)]">Enrolled Students by Batch</h2>
            <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">Filter by preference or export student lists to Excel</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Tabs */}
            <div className="inline-flex items-center p-1 bg-[var(--bg-input)]/50 border border-[var(--border-light)] rounded-xl text-xs font-bold gap-1">
              <button
                type="button"
                onClick={() => setPreferenceFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  preferenceFilter === 'all'
                    ? 'bg-[var(--primary)] text-white shadow-sm font-black'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                All ({total})
              </button>
              <button
                type="button"
                onClick={() => setPreferenceFilter('want')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  preferenceFilter === 'want'
                    ? 'bg-emerald-600 text-white shadow-sm font-black'
                    : 'text-[var(--text-secondary)] hover:text-emerald-500'
                }`}
              >
                Want Placement ({wantCount})
              </button>
              <button
                type="button"
                onClick={() => setPreferenceFilter('not_want')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  preferenceFilter === 'not_want'
                    ? 'bg-rose-600 text-white shadow-sm font-black'
                    : 'text-[var(--text-secondary)] hover:text-rose-500'
                }`}
              >
                Not Want ({notWantCount})
              </button>
              <button
                type="button"
                onClick={() => setPreferenceFilter('not_eligible_academic')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  preferenceFilter === 'not_eligible_academic'
                    ? 'bg-amber-600 text-white shadow-sm font-black'
                    : 'text-[var(--text-secondary)] hover:text-amber-500'
                }`}
              >
                Not Eligible (Academic Criteria) ({notEligibleAcademicCount})
              </button>
            </div>

            <button
              onClick={() => setShowDownloadModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Download size={14} /> Download List
            </button>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-[var(--text-secondary)] opacity-60" size={16} />
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-[var(--bg-card)] border border-[var(--border-light)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary)] transition-all font-medium w-48"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {loadingStudents ? (
          <div className="glass-card p-16 text-center">
            <div className="w-10 h-10 border-4 border-purple-500/20 border-t-[var(--primary)] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[var(--text-secondary)] font-medium">Loading enrolled students...</p>
          </div>
        ) : batches.length === 0 ? (
          <div className="glass-card p-16 text-center border-dashed">
            <div className="w-20 h-20 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-3xl flex items-center justify-center mx-auto mb-6">
              <GraduationCap className="text-[var(--text-secondary)] opacity-40" size={40} />
            </div>
            <h3 className="text-xl font-display font-black text-[var(--text-primary)]">No Students Enrolled Yet</h3>
            <p className="text-[var(--text-secondary)] font-medium mt-2 max-w-sm mx-auto">Upload an Excel file above to enroll students in the T&P placement system.</p>
          </div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
            {batches.map((batchData, idx) => {
              const color = batchColors[idx % batchColors.length];
              const isExpanded = expandedBatch === batchData.batch;

              const filteredStudents = batchData.students.filter(s => {
                const matchesSearch = !searchQuery || (
                  s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  s.enrollmentNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  s.placementPreferenceRemark?.toLowerCase().includes(searchQuery.toLowerCase())
                );
                const pref = s.placementPreference || 'want';
                const matchesPref = preferenceFilter === 'all' || pref === preferenceFilter;
                return matchesSearch && matchesPref;
              });

              const shouldShow = !searchQuery && preferenceFilter === 'all' ? true : filteredStudents.length > 0;
              if (!shouldShow) return null;

              return (
                <motion.div key={batchData.batch} variants={itemVariants} className={`glass-card overflow-hidden border ${color.border}`}>
                  {/* Batch Header — always visible, click to expand */}
                  <button
                    className={`w-full p-6 flex items-center justify-between bg-gradient-to-r ${color.bg} transition-all`}
                    onClick={() => setExpandedBatch(isExpanded ? null : batchData.batch)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl border ${color.border} flex items-center justify-center bg-white/5`}>
                        <GraduationCap className={color.text} size={24} />
                      </div>
                      <div className="text-left">
                        <h3 className={`text-xl font-display font-black ${color.text}`}>Batch {batchData.batch}</h3>
                        <p className="text-[var(--text-secondary)] text-sm font-medium mt-0.5">
                          {filteredStudents.length} of {batchData.count} students shown
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBatchForManualAdd(batchData.batch);
                          setShowManualAddModal(true);
                        }}
                        className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-all shadow-sm`}
                      >
                        <UserPlus size={14} /> Add Student
                      </button>
                      <div className={`${color.badge} px-4 py-2 rounded-xl border ${color.border} text-sm font-black`}>
                        {batchData.count} Students
                      </div>
                      {isExpanded ? <ChevronUp className={color.text} size={20} /> : <ChevronDown className={color.text} size={20} />}
                    </div>
                  </button>

                  {/* Expanded Students Table */}
                  <AnimatePresence>
                    {(isExpanded || searchQuery || preferenceFilter !== 'all') && filteredStudents.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-[var(--border-light)] overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-[var(--bg-input)]/30">
                                <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">#</th>
                                <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Name</th>
                                <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Enrollment No</th>
                                <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Email</th>
                                <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Mentor</th>
                                <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Department</th>
                                <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Mobile</th>
                                <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Placement Preference (Institute)</th>
                                <th className="text-right px-6 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-light)]">
                              {filteredStudents.map((student, sIdx) => (
                                <tr key={student._id} className="hover:bg-[var(--bg-input)]/20 transition-colors">
                                  <td className="px-6 py-4 text-[13px] font-bold text-[var(--text-secondary)]">{sIdx + 1}</td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-lg ${color.badge} border ${color.border} flex items-center justify-center text-xs font-black`}>
                                        {student.name?.[0]?.toUpperCase()}
                                      </div>
                                      <span className="text-[14px] font-bold text-[var(--text-primary)]">{student.name}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-[13px] font-bold text-[var(--text-primary)]">{student.enrollmentNumber || '—'}</td>
                                  <td className="px-6 py-4">
                                    <a href={`mailto:${student.email}`} className={`text-[13px] font-bold ${color.text} flex items-center gap-1 hover:opacity-80`}>
                                      <Mail size={12} /> {student.email}
                                    </a>
                                  </td>
                                  <td className="px-6 py-4">
                                    {student.mentor ? (
                                      <span className={`text-[10px] bg-[var(--bg-input)] ${color.text} px-2 py-1 rounded border border-[var(--border-light)] whitespace-nowrap`}>
                                        {student.mentor.name || student.mentor}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 text-xs italic">Unassigned</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-[13px] font-medium text-[var(--text-secondary)]">{student.department || '—'}</td>
                                  <td className="px-6 py-4 text-[13px] font-medium text-[var(--text-secondary)]">
                                    {student.mobile ? (
                                      <span className="flex items-center gap-1"><Phone size={12} /> {student.mobile}</span>
                                    ) : '—'}
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1.5 items-start">
                                      <div className="inline-flex items-center p-1 bg-[var(--bg-input)]/70 border border-[var(--border-light)] rounded-xl gap-1 shadow-sm">
                                        <button
                                          type="button"
                                          onClick={() => handleUpdatePreference(student._id, 'want')}
                                          disabled={updatingStudentId === student._id}
                                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                            (student.placementPreference || 'want') === 'want'
                                              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 font-black'
                                              : 'text-[var(--text-secondary)] hover:text-emerald-500 hover:bg-emerald-500/10'
                                          }`}
                                          title="Student wants placement from institute"
                                        >
                                          <CheckCircle2 size={13} className={(student.placementPreference || 'want') === 'want' ? 'text-white' : 'text-emerald-500'} />
                                          <span>Want Placement</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleOpenNotWantModal(student)}
                                          disabled={updatingStudentId === student._id}
                                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                            student.placementPreference === 'not_want'
                                              ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30 font-black'
                                              : 'text-[var(--text-secondary)] hover:text-rose-500 hover:bg-rose-500/10'
                                          }`}
                                          title={student.placementPreference === 'not_want' ? 'Click to edit remark' : 'Mark as Not Want and add remark'}
                                        >
                                          <XCircle size={13} className={student.placementPreference === 'not_want' ? 'text-white' : 'text-rose-500'} />
                                          <span>Not Want</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleUpdatePreference(student._id, 'not_eligible_academic')}
                                          disabled={updatingStudentId === student._id}
                                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                            student.placementPreference === 'not_eligible_academic'
                                              ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30 font-black'
                                              : 'text-[var(--text-secondary)] hover:text-amber-500 hover:bg-amber-500/10'
                                          }`}
                                          title="Student not eligible due to academic criteria"
                                        >
                                          <AlertTriangle size={13} className={student.placementPreference === 'not_eligible_academic' ? 'text-white' : 'text-amber-500'} />
                                          <span>Not Eligible (Academic Criteria)</span>
                                        </button>
                                      </div>

                                      {/* Saved Remark indicator for Not Want */}
                                      {student.placementPreference === 'not_want' && (
                                        <div className="flex items-center gap-1.5 text-xs">
                                          <span
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 text-[11px] font-semibold max-w-sm truncate shadow-xs"
                                            title={student.placementPreferenceRemark ? `Reason: ${student.placementPreferenceRemark}` : 'No remark specified'}
                                          >
                                            <MessageSquare size={12} className="shrink-0 text-rose-500" />
                                            <span className="truncate">
                                              <strong className="font-bold text-rose-600 dark:text-rose-400">Reason:</strong>{' '}
                                              {student.placementPreferenceRemark || <span className="italic opacity-70">No remark entered</span>}
                                            </span>
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => handleOpenNotWantModal(student)}
                                            className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline cursor-pointer bg-rose-500/5 hover:bg-rose-500/15 px-2 py-0.5 rounded-md border border-rose-500/10 transition-colors"
                                            title="Edit Remark"
                                          >
                                            <Edit3 size={11} />
                                            <span>{student.placementPreferenceRemark ? 'Edit' : 'Add Remark'}</span>
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <button 
                                      onClick={() => handleUnenroll(student._id, student.name)} 
                                      className="text-red-500 hover:text-red-700 bg-red-500/5 hover:bg-red-500/10 p-2 rounded-xl border border-red-500/10 hover:border-red-500/20 transition-all"
                                      title="Remove from Placements"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Manual Student Add Modal */}
      {showManualAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-[var(--bg-modal)] border border-[var(--border-light)] shadow-xl rounded-3xl relative" style={{ width: '90%', maxWidth: 455, padding: 32 }}>
            <button onClick={() => setShowManualAddModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-[var(--text-primary)] bg-[var(--bg-input)]/50 p-2 rounded-full transition-colors">
              <X size={20} />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 mb-4 shadow-sm">
              <UserPlus size={24} />
            </div>
            <h2 className="text-xl font-display font-black text-[var(--text-primary)] mb-1">Add Student to Batch {selectedBatchForManualAdd}</h2>
            <p className="text-[13px] text-[var(--text-secondary)] font-medium mb-6">Enroll registered students into this placement batch.</p>

            <form onSubmit={handleManualEnroll} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Enrollment Numbers (comma separated) *</label>
                <textarea
                  required
                  value={manualEnrollmentNumbers}
                  onChange={(e) => setManualEnrollmentNumbers(e.target.value)}
                  placeholder="e.g., 0187CS231084, 0187CS231085"
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-2.5 px-4 text-[13px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all shadow-sm resize-none h-28"
                />
                <p className="text-[11px] text-[var(--text-secondary)] mt-1.5 leading-normal">
                  Enter one or more comma-separated enrollment numbers. The students must already be registered in the database.
                </p>
              </div>

              <button type="submit" className="btn-premium w-full py-3 mt-6 flex items-center justify-center gap-2" disabled={enrollingManual}>
                {enrollingManual ? 'Enrolling...' : (
                  <>
                    <UserPlus size={16} /> Enroll Student(s)
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Download Enrolled Students Modal */}
      {showDownloadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-[var(--bg-modal)] border border-[var(--border-light)] shadow-2xl rounded-3xl relative" style={{ width: '92%', maxWidth: 520, padding: 32 }}>
            <button onClick={() => setShowDownloadModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-[var(--text-primary)] bg-[var(--bg-input)]/50 p-2 rounded-full transition-colors cursor-pointer">
              <X size={20} />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 mb-4 shadow-sm">
              <Download size={24} />
            </div>
            <h2 className="text-2xl font-display font-black text-[var(--text-primary)] mb-1">Download Enrolled Students</h2>
            <p className="text-[13px] text-[var(--text-secondary)] font-medium mb-6">
              Select which category of students you want to export into Excel (.xlsx) or PDF (.pdf).
            </p>

            {/* Selectable Categories */}
            <div className="space-y-3 mb-6">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Category to Export *</label>

              {/* 1. All Students */}
              <div
                onClick={() => setDownloadFilter('all')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                  downloadFilter === 'all'
                    ? 'border-emerald-500 bg-emerald-500/5 shadow-sm'
                    : 'border-[var(--border-light)] bg-[var(--bg-input)]/20 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${downloadFilter === 'all' ? 'bg-emerald-500 text-white' : 'bg-[var(--bg-card)] text-slate-400 border border-[var(--border-light)]'}`}>
                    <Users size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-[var(--text-primary)]">All Students</h4>
                    <p className="text-xs text-[var(--text-secondary)] font-medium">Download complete enrolled student records</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-[var(--text-primary)]">{total}</span>
                  <span className="text-[10px] block text-[var(--text-secondary)] uppercase font-bold">Students</span>
                </div>
              </div>

              {/* 2. Want Placement */}
              <div
                onClick={() => setDownloadFilter('want')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                  downloadFilter === 'want'
                    ? 'border-emerald-500 bg-emerald-500/5 shadow-sm'
                    : 'border-[var(--border-light)] bg-[var(--bg-input)]/20 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${downloadFilter === 'want' ? 'bg-emerald-600 text-white' : 'bg-[var(--bg-card)] text-emerald-500 border border-[var(--border-light)]'}`}>
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-[var(--text-primary)]">Want Placement from Institute</h4>
                    <p className="text-xs text-[var(--text-secondary)] font-medium">Only students who want institute placement</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-emerald-600">{wantCount}</span>
                  <span className="text-[10px] block text-[var(--text-secondary)] uppercase font-bold">Students</span>
                </div>
              </div>

              {/* 3. Not Want Placement */}
              <div
                onClick={() => setDownloadFilter('not_want')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                  downloadFilter === 'not_want'
                    ? 'border-rose-500 bg-rose-500/5 shadow-sm'
                    : 'border-[var(--border-light)] bg-[var(--bg-input)]/20 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${downloadFilter === 'not_want' ? 'bg-rose-600 text-white' : 'bg-[var(--bg-card)] text-rose-500 border border-[var(--border-light)]'}`}>
                    <XCircle size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-[var(--text-primary)]">Not Want Placement from Institute</h4>
                    <p className="text-xs text-[var(--text-secondary)] font-medium">Students opted out / not wanting placement</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-rose-600">{notWantCount}</span>
                  <span className="text-[10px] block text-[var(--text-secondary)] uppercase font-bold">Students</span>
                </div>
              </div>

              {/* 4. Not Eligible due to Academic Criteria */}
              <div
                onClick={() => setDownloadFilter('not_eligible_academic')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                  downloadFilter === 'not_eligible_academic'
                    ? 'border-amber-500 bg-amber-500/5 shadow-sm'
                    : 'border-[var(--border-light)] bg-[var(--bg-input)]/20 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${downloadFilter === 'not_eligible_academic' ? 'bg-amber-600 text-white' : 'bg-[var(--bg-card)] text-amber-500 border border-[var(--border-light)]'}`}>
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-[var(--text-primary)]">Not Eligible due to Academic Criteria</h4>
                    <p className="text-xs text-[var(--text-secondary)] font-medium">Students not meeting academic criteria for placement</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-amber-600">{notEligibleAcademicCount}</span>
                  <span className="text-[10px] block text-[var(--text-secondary)] uppercase font-bold">Students</span>
                </div>
              </div>
            </div>

            {/* Batch Filter Option */}
            <div className="mb-6">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Filter by Batch (Optional)</label>
              <select
                value={downloadBatch}
                onChange={(e) => setDownloadBatch(e.target.value)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-2.5 px-4 text-[13px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all shadow-sm"
              >
                <option value="all">All Batches ({total} Students)</option>
                {batches.map(b => (
                  <option key={b.batch} value={b.batch}>Batch {b.batch} ({b.count} Students)</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => setShowDownloadModal(false)}
                className="btn-outline-premium px-4 py-3 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDownloadExcel}
                className="btn-outline-premium flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
              >
                <FileSpreadsheet size={16} /> Download Excel (.xlsx)
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="btn-premium flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-md shadow-rose-600/20"
              >
                <FileText size={16} /> Download PDF (.pdf)
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {/* Modal for 'Not Want Placement' Remark */}
      {remarkModalStudent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="bg-[var(--bg-modal)] border border-[var(--border-light)] shadow-2xl rounded-3xl relative overflow-hidden"
            style={{ width: '92%', maxWidth: 540, padding: 30 }}
          >
            <button
              onClick={handleCloseNotWantModal}
              disabled={savingRemark}
              className="absolute top-5 right-5 text-slate-400 hover:text-[var(--text-primary)] bg-[var(--bg-input)]/60 hover:bg-[var(--bg-input)] p-2 rounded-full transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20 shadow-sm shrink-0">
                <XCircle size={24} />
              </div>
              <div>
                <h3 className="text-xl font-display font-black text-[var(--text-primary)] leading-tight">
                  Placement Opt-Out Remark
                </h3>
                <p className="text-xs text-[var(--text-secondary)] font-medium">
                  Specify reason why student does not want placement
                </p>
              </div>
            </div>

            {/* Student Info Card */}
            <div className="p-3.5 rounded-2xl bg-[var(--bg-input)]/40 border border-[var(--border-light)] mb-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black">
                  {remarkModalStudent.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-[var(--text-primary)] text-sm">{remarkModalStudent.name}</h4>
                  <p className="text-[11px] text-[var(--text-secondary)] font-medium">
                    {remarkModalStudent.enrollmentNumber || 'No Enrollment No'} • {remarkModalStudent.department || 'Dept'}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-600 border border-rose-500/30">
                Not Want Placement
              </span>
            </div>

            <form onSubmit={handleSaveNotWantRemark} className="space-y-4">
              {/* Preset Quick Tags */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                  Quick Select Reason
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {PRESET_NOT_WANT_REMARKS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setRemarkText(tag)}
                      className={`text-[11px] px-2.5 py-1.5 rounded-xl border font-bold transition-all text-left cursor-pointer ${
                        remarkText === tag
                          ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                          : 'bg-[var(--bg-input)]/50 text-[var(--text-secondary)] border-[var(--border-light)] hover:border-rose-400/50 hover:text-rose-600'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Faculty Remark / Detailed Reason *
                  </label>
                  <span className="text-[10px] text-[var(--text-secondary)] font-mono">
                    {remarkText.length} chars
                  </span>
                </div>
                <textarea
                  required
                  rows={3}
                  value={remarkText}
                  onChange={(e) => setRemarkText(e.target.value)}
                  placeholder="e.g. Preparing for GATE 2026, already secured off-campus job at TCS, family business..."
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-2.5 px-3.5 text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none shadow-sm"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleCloseNotWantModal}
                  disabled={savingRemark}
                  className="btn-outline-premium px-4 py-2.5 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRemark || !remarkText.trim()}
                  className="btn-premium flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-md shadow-rose-600/20 disabled:opacity-50"
                >
                  {savingRemark ? (
                    'Saving Remark...'
                  ) : (
                    <>
                      <CheckCircle size={15} /> Save & Mark Not Want
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default EnrollStudentsPage;
