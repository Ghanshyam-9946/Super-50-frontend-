import React from 'react';
import sistecLogo from '../assets/SISTec_Logo.png';

export default function StudentAcademicDossier({ data, portalLabel = 'MILE Verified Official Academic Record' }) {
  if (!data || !data.student) return null;

  const {
    student = {},
    certificates = [],
    activities = [],
    team = null,
    placementApplications = [],
    mstResults = [],
    amcatResults = [],
    super50Registration = null,
    rgpvResults = [],
    semesterAttendance = [],
    attendanceLogs = [],
    noDuesForm = null,
    studentSessionalMarks = [],
    podAI = { marks: [], analytics: { totalTests: 0, averageMarks: 0, highestMarks: 0, totalMarks: 0 } },
  } = data;

  const cgpa = student.cgpa || 0;
  const attPercent = student.attendancePercentage !== undefined ? student.attendancePercentage : 0;
  const duesFees = noDuesForm?.accountsDuesAmount !== undefined ? noDuesForm.accountsDuesAmount : 0;
  const remarks = student.remarks || [];

  return (
    <>
      <style>{`
        @media screen {
          .print-only {
            display: none !important;
          }
        }
        @media print {
          html, body, #root {
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            position: static !important;
          }
          
          /* Hide all screen interactive elements and layout chrome */
          .no-print, header, nav, aside, footer, button, .modal, [role="dialog"], .fixed, .sticky, .backdrop-blur-sm {
            display: none !important;
            visibility: hidden !important;
          }

          /* Force .print-only to flow across all printed pages naturally */
          .print-only {
            display: block !important;
            visibility: visible !important;
            position: static !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            overflow: visible !important;
          }

          .print-only * {
            visibility: visible !important;
          }

          .break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          table {
            page-break-inside: auto !important;
          }

          tr {
            page-break-inside: avoid !important;
            page-break-after: auto !important;
          }

          @page {
            size: A4 portrait;
            margin: 10mm 10mm 10mm 10mm;
          }
        }
      `}</style>

      <div className="print-only font-sans text-slate-900 bg-white max-w-5xl mx-auto space-y-4 text-xs leading-normal">
        {/* ========================================== */}
        {/* 1. Official SISTec Institutional Header    */}
        {/* ========================================== */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 break-inside-avoid">
          <div className="flex items-center gap-3.5">
            <img
              src={sistecLogo}
              alt="SISTec Logo"
              className="h-14 w-auto object-contain shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div>
              <h1 className="text-base font-black uppercase tracking-tight text-slate-950">
                Sagar Institute of Science and Technology (SISTec)
              </h1>
              <p className="text-[11px] font-bold text-slate-800">
                Comprehensive Student Academic Dossier & Master Profile
              </p>
              <p className="text-[9px] text-slate-600 font-semibold">
                {portalLabel} • Sagar Group of Institutions, Bhopal
              </p>
            </div>
          </div>
          <div className="text-right space-y-0.5 shrink-0">
            <div className="font-bold text-slate-900 text-[10px]">
              Report Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
            <div className="text-[9px] font-mono font-bold text-slate-700 uppercase">
              Official Confidential Record
            </div>
            {student.isSuper50 && (
              <span className="inline-block bg-slate-900 text-white font-black text-[8px] uppercase px-2 py-0.5 rounded">
                Super 50 Elite Batch
              </span>
            )}
          </div>
        </div>

        {/* ========================================== */}
        {/* 2. Student Master Profile & Contact Data   */}
        {/* ========================================== */}
        <div className="border border-slate-300 rounded-lg p-3 space-y-2 break-inside-avoid">
          <div className="font-black text-[11px] uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 flex justify-between">
            <span>1. Student Profile & Contact Information</span>
            <span className="text-slate-700 font-bold">Enrollment No: {student.enrollmentNumber || student.enrollmentNo || 'N/A'}</span>
          </div>
          <div className="grid grid-cols-3 gap-x-4 gap-y-1.5 text-[11px]">
            <div><span className="text-slate-500 font-medium">Full Name:</span> <strong className="text-slate-900">{student.name}</strong></div>
            <div><span className="text-slate-500 font-medium">Department:</span> <strong className="text-slate-900">{student.department || 'Engineering'}</strong></div>
            <div><span className="text-slate-500 font-medium">Batch / Year:</span> <strong className="text-slate-900">{student.batch || 'N/A'}</strong></div>
            <div><span className="text-slate-500 font-medium">Current Semester:</span> <strong className="text-slate-900">{student.semester ? `${student.semester}th Semester` : 'N/A'}</strong></div>
            <div><span className="text-slate-500 font-medium">Section:</span> <strong className="text-slate-900">{student.section || 'N/A'}</strong></div>
            <div><span className="text-slate-500 font-medium">Residence:</span> <strong className="text-slate-900">{student.residenceType || 'Day Scholar'}</strong></div>
            <div><span className="text-slate-500 font-medium">10th Percentage:</span> <strong className="text-slate-900">{student.tenthPercentage ? `${student.tenthPercentage}%` : 'N/A'}</strong></div>
            <div><span className="text-slate-500 font-medium">12th Percentage:</span> <strong className="text-slate-900">{student.twelfthPercentage ? `${student.twelfthPercentage}%` : 'N/A'}</strong></div>
            <div><span className="text-slate-500 font-medium">Student Phone:</span> <strong className="text-slate-900">{student.mobile || student.phone || 'N/A'}</strong></div>
            <div><span className="text-slate-500 font-medium">WhatsApp:</span> <strong className="text-slate-900">{student.whatsapp || 'N/A'}</strong></div>
            <div><span className="text-slate-500 font-medium">Parent Mobile:</span> <strong className="text-slate-900">{student.parentMobile || 'N/A'}</strong></div>
            <div><span className="text-slate-500 font-medium">Student Email:</span> <strong className="text-slate-900">{student.email || 'N/A'}</strong></div>
            <div className="col-span-3"><span className="text-slate-500 font-medium">Address:</span> <strong className="text-slate-900">{student.address || 'N/A'}</strong></div>
          </div>

          {student.mentor && (
            <div className="border-t border-slate-200 pt-1.5 flex items-center justify-between text-[11px] bg-slate-50 px-2.5 py-1 rounded">
              <div>
                <span className="text-slate-500 font-medium">Assigned TG Mentor: </span>
                <strong className="text-slate-900">{student.mentor.name}</strong> {student.mentor.designation ? `(${student.mentor.designation})` : ''}
              </div>
              <div className="flex gap-4">
                {student.mentor.mobile && <span>Mobile: <strong>{student.mentor.mobile}</strong></span>}
                {student.mentor.email && <span>Email: <strong>{student.mentor.email}</strong></span>}
              </div>
            </div>
          )}
        </div>

        {/* ========================================== */}
        {/* 3. Performance Scorecard & Metrics         */}
        {/* ========================================== */}
        <div className="grid grid-cols-5 gap-2 break-inside-avoid">
          <div className="border border-slate-300 p-2 rounded-lg text-center bg-slate-50">
            <div className="text-[9px] font-bold uppercase text-slate-500">Cumulative CGPA</div>
            <div className="text-base font-black text-slate-900">{cgpa > 0 ? Number(cgpa).toFixed(2) : 'N/A'} <span className="text-[10px] text-slate-500">/ 10</span></div>
          </div>
          <div className="border border-slate-300 p-2 rounded-lg text-center bg-slate-50">
            <div className="text-[9px] font-bold uppercase text-slate-500">Overall Attendance</div>
            <div className="text-base font-black text-slate-900">{Number(attPercent).toFixed(1)}%</div>
          </div>
          <div className="border border-slate-300 p-2 rounded-lg text-center bg-slate-50">
            <div className="text-[9px] font-bold uppercase text-slate-500">Performance Score</div>
            <div className="text-base font-black text-slate-900">{student.performanceScore !== undefined ? Math.round(student.performanceScore) : 'N/A'}</div>
          </div>
          <div className="border border-slate-300 p-2 rounded-lg text-center bg-slate-50">
            <div className="text-[9px] font-bold uppercase text-slate-500">Fee Clearance</div>
            <div className="text-base font-black text-slate-900">{duesFees === 0 ? 'CLEARED' : `₹${duesFees}`}</div>
          </div>
          <div className="border border-slate-300 p-2 rounded-lg text-center bg-slate-50">
            <div className="text-[9px] font-bold uppercase text-slate-500">Drives & Certs</div>
            <div className="text-base font-black text-slate-900">{placementApplications.length} Drives / {certificates.length} Certs</div>
          </div>
        </div>

        {/* ========================================== */}
        {/* 4. RGPV University Semester Results        */}
        {/* ========================================== */}
        <div className="border border-slate-300 rounded-lg p-3 space-y-2 break-inside-avoid">
          <div className="font-black text-[11px] uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
            2. RGPV University Semester Examination Results
          </div>
          {rgpvResults.length === 0 ? (
            <div className="text-slate-500 italic py-1 text-[11px]">No official RGPV semester results uploaded yet.</div>
          ) : (
            <div className="space-y-2.5">
              {rgpvResults.map((r, idx) => (
                <div key={r._id || idx} className="border border-slate-200 rounded p-2.5 bg-slate-50/50 space-y-1.5 break-inside-avoid">
                  <div className="flex justify-between items-center text-[11px] font-bold border-b border-slate-200 pb-1">
                    <span>Semester {r.semester} Result — Status: <strong className={r.resultDecision === 'FAIL' ? 'text-rose-700' : 'text-emerald-700'}>{r.resultDecision || 'PASS'}</strong></span>
                    <span>SGPA: <strong>{r.sgpa ? Number(r.sgpa).toFixed(2) : 'N/A'}</strong> | CGPA: <strong>{r.cgpa ? Number(r.cgpa).toFixed(2) : 'N/A'}</strong></span>
                  </div>
                  {r.grades && Object.keys(r.grades).length > 0 ? (
                    <div className="grid grid-cols-4 gap-1.5 text-[10px]">
                      {Object.entries(r.grades).map(([sub, grade]) => (
                        <div key={sub} className="flex justify-between border-b border-slate-200 py-0.5 px-1 bg-white rounded">
                          <span className="truncate mr-2 font-medium" title={sub}>{sub}</span>
                          <span className="font-black text-slate-900">{String(grade)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-500 italic">No subject grades recorded for this semester</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ========================================== */}
        {/* 5. Mid-Semester Tests (MST) Marks Table    */}
        {/* ========================================== */}
        <div className="border border-slate-300 rounded-lg p-3 space-y-2 break-inside-avoid">
          <div className="font-black text-[11px] uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
            3. Mid-Semester Tests (MST) Subject-Wise Scores
          </div>
          {mstResults.length === 0 ? (
            <div className="text-slate-500 italic py-1 text-[11px]">No Mid-Semester Test (MST) records found.</div>
          ) : (
            <div className="space-y-2.5">
              {mstResults.map((mst, idx) => {
                const testLabel = mst.testName || `MST Assessment ${idx + 1}`;
                const testNameLower = (mst.testName || '').toLowerCase();
                let calculatedTotal = 0;
                let totalMaxMarks = 0;
                const scoreEntries = [];

                Object.entries(mst.scores || {}).forEach(([subject, score]) => {
                  const lowerSub = subject.toLowerCase();
                  if (lowerSub.includes('total') || lowerSub.includes('id') || lowerSub.includes('enrollment') || lowerSub.includes('roll')) {
                    return;
                  }

                  const numericScore = Number(score);
                  if (!isNaN(numericScore)) {
                    calculatedTotal += numericScore;
                    const isCrt = lowerSub.includes('crt') || lowerSub.includes('aptitude');
                    let maxMarks = 100;
                    if (!isCrt) {
                      if (testNameLower.includes('mst-1') || testNameLower.includes('mst 1') || testNameLower.includes('mst1')) {
                        maxMarks = 28;
                      } else if (testNameLower.includes('mst-2') || testNameLower.includes('mst 2') || testNameLower.includes('mst2')) {
                        maxMarks = 42;
                      }
                    }
                    totalMaxMarks += maxMarks;
                  }
                  scoreEntries.push([subject, score]);
                });

                return (
                  <div key={mst._id || idx} className="border border-slate-200 rounded p-2.5 bg-slate-50/50 space-y-1.5 break-inside-avoid">
                    <div className="flex justify-between items-center text-[11px] font-bold border-b border-slate-200 pb-1">
                      <span>{testLabel} ({mst.semester ? `Semester ${mst.semester}` : 'Current Semester'})</span>
                      <span>
                        Grand Total: <strong>{calculatedTotal}</strong> {totalMaxMarks > 0 && <span className="text-slate-500">/ {totalMaxMarks}</span>}
                        {mst.testDate && <span className="text-slate-500 font-normal ml-2">({new Date(mst.testDate).toLocaleDateString('en-IN')})</span>}
                      </span>
                    </div>
                    {scoreEntries.length > 0 ? (
                      <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                        {scoreEntries.map(([subj, val], sIdx) => (
                          <div key={sIdx} className="flex justify-between border-b border-slate-200 py-0.5 px-1 bg-white rounded">
                            <span className="truncate mr-2 font-medium capitalize">{subj}</span>
                            <span className="font-black text-slate-900">{val}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-500 italic">Score details pending</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ========================================== */}
        {/* 6. AMCAT Employability & Aptitude Scores    */}
        {/* ========================================== */}
        <div className="border border-slate-300 rounded-lg p-3 space-y-2 break-inside-avoid">
          <div className="font-black text-[11px] uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
            4. AMCAT Employability & Aptitude Assessment Scores
          </div>
          {amcatResults.length === 0 ? (
            <div className="text-slate-500 italic py-1 text-[11px]">No AMCAT assessment records found.</div>
          ) : (
            <div className="space-y-2.5">
              {amcatResults.map((amcat, idx) => {
                const testLabel = amcat.testName || `AMCAT Assessment ${idx + 1}`;
                const scoreKeys = Object.keys(amcat.scores || {});
                const isIdKey = (k) => k.toLowerCase().includes('id') || k.toLowerCase().includes('enrollment') || k.toLowerCase().includes('roll');
                const isTotalKey = (k) => k.toLowerCase().includes('total');
                const topicCount = scoreKeys.filter((k) => !isIdKey(k) && !isTotalKey(k)).length;

                return (
                  <div key={amcat._id || idx} className="border border-slate-200 rounded p-2.5 bg-slate-50/50 space-y-1.5 break-inside-avoid">
                    <div className="flex justify-between items-center text-[11px] font-bold border-b border-slate-200 pb-1">
                      <span>{testLabel} ({amcat.semester ? `Semester ${amcat.semester}` : 'General'})</span>
                      {amcat.testDate && (
                        <span className="text-slate-500 font-normal">
                          Evaluated: {new Date(amcat.testDate).toLocaleDateString('en-IN')}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 text-[10px]">
                      {Object.entries(amcat.scores || {}).map(([subject, score], sIdx) => {
                        const idKey = isIdKey(subject);
                        const totalKey = isTotalKey(subject);
                        const denominator = totalKey ? topicCount * 100 : 100;
                        return (
                          <div key={sIdx} className={`p-1.5 rounded border border-slate-200 ${totalKey ? 'bg-indigo-50 border-indigo-200 font-bold' : 'bg-white'}`}>
                            <div className="text-slate-500 truncate text-[9px] uppercase font-semibold">{subject}</div>
                            <div className="font-black text-slate-900 text-xs mt-0.5">
                              {score} {!idKey && denominator > 0 && <span className="text-[9px] text-slate-500 font-normal">/ {denominator}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ========================================== */}
        {/* 7. Pod AI Continuous Assessments           */}
        {/* ========================================== */}
        <div className="border border-slate-300 rounded-lg p-3 space-y-2 break-inside-avoid">
          <div className="font-black text-[11px] uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 flex justify-between">
            <span>5. Pod AI Continuous Assessments & Analytics</span>
            <span className="text-slate-700 font-bold">
              Total Tests: {podAI.analytics?.totalTests || 0} | Avg Marks: {podAI.analytics?.averageMarks ? Number(podAI.analytics.averageMarks).toFixed(1) : 0} | Highest: {podAI.analytics?.highestMarks || 0}
            </span>
          </div>
          {(!podAI.marks || podAI.marks.length === 0) ? (
            <div className="text-slate-500 italic py-1 text-[11px]">No Pod AI continuous assessment records found.</div>
          ) : (
            <table className="w-full text-left text-[10px] border-collapse">
              <thead>
                <tr className="border-b border-slate-300 font-bold uppercase text-slate-600 bg-slate-100">
                  <th className="py-1 px-2">Assessment Name</th>
                  <th className="py-1 px-2">Topic / Module</th>
                  <th className="py-1 px-2">Date</th>
                  <th className="py-1 px-2 text-right">Marks Obtained</th>
                  <th className="py-1 px-2 text-right">Max Marks</th>
                  <th className="py-1 px-2 text-right">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {podAI.marks.map((pm, idx) => {
                  const percent = pm.maxMarks ? ((pm.marks / pm.maxMarks) * 100).toFixed(1) : '100';
                  return (
                    <tr key={idx} className="border-b border-slate-200">
                      <td className="py-1 px-2 font-semibold">{pm.testName || `Pod AI Test ${idx + 1}`}</td>
                      <td className="py-1 px-2 text-slate-600">{pm.topic || 'General Aptitude & Coding'}</td>
                      <td className="py-1 px-2 text-slate-500">
                        {pm.testDate ? new Date(pm.testDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="py-1 px-2 text-right font-black text-slate-900">{pm.marks}</td>
                      <td className="py-1 px-2 text-right text-slate-600">{pm.maxMarks || 100}</td>
                      <td className="py-1 px-2 text-right font-bold">{percent}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ========================================== */}
        {/* 8. Sessional / Internal Evaluations        */}
        {/* ========================================== */}
        {studentSessionalMarks.length > 0 && (
          <div className="border border-slate-300 rounded-lg p-3 space-y-2 break-inside-avoid">
            <div className="font-black text-[11px] uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
              6. Internal / Sessional Continuous Evaluations
            </div>
            <table className="w-full text-left text-[10px] border-collapse">
              <thead>
                <tr className="border-b border-slate-300 font-bold uppercase text-slate-600 bg-slate-100">
                  <th className="py-1 px-2">Subject Name</th>
                  <th className="py-1 px-2">Code</th>
                  <th className="py-1 px-2">Exam Type</th>
                  <th className="py-1 px-2">Semester</th>
                  <th className="py-1 px-2 text-right">Marks Obtained</th>
                  <th className="py-1 px-2 text-right">Max Marks</th>
                  <th className="py-1 px-2 text-center">Grade / Status</th>
                </tr>
              </thead>
              <tbody>
                {studentSessionalMarks.map((sm, idx) => (
                  <tr key={idx} className="border-b border-slate-200">
                    <td className="py-1 px-2 font-semibold">{sm.subjectName}</td>
                    <td className="py-1 px-2 text-slate-600">{sm.subjectCode}</td>
                    <td className="py-1 px-2 uppercase">{sm.examType || 'Sessional'}</td>
                    <td className="py-1 px-2">{sm.semester}th Sem</td>
                    <td className="py-1 px-2 text-right font-black text-slate-900">{sm.marks}</td>
                    <td className="py-1 px-2 text-right text-slate-600">{sm.maxMarks}</td>
                    <td className="py-1 px-2 text-center font-bold">{sm.grade || sm.status || 'PASS'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ========================================== */}
        {/* 9. Super 50 Selection Application Details  */}
        {/* ========================================== */}
        {super50Registration && (
          <div className="border border-slate-300 rounded-lg p-3 space-y-2 break-inside-avoid">
            <div className="font-black text-[11px] uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
              7. Super 50 Elite Selection Application Details
            </div>
            <div className="grid grid-cols-3 gap-x-4 gap-y-1.5 text-[10px]">
              <div><span className="text-slate-500">Applicant Name:</span> <strong>{super50Registration.fullName || student.name}</strong></div>
              <div><span className="text-slate-500">Branch & Section:</span> <strong>{super50Registration.branch || student.department} ({super50Registration.section || student.section})</strong></div>
              <div><span className="text-slate-500">Mobile:</span> <strong>{super50Registration.mobileNumber || student.mobile}</strong></div>
              <div><span className="text-slate-500">GitHub Profile:</span> <strong>{super50Registration.githubProfile || 'N/A'}</strong></div>
              <div><span className="text-slate-500">Hackathon:</span> <strong>{super50Registration.hackathonParticipation || 'N/A'}</strong></div>
              <div><span className="text-slate-500">Project Link:</span> <strong>{super50Registration.projectLiveLink || 'N/A'}</strong></div>
              <div className="col-span-3"><span className="text-slate-500">Skills:</span> <strong>{super50Registration.skills || 'N/A'}</strong></div>
              <div className="col-span-3"><span className="text-slate-500">Project Description:</span> <strong>{super50Registration.projectDescription || 'N/A'}</strong></div>
              {super50Registration.hackathonDetails && (
                <div className="col-span-3"><span className="text-slate-500">Hackathon Details:</span> <strong>{super50Registration.hackathonDetails}</strong></div>
              )}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* 10. Training & Placement Drives & Rounds   */}
        {/* ========================================== */}
        <div className="border border-slate-300 rounded-lg p-3 space-y-2 break-inside-avoid">
          <div className="font-black text-[11px] uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 flex justify-between">
            <span>8. Training & Placement Drive Participation & Round Status</span>
            <span className="text-slate-700 font-bold">Total Drives: {placementApplications.length}</span>
          </div>
          {placementApplications.length === 0 ? (
            <div className="text-slate-500 italic py-1 text-[11px]">No campus placement drive applications on record.</div>
          ) : (
            <div className="space-y-2">
              {placementApplications.map((app, idx) => (
                <div key={app._id || idx} className="border border-slate-200 rounded p-2 bg-slate-50/50 space-y-1 break-inside-avoid">
                  <div className="flex justify-between items-center text-[11px]">
                    <div>
                      <strong className="text-slate-900">{app.drive?.companyName || 'Campus Recruiter'}</strong>
                      <span className="text-slate-500 text-[10px] ml-2">Package: {app.drive?.package || 'N/A'}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${
                      app.status === 'selected' ? 'bg-emerald-100 text-emerald-800' :
                      app.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                      'bg-indigo-100 text-indigo-800'
                    }`}>
                      {app.status || 'Applied'}
                    </span>
                  </div>
                  {app.roundsProgress && app.roundsProgress.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-200 text-[9px]">
                      {app.roundsProgress.map((round, rIdx) => (
                        <div key={rIdx} className="bg-white border border-slate-200 px-2 py-0.5 rounded">
                          <span className="font-semibold">{round.roundName}: </span>
                          <strong className={round.status === 'cleared' ? 'text-emerald-700' : round.status === 'eliminated' ? 'text-rose-700' : 'text-slate-600'}>
                            {round.status === 'cleared' ? 'CLEARED' : round.status === 'eliminated' ? 'ELIMINATED' : 'PENDING'}
                          </strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ========================================== */}
        {/* 11. Activities & Certifications Grid       */}
        {/* ========================================== */}
        <div className="grid grid-cols-2 gap-3 break-inside-avoid">
          {/* Verified Certifications */}
          <div className="border border-slate-300 rounded-lg p-3 space-y-1.5">
            <div className="font-black text-[11px] uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 flex justify-between">
              <span>9. Student Certifications ({certificates.length})</span>
            </div>
            {certificates.length === 0 ? (
              <div className="text-slate-500 italic text-[10px]">No certificates uploaded.</div>
            ) : (
              <div className="space-y-1 text-[10px]">
                {certificates.map((c, idx) => (
                  <div key={c._id || idx} className="flex justify-between border-b border-slate-200 py-0.5">
                    <div className="truncate mr-2">
                      <strong className="text-slate-900">{c.title || c.name}</strong>
                      {c.issuedBy && <span className="text-slate-500 text-[9px]"> ({c.issuedBy})</span>}
                    </div>
                    <span className="font-bold uppercase text-[9px] shrink-0 text-emerald-700">{c.verified || 'Verified'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Co-Curricular Activities */}
          <div className="border border-slate-300 rounded-lg p-3 space-y-1.5">
            <div className="font-black text-[11px] uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 flex justify-between">
              <span>10. Co-Curricular Activities ({activities.length})</span>
            </div>
            {activities.length === 0 ? (
              <div className="text-slate-500 italic text-[10px]">No activities recorded.</div>
            ) : (
              <div className="space-y-1 text-[10px]">
                {activities.map((a, idx) => (
                  <div key={a._id || idx} className="flex justify-between border-b border-slate-200 py-0.5">
                    <div className="truncate mr-2">
                      <strong className="text-slate-900">{a.title}</strong>
                      <span className="text-slate-500 text-[9px]"> ({a.type} {a.platform ? `• ${a.platform}` : ''})</span>
                    </div>
                    <span className="font-bold uppercase text-[9px] shrink-0 text-indigo-700">{a.verified || 'Submitted'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ========================================== */}
        {/* 12. Attendance Breakdown & Logs            */}
        {/* ========================================== */}
        <div className="border border-slate-300 rounded-lg p-3 space-y-2 break-inside-avoid">
          <div className="font-black text-[11px] uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 flex justify-between">
            <span>11. Attendance Records & Semester Roll Calls</span>
            <span className="text-slate-700 font-bold">Cumulative: {Number(attPercent).toFixed(1)}%</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-[10px]">
            <div>
              <div className="font-bold text-slate-700 mb-1">Semester-wise History</div>
              {semesterAttendance.length === 0 ? (
                <div className="text-slate-500 italic">No semester logs found.</div>
              ) : (
                <div className="space-y-1">
                  {semesterAttendance.map((sa, idx) => (
                    <div key={sa._id || idx} className="flex justify-between border-b border-slate-200 py-0.5">
                      <span>Semester {sa.semester} {sa.sessionName ? `(${sa.sessionName})` : ''}:</span>
                      <strong>{sa.attendancePercentage}% {sa.totalDays ? `(${sa.totalPresent}/${sa.totalDays} Days)` : ''}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="font-bold text-slate-700 mb-1">Cohort Session Logs ({attendanceLogs.length})</div>
              {attendanceLogs.length === 0 ? (
                <div className="text-slate-500 italic">No class session logs.</div>
              ) : (
                <div className="space-y-1 max-h-24 overflow-hidden">
                  {attendanceLogs.slice(0, 5).map((log, idx) => (
                    <div key={log._id || idx} className="flex justify-between border-b border-slate-200 py-0.5">
                      <span className="truncate">{log.className} ({new Date(log.classDate).toLocaleDateString('en-IN')})</span>
                      <strong className={`uppercase text-[9px] ${log.status === 'present' ? 'text-emerald-700' : 'text-rose-700'}`}>{log.status}</strong>
                    </div>
                  ))}
                  {attendanceLogs.length > 5 && (
                    <div className="text-[9px] text-slate-500 italic">+ {attendanceLogs.length - 5} more sessions on record</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* 13. PMS Project & Remarks                  */}
        {/* ========================================== */}
        <div className="grid grid-cols-2 gap-3 break-inside-avoid">
          {/* PMS Capstone Project */}
          <div className="border border-slate-300 rounded-lg p-3 space-y-1">
            <div className="font-black text-[11px] uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
              12. Major / Minor Capstone Project
            </div>
            {team ? (
              <div className="text-[10px] space-y-1">
                <div><span className="text-slate-500">Group No:</span> <strong>{team.groupNo}</strong></div>
                <div><span className="text-slate-500">Title:</span> <strong>{team.projectTitle || team.title}</strong></div>
                <div><span className="text-slate-500">Assigned Guide:</span> <strong>{team.guide?.name || 'Assigned Guide'}</strong></div>
                <div><span className="text-slate-500">Team Leader:</span> <strong>{team.teamLeader?.name || student.name}</strong></div>
                {team.members && team.members.length > 0 && (
                  <div><span className="text-slate-500">Members:</span> <strong>{team.members.map(m => m.student?.name || m.name).filter(Boolean).join(', ')}</strong></div>
                )}
                <div><span className="text-slate-500">Tech Stack:</span> <strong>{(team.projectDomain || []).join(', ') || 'Full Stack'}</strong></div>
              </div>
            ) : (
              <div className="text-slate-500 italic text-[10px]">No capstone project team allotted.</div>
            )}
          </div>

          {/* Faculty / TG Remarks */}
          <div className="border border-slate-300 rounded-lg p-3 space-y-1">
            <div className="font-black text-[11px] uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 flex justify-between">
              <span>13. Faculty & Mentor Remarks ({remarks.length})</span>
            </div>
            {remarks.length === 0 ? (
              <div className="text-slate-500 italic text-[10px]">No faculty remarks on record.</div>
            ) : (
              <div className="space-y-1.5 text-[10px]">
                {remarks.slice(-3).map((r, idx) => (
                  <div key={r._id || idx} className="border-b border-slate-200 pb-1">
                    <p className="font-medium text-slate-800 italic">"{r.text}"</p>
                    <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                      <span>By: <strong>{r.addedBy?.name || 'Faculty'}</strong></span>
                      <span>{new Date(r.addedAt).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ========================================== */}
        {/* 14. Departmental No-Dues Clearances        */}
        {/* ========================================== */}
        <div className="border border-slate-300 rounded-lg p-3 space-y-1.5 break-inside-avoid">
          <div className="font-black text-[11px] uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 flex justify-between">
            <span>14. Departmental No-Dues Clearance Checklist</span>
            <span className="text-slate-700 font-bold">Overall Status: {noDuesForm?.overallStatus || 'APPROVED'}</span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-[10px]">
            <div className="border border-slate-200 p-1.5 rounded bg-slate-50">
              <span className="text-slate-500 block text-[9px] uppercase">Library</span>
              <strong className="text-slate-900">{noDuesForm?.libraryStatus || 'CLEARED'}</strong>
            </div>
            <div className="border border-slate-200 p-1.5 rounded bg-slate-50">
              <span className="text-slate-500 block text-[9px] uppercase">Accounts & Fees</span>
              <strong className="text-slate-900">{duesFees === 0 ? 'CLEARED (₹0)' : `DUES: ₹${duesFees}`}</strong>
            </div>
            <div className="border border-slate-200 p-1.5 rounded bg-slate-50">
              <span className="text-slate-500 block text-[9px] uppercase">TG Mentor</span>
              <strong className="text-slate-900">{noDuesForm?.mentorStatus || 'CLEARED'}</strong>
            </div>
            <div className="border border-slate-200 p-1.5 rounded bg-slate-50">
              <span className="text-slate-500 block text-[9px] uppercase">HOD / Dept</span>
              <strong className="text-slate-900">{noDuesForm?.hodStatus || 'CLEARED'}</strong>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* 15. Institutional Signatures & Seal        */}
        {/* ========================================== */}
        <div className="border-t-2 border-slate-900 pt-5 mt-4 break-inside-avoid">
          <div className="grid grid-cols-3 gap-6 text-center text-[10px]">
            <div className="space-y-1">
              <div className="h-8 border-b border-dashed border-slate-400"></div>
              <div className="font-bold text-slate-900 mt-1">Parent / Guardian</div>
              <div className="text-slate-500 text-[9px]">Signature / Acknowledgment</div>
            </div>
            <div className="space-y-1">
              <div className="h-8 border-b border-dashed border-slate-400"></div>
              <div className="font-bold text-slate-900 mt-1">{student.mentor?.name || 'Tutor Guardian (TG)'}</div>
              <div className="text-slate-500 text-[9px]">Assigned TG Mentor Signature</div>
            </div>
            <div className="space-y-1">
              <div className="h-8 border-b border-dashed border-slate-400"></div>
              <div className="font-bold text-slate-900 mt-1">Principal / Dean Academic</div>
              <div className="text-slate-500 text-[9px]">SISTec Authorized Signatory</div>
            </div>
          </div>
          <div className="text-center text-[8px] text-slate-400 border-t border-slate-200 pt-2 mt-3 font-mono">
            CONFIDENTIAL ACADEMIC DOSSIER • GENERATED VIA SISTec MILE PORTAL • SAGAR GROUP OF INSTITUTIONS, BHOPAL
          </div>
        </div>
      </div>
    </>
  );
}
