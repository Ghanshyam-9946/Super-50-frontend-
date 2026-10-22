import sistecLogo from '../assets/SISTec_Logo.png';

export function printStudentDossier(data, portalLabel = 'MILE Verified Official Academic Record') {
  if (!data || !data.student) return;

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

  // 100% Automatic College & Campus Detection from Student Records
  const campus = String(student.campus || data.campus || student.collegeCampus || '').toLowerCase().trim();
  const enroll = String(student.enrollmentNumber || student.enrollmentNo || student.rollNo || '').toUpperCase().trim();
  const dept = String(student.department || student.branch || '').toLowerCase().trim();
  const college = String(student.collegeName || student.institute || student.college || '').toLowerCase().trim();
  const email = String(student.email || '').toLowerCase().trim();

  const isRatibad =
    campus.includes('ratibad') ||
    college.includes('sistec-r') ||
    college.includes('research') ||
    college.includes('ratibad') ||
    dept.includes('sistec-r') ||
    dept.includes('(r)') ||
    dept.includes('ratibad') ||
    email.includes('sistecr') ||
    enroll.includes('0193') ||
    enroll.includes('0194') ||
    enroll.includes('0517');

  const institutionInfo = isRatibad
    ? {
        fullName: 'SAGAR INSTITUTE OF SCIENCE TECHNOLOGY AND RESEARCH (SISTEC-R)',
        shortName: 'SISTec-R',
        campusName: 'Ratibad Campus, Bhopal',
        tagline: `${portalLabel} • Ratibad Campus, Bhopal`,
        footer: 'CONFIDENTIAL ACADEMIC DOSSIER • SAGAR INSTITUTE OF SCIENCE TECHNOLOGY AND RESEARCH (SISTEC-R), RATIBAD BHOPAL',
        signatory: 'SISTec-R Authorized Signatory'
      }
    : {
        fullName: 'SAGAR INSTITUTE OF SCIENCE AND TECHNOLOGY (SISTEC)',
        shortName: 'SISTec',
        campusName: 'Gandhinagar Campus, Bhopal',
        tagline: `${portalLabel} • Gandhinagar Campus, Bhopal`,
        footer: 'CONFIDENTIAL ACADEMIC DOSSIER • SAGAR INSTITUTE OF SCIENCE AND TECHNOLOGY (SISTEC), GANDHINAGAR BHOPAL',
        signatory: 'SISTec Authorized Signatory'
      };

  // 1. RGPV Results HTML
  let rgpvHtml = '';
  if (!rgpvResults || rgpvResults.length === 0) {
    rgpvHtml = '<div class="italic text-slate-500 py-1">No official RGPV semester results uploaded yet.</div>';
  } else {
    rgpvHtml = rgpvResults.map((r) => {
      const grades = r.grades ? Object.entries(r.grades) : [];
      let gradesHtml = '';
      if (grades.length > 0) {
        gradesHtml = `<div class="grid-4" style="margin-top: 6px;">` +
          grades.map(([sub, grade]) => `
            <div class="grade-pill">
              <span class="truncate">${sub}</span>
              <strong>${grade}</strong>
            </div>
          `).join('') +
        `</div>`;
      }
      return `
        <div class="item-card">
          <div class="flex-between font-bold border-b pb-1">
            <span>Semester ${r.semester} Result — Status: <span class="${r.resultDecision === 'FAIL' ? 'text-danger' : 'text-success'}">${r.resultDecision || 'PASS'}</span></span>
            <span>SGPA: <strong>${r.sgpa ? Number(r.sgpa).toFixed(2) : 'N/A'}</strong> | CGPA: <strong>${r.cgpa ? Number(r.cgpa).toFixed(2) : 'N/A'}</strong></span>
          </div>
          ${gradesHtml}
        </div>
      `;
    }).join('');
  }

  // 2. MST Results HTML
  let mstHtml = '';
  if (!mstResults || mstResults.length === 0) {
    mstHtml = '<div class="italic text-slate-500 py-1">No Mid-Semester Test (MST) records found.</div>';
  } else {
    mstHtml = mstResults.map((mst, idx) => {
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

      let scoresHtml = '';
      if (scoreEntries.length > 0) {
        scoresHtml = `<div class="grid-3" style="margin-top: 6px;">` +
          scoreEntries.map(([subj, val]) => `
            <div class="grade-pill">
              <span class="truncate capitalize">${subj}</span>
              <strong>${val}</strong>
            </div>
          `).join('') +
        `</div>`;
      }

      return `
        <div class="item-card">
          <div class="flex-between font-bold border-b pb-1">
            <span>${testLabel} (${mst.semester ? `Semester ${mst.semester}` : 'Current Semester'})</span>
            <span>
              Grand Total: <strong>${calculatedTotal}</strong> ${totalMaxMarks > 0 ? `<span class="text-slate-500">/ ${totalMaxMarks}</span>` : ''}
              ${mst.testDate ? `<span class="text-slate-500 font-normal" style="margin-left: 8px;">(${new Date(mst.testDate).toLocaleDateString('en-IN')})</span>` : ''}
            </span>
          </div>
          ${scoresHtml}
        </div>
      `;
    }).join('');
  }

  // 3. AMCAT Results HTML
  let amcatHtml = '';
  if (!amcatResults || amcatResults.length === 0) {
    amcatHtml = '<div class="italic text-slate-500 py-1">No AMCAT assessment records found.</div>';
  } else {
    amcatHtml = amcatResults.map((amcat, idx) => {
      const testLabel = amcat.testName || `AMCAT Assessment ${idx + 1}`;
      const scoreKeys = Object.keys(amcat.scores || {});
      const isIdKey = (k) => k.toLowerCase().includes('id') || k.toLowerCase().includes('enrollment') || k.toLowerCase().includes('roll');
      const isTotalKey = (k) => k.toLowerCase().includes('total');
      const topicCount = scoreKeys.filter((k) => !isIdKey(k) && !isTotalKey(k)).length;

      let sectionalHtml = '';
      const entries = Object.entries(amcat.scores || {});
      if (entries.length > 0) {
        sectionalHtml = `<div class="grid-4" style="margin-top: 6px;">` +
          entries.map(([subject, score]) => {
            const idKey = isIdKey(subject);
            const totalKey = isTotalKey(subject);
            const denominator = totalKey ? topicCount * 100 : 100;
            return `
              <div class="amcat-pill ${totalKey ? 'amcat-total' : ''}">
                <div class="amcat-label">${subject}</div>
                <div class="amcat-val">${score} ${!idKey && denominator > 0 ? `<span style="font-size: 8px; font-weight: normal; color: #64748b;">/ ${denominator}</span>` : ''}</div>
              </div>
            `;
          }).join('') +
        `</div>`;
      }

      return `
        <div class="item-card">
          <div class="flex-between font-bold border-b pb-1">
            <span>${testLabel} (${amcat.semester ? `Semester ${amcat.semester}` : 'General'})</span>
            ${amcat.testDate ? `<span class="text-slate-500 font-normal">Evaluated: ${new Date(amcat.testDate).toLocaleDateString('en-IN')}</span>` : ''}
          </div>
          ${sectionalHtml}
        </div>
      `;
    }).join('');
  }

  // 4. Pod AI Tests HTML
  let podAIHtml = '';
  if (!podAI.marks || podAI.marks.length === 0) {
    podAIHtml = '<div class="italic text-slate-500 py-1">No Pod AI continuous assessment records found.</div>';
  } else {
    podAIHtml = `
      <table class="report-table">
        <thead>
          <tr>
            <th>Assessment Name</th>
            <th>Topic / Module</th>
            <th>Date</th>
            <th style="text-align: right;">Marks Obtained</th>
            <th style="text-align: right;">Max Marks</th>
            <th style="text-align: right;">Percentage</th>
          </tr>
        </thead>
        <tbody>
          ${podAI.marks.map((pm, idx) => {
            const percent = pm.maxMarks ? ((pm.marks / pm.maxMarks) * 100).toFixed(1) : '100';
            return `
              <tr>
                <td><strong>${pm.testName || `Pod AI Test ${idx + 1}`}</strong></td>
                <td>${pm.topic || 'General Aptitude & Coding'}</td>
                <td>${pm.testDate ? new Date(pm.testDate).toLocaleDateString('en-IN') : 'N/A'}</td>
                <td style="text-align: right;"><strong>${pm.marks}</strong></td>
                <td style="text-align: right;">${pm.maxMarks || 100}</td>
                <td style="text-align: right; font-weight: bold;">${percent}%</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  }

  // 5. Sessional Marks HTML
  let sessionalHtml = '';
  if (studentSessionalMarks && studentSessionalMarks.length > 0) {
    sessionalHtml = `
      <div class="section-box">
        <div class="section-title">6. Internal / Sessional Continuous Evaluations</div>
        <table class="report-table">
          <thead>
            <tr>
              <th>Subject Name</th>
              <th>Code</th>
              <th>Exam Type</th>
              <th>Semester</th>
              <th style="text-align: right;">Marks</th>
              <th style="text-align: right;">Max Marks</th>
              <th style="text-align: center;">Grade / Status</th>
            </tr>
          </thead>
          <tbody>
            ${studentSessionalMarks.map((sm) => `
              <tr>
                <td><strong>${sm.subjectName}</strong></td>
                <td>${sm.subjectCode}</td>
                <td style="text-transform: uppercase;">${sm.examType || 'Sessional'}</td>
                <td>${sm.semester}th Sem</td>
                <td style="text-align: right;"><strong>${sm.marks}</strong></td>
                <td style="text-align: right;">${sm.maxMarks}</td>
                <td style="text-align: center; font-weight: bold;">${sm.grade || sm.status || 'PASS'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // 6. Super 50 Registration HTML
  let super50Html = '';
  if (super50Registration) {
    super50Html = `
      <div class="section-box">
        <div class="section-title">7. Super 50 Elite Selection Application Details</div>
        <div class="grid-3" style="font-size: 10px;">
          <div><span class="text-slate-500">Applicant:</span> <strong>${super50Registration.fullName || student.name}</strong></div>
          <div><span class="text-slate-500">Branch & Sec:</span> <strong>${super50Registration.branch || student.department} (${super50Registration.section || student.section})</strong></div>
          <div><span class="text-slate-500">Mobile:</span> <strong>${super50Registration.mobileNumber || student.mobile}</strong></div>
          <div><span class="text-slate-500">GitHub:</span> <strong>${super50Registration.githubProfile || 'N/A'}</strong></div>
          <div><span class="text-slate-500">Hackathon:</span> <strong>${super50Registration.hackathonParticipation || 'N/A'}</strong></div>
          <div><span class="text-slate-500">Project Link:</span> <strong>${super50Registration.projectLiveLink || 'N/A'}</strong></div>
          <div style="grid-column: span 3;"><span class="text-slate-500">Skills:</span> <strong>${super50Registration.skills || 'N/A'}</strong></div>
          <div style="grid-column: span 3;"><span class="text-slate-500">Project Desc:</span> <strong>${super50Registration.projectDescription || 'N/A'}</strong></div>
          ${super50Registration.hackathonDetails ? `<div style="grid-column: span 3;"><span class="text-slate-500">Hackathon Details:</span> <strong>${super50Registration.hackathonDetails}</strong></div>` : ''}
        </div>
      </div>
    `;
  }

  // 7. Placements HTML
  let placementsHtml = '';
  if (!placementApplications || placementApplications.length === 0) {
    placementsHtml = '<div class="italic text-slate-500 py-1">No campus placement drive applications on record.</div>';
  } else {
    placementsHtml = placementApplications.map((app) => {
      let roundsHtml = '';
      if (app.roundsProgress && app.roundsProgress.length > 0) {
        roundsHtml = `<div class="rounds-row">` +
          app.roundsProgress.map((round) => `
            <div class="round-badge">
              <span>${round.roundName}: </span>
              <strong class="${round.status === 'cleared' ? 'text-success' : round.status === 'eliminated' ? 'text-danger' : 'text-slate-600'}">
                ${round.status === 'cleared' ? 'CLEARED' : round.status === 'eliminated' ? 'ELIMINATED' : 'PENDING'}
              </strong>
            </div>
          `).join('') +
        `</div>`;
      }

      return `
        <div class="item-card">
          <div class="flex-between">
            <div>
              <strong>${app.drive?.companyName || 'Campus Recruiter'}</strong>
              <span class="text-slate-500" style="margin-left: 8px; font-size: 10px;">Package: ${app.drive?.package || 'N/A'}</span>
            </div>
            <span class="status-badge ${app.status === 'selected' ? 'status-selected' : app.status === 'rejected' ? 'status-rejected' : 'status-applied'}">
              ${app.status || 'Applied'}
            </span>
          </div>
          ${roundsHtml}
        </div>
      `;
    }).join('');
  }

  // 8. Certificates & Activities HTML
  let certsHtml = '';
  if (certificates.length === 0) {
    certsHtml = '<div class="italic text-slate-500">No certificates uploaded.</div>';
  } else {
    certsHtml = certificates.map((c) => `
      <div class="flex-between border-b py-0.5">
        <div class="truncate">
          <strong>${c.title || c.name}</strong>
          ${c.issuedBy ? `<span class="text-slate-500" style="font-size: 9px;"> (${c.issuedBy})</span>` : ''}
        </div>
        <span class="text-success font-bold" style="font-size: 9px;">${c.verified || 'Verified'}</span>
      </div>
    `).join('');
  }

  let activitiesHtml = '';
  if (activities.length === 0) {
    activitiesHtml = '<div class="italic text-slate-500">No activities recorded.</div>';
  } else {
    activitiesHtml = activities.map((a) => `
      <div class="flex-between border-b py-0.5">
        <div class="truncate">
          <strong>${a.title}</strong>
          <span class="text-slate-500" style="font-size: 9px;"> (${a.type} ${a.platform ? `• ${a.platform}` : ''})</span>
        </div>
        <span class="text-indigo font-bold" style="font-size: 9px;">${a.verified || 'Submitted'}</span>
      </div>
    `).join('');
  }

  // 9. Attendance Breakdown HTML
  let semAttHtml = '';
  if (semesterAttendance.length === 0) {
    semAttHtml = '<div class="italic text-slate-500">No semester logs found.</div>';
  } else {
    semAttHtml = semesterAttendance.map((sa) => `
      <div class="flex-between border-b py-0.5">
        <span>Semester ${sa.semester} ${sa.sessionName ? `(${sa.sessionName})` : ''}:</span>
        <strong>${sa.attendancePercentage}% ${sa.totalDays ? `(${sa.totalPresent}/${sa.totalDays} Days)` : ''}</strong>
      </div>
    `).join('');
  }

  let classLogsHtml = '';
  if (attendanceLogs.length === 0) {
    classLogsHtml = '<div class="italic text-slate-500">No class session logs recorded.</div>';
  } else {
    classLogsHtml = attendanceLogs.slice(0, 6).map((log) => `
      <div class="flex-between border-b py-0.5">
        <span class="truncate">${log.className} (${new Date(log.classDate).toLocaleDateString('en-IN')})</span>
        <strong class="${log.status === 'present' ? 'text-success' : 'text-danger'}" style="text-transform: uppercase; font-size: 9px;">${log.status}</strong>
      </div>
    `).join('');
    if (attendanceLogs.length > 6) {
      classLogsHtml += `<div class="italic text-slate-500" style="font-size: 9px; margin-top: 3px;">+ ${attendanceLogs.length - 6} more sessions on record</div>`;
    }
  }

  // 10. Remarks HTML
  let remarksHtml = '';
  if (remarks.length === 0) {
    remarksHtml = '<div class="italic text-slate-500">No faculty remarks on record.</div>';
  } else {
    remarksHtml = remarks.slice(-4).map((r) => `
      <div class="border-b pb-1" style="margin-bottom: 4px;">
        <p style="margin: 0; font-style: italic; color: #334155;">"${r.text}"</p>
        <div class="flex-between text-slate-500" style="font-size: 9px; margin-top: 2px;">
          <span>By: <strong>${r.addedBy?.name || 'Faculty'}</strong></span>
          <span>${new Date(r.addedAt).toLocaleDateString('en-IN')}</span>
        </div>
      </div>
    `).join('');
  }

  // 11. PMS Project HTML
  let pmsHtml = '';
  if (team) {
    pmsHtml = `
      <div style="font-size: 10px; line-height: 1.5;">
        <div><span class="text-slate-500">Group No:</span> <strong>${team.groupNo}</strong></div>
        <div><span class="text-slate-500">Title:</span> <strong>${team.projectTitle || team.title}</strong></div>
        <div><span class="text-slate-500">Assigned Guide:</span> <strong>${team.guide?.name || 'Assigned Guide'}</strong></div>
        <div><span class="text-slate-500">Team Leader:</span> <strong>${team.teamLeader?.name || student.name}</strong></div>
        ${team.members && team.members.length > 0 ? `<div><span class="text-slate-500">Members:</span> <strong>${team.members.map(m => m.student?.name || m.name).filter(Boolean).join(', ')}</strong></div>` : ''}
        <div><span class="text-slate-500">Tech Stack:</span> <strong>{(team.projectDomain || []).join(', ') || 'Full Stack'}</strong></div>
      </div>
    `;
  } else {
    pmsHtml = '<div class="italic text-slate-500">No capstone project team allotted.</div>';
  }

  // Build the complete standalone HTML document
  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${student.name || 'Student'}_Academic_Dossier</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 16px;
      color: #0f172a;
      background: #ffffff;
      font-size: 11px;
      line-height: 1.4;
    }

    .dossier-wrapper {
      max-width: 900px;
      margin: 0 auto;
    }

    .header-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .header-logo {
      height: 56px;
      width: auto;
      object-contain: contain;
    }

    .header-title {
      font-size: 14.5px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: -0.02em;
      color: #020617;
      margin: 0;
    }

    .header-subtitle {
      font-size: 11px;
      font-weight: 700;
      color: #334155;
      margin: 2px 0 0 0;
    }

    .header-tagline {
      font-size: 9px;
      font-weight: 600;
      color: #64748b;
      margin: 2px 0 0 0;
    }

    .header-right {
      text-align: right;
    }

    .badge-confidential {
      font-size: 9px;
      font-family: monospace;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
    }

    .badge-super50 {
      display: inline-block;
      background: #0f172a;
      color: #ffffff;
      font-size: 8px;
      font-weight: 900;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 4px;
      margin-top: 4px;
    }

    .section-box {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px 12px;
      margin-bottom: 12px;
      background: #ffffff;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .section-title {
      font-size: 11px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px 12px;
    }

    .grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
    }

    .grid-5 {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 8px;
    }

    .score-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px;
      text-align: center;
      background: #f8fafc;
    }

    .score-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
    }

    .score-value {
      font-size: 15px;
      font-weight: 900;
      color: #0f172a;
      margin-top: 2px;
    }

    .item-card {
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 8px 10px;
      background: #f8fafc;
      margin-bottom: 8px;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .grade-pill {
      display: flex;
      justify-content: space-between;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      padding: 3px 6px;
      border-radius: 4px;
      font-size: 10px;
    }

    .amcat-pill {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      padding: 4px 6px;
      border-radius: 4px;
    }

    .amcat-total {
      background: #eef2ff;
      border-color: #c7d2fe;
    }

    .amcat-label {
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .amcat-val {
      font-size: 12px;
      font-weight: 900;
      color: #0f172a;
      margin-top: 1px;
    }

    .report-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
      text-align: left;
    }

    .report-table th {
      border-bottom: 1px solid #cbd5e1;
      font-weight: 700;
      text-transform: uppercase;
      color: #475569;
      background: #f1f5f9;
      padding: 4px 8px;
    }

    .report-table td {
      border-bottom: 1px solid #e2e8f0;
      padding: 4px 8px;
    }

    .flex-between {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .truncate {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .text-slate-500 { color: #64748b; }
    .text-success { color: #047857; }
    .text-danger { color: #be123c; }
    .text-indigo { color: #4338ca; }
    .font-bold { font-weight: 700; }
    .border-b { border-bottom: 1px solid #e2e8f0; }
    .pb-1 { padding-bottom: 4px; }
    .py-0\\.5 { padding-top: 2px; padding-bottom: 2px; }
    .capitalize { text-transform: capitalize; }
    .italic { font-style: italic; }

    .status-badge {
      font-size: 9px;
      font-weight: 900;
      text-transform: uppercase;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .status-selected { background: #d1fae5; color: #065f46; }
    .status-rejected { background: #ffe4e6; color: #9f1239; }
    .status-applied { background: #e0e7ff; color: #3730a3; }

    .rounds-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 4px;
      padding-top: 4px;
      border-top: 1px solid #e2e8f0;
      font-size: 9px;
    }

    .round-badge {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      padding: 2px 6px;
      border-radius: 3px;
    }

    .signatures-block {
      border-top: 2px solid #0f172a;
      padding-top: 16px;
      margin-top: 20px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      text-align: center;
      font-size: 10px;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .sig-line {
      height: 36px;
      border-bottom: 1px dashed #94a3b8;
      margin-bottom: 4px;
    }

    .footer-note {
      text-align: center;
      font-size: 8px;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      margin-top: 14px;
      font-family: monospace;
      text-transform: uppercase;
    }

    @page {
      size: A4 portrait;
      margin: 10mm 10mm 10mm 10mm;
    }
  </style>
</head>
<body>
  <div class="dossier-wrapper">
    <!-- Header -->
    <div class="header-box">
      <div class="header-left">
        <img src="${sistecLogo}" alt="SISTec" class="header-logo" />
        <div>
          <h1 class="header-title">${institutionInfo.fullName}</h1>
          <p class="header-subtitle">Comprehensive Student Academic Dossier & Master Profile</p>
          <p class="header-tagline">${institutionInfo.tagline}</p>
        </div>
      </div>
      <div class="header-right">
        <div style="font-weight: bold; font-size: 10px;">Report Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
        <div class="badge-confidential">Official Confidential Record</div>
        ${student.isSuper50 ? '<div class="badge-super50">Super 50 Elite Batch</div>' : ''}
      </div>
    </div>

    <!-- 1. Student Profile -->
    <div class="section-box">
      <div class="section-title">
        <span>1. Student Profile & Contact Information</span>
        <span>Enrollment No: ${student.enrollmentNumber || student.enrollmentNo || 'N/A'}</span>
      </div>
      <div class="grid-3">
        <div><span class="text-slate-500">Full Name:</span> <strong>${student.name || 'N/A'}</strong></div>
        <div><span class="text-slate-500">Department:</span> <strong>${student.department || 'Engineering'}</strong></div>
        <div><span class="text-slate-500">Batch / Year:</span> <strong>${student.batch || 'N/A'}</strong></div>
        <div><span class="text-slate-500">Current Semester:</span> <strong>${student.semester ? `${student.semester}th Semester` : 'N/A'}</strong></div>
        <div><span class="text-slate-500">Section:</span> <strong>${student.section || 'N/A'}</strong></div>
        <div><span class="text-slate-500">Residence:</span> <strong>${student.residenceType || 'Day Scholar'}</strong></div>
        <div><span class="text-slate-500">10th Percentage:</span> <strong>${student.tenthPercentage ? `${student.tenthPercentage}%` : 'N/A'}</strong></div>
        <div><span class="text-slate-500">12th Percentage:</span> <strong>${student.twelfthPercentage ? `${student.twelfthPercentage}%` : 'N/A'}</strong></div>
        <div><span class="text-slate-500">Student Phone:</span> <strong>${student.mobile || student.phone || 'N/A'}</strong></div>
        <div><span class="text-slate-500">WhatsApp:</span> <strong>${student.whatsapp || 'N/A'}</strong></div>
        <div><span class="text-slate-500">Parent Mobile:</span> <strong>${student.parentMobile || 'N/A'}</strong></div>
        <div><span class="text-slate-500">Student Email:</span> <strong>${student.email || 'N/A'}</strong></div>
        <div style="grid-column: span 3;"><span class="text-slate-500">Address:</span> <strong>${student.address || 'N/A'}</strong></div>
      </div>
      ${student.mentor ? `
        <div class="flex-between" style="border-top: 1px solid #e2e8f0; padding-top: 6px; margin-top: 6px; background: #f8fafc; padding: 6px 8px; border-radius: 4px;">
          <div>
            <span class="text-slate-500">Assigned TG Mentor:</span> <strong>${student.mentor.name}</strong> ${student.mentor.designation ? `(${student.mentor.designation})` : ''}
          </div>
          <div style="display: flex; gap: 16px;">
            ${student.mentor.mobile ? `<span>Mobile: <strong>${student.mentor.mobile}</strong></span>` : ''}
            ${student.mentor.email ? `<span>Email: <strong>${student.mentor.email}</strong></span>` : ''}
          </div>
        </div>
      ` : ''}
    </div>

    <!-- 2. Performance Scorecard -->
    <div class="grid-5" style="margin-bottom: 12px;">
      <div class="score-card">
        <div class="score-label">Cumulative CGPA</div>
        <div class="score-value">${cgpa > 0 ? Number(cgpa).toFixed(2) : 'N/A'} <span style="font-size: 9px; font-weight: normal; color: #64748b;">/ 10</span></div>
      </div>
      <div class="score-card">
        <div class="score-label">Overall Attendance</div>
        <div class="score-value">${Number(attPercent).toFixed(1)}%</div>
      </div>
      <div class="score-card">
        <div class="score-label">Performance Score</div>
        <div class="score-value">${student.performanceScore !== undefined ? Math.round(student.performanceScore) : 'N/A'}</div>
      </div>
      <div class="score-card">
        <div class="score-label">Fee Clearance</div>
        <div class="score-value">${duesFees === 0 ? 'CLEARED' : `₹${duesFees}`}</div>
      </div>
      <div class="score-card">
        <div class="score-label">Drives & Certs</div>
        <div class="score-value">${placementApplications.length} / ${certificates.length}</div>
      </div>
    </div>

    <!-- 3. RGPV Results -->
    <div class="section-box">
      <div class="section-title">2. RGPV University Semester Examination Results</div>
      ${rgpvHtml}
    </div>

    <!-- 4. MST Test Scores -->
    <div class="section-box">
      <div class="section-title">3. Mid-Semester Tests (MST) Subject-Wise Scores</div>
      ${mstHtml}
    </div>

    <!-- 5. AMCAT Assessment Scores -->
    <div class="section-box">
      <div class="section-title">4. AMCAT Employability & Aptitude Assessment Scores</div>
      ${amcatHtml}
    </div>

    <!-- 6. Pod AI Continuous Assessments -->
    <div class="section-box">
      <div class="section-title">
        <span>5. Pod AI Continuous Assessments & Analytics</span>
        <span style="font-weight: normal; font-size: 10px;">Total Tests: <strong>${podAI.analytics?.totalTests || 0}</strong> | Avg Marks: <strong>${podAI.analytics?.averageMarks ? Number(podAI.analytics.averageMarks).toFixed(1) : 0}</strong> | Highest: <strong>${podAI.analytics?.highestMarks || 0}</strong></span>
      </div>
      ${podAIHtml}
    </div>

    <!-- 7. Sessional / Internal Evaluations -->
    ${sessionalHtml}

    <!-- 8. Super 50 Selection Application Details -->
    ${super50Html}

    <!-- 9. Placement Drives & Progress -->
    <div class="section-box">
      <div class="section-title">
        <span>8. Training & Placement Drive Participation & Round Status</span>
        <span style="font-weight: normal; font-size: 10px;">Total Drives: <strong>${placementApplications.length}</strong></span>
      </div>
      ${placementsHtml}
    </div>

    <!-- 10. Certifications & Activities -->
    <div class="grid-2" style="margin-bottom: 12px;">
      <div class="section-box" style="margin-bottom: 0;">
        <div class="section-title">9. Verified Certifications (${certificates.length})</div>
        ${certsHtml}
      </div>
      <div class="section-box" style="margin-bottom: 0;">
        <div class="section-title">10. Co-Curricular Activities (${activities.length})</div>
        ${activitiesHtml}
      </div>
    </div>

    <!-- 11. Attendance Records -->
    <div class="section-box">
      <div class="section-title">
        <span>11. Attendance Records & Semester Roll Calls</span>
        <span style="font-weight: normal; font-size: 10px;">Cumulative Attendance: <strong>${Number(attPercent).toFixed(1)}%</strong></span>
      </div>
      <div class="grid-2">
        <div>
          <div style="font-weight: bold; margin-bottom: 4px;">Semester-wise Attendance</div>
          ${semAttHtml}
        </div>
        <div>
          <div style="font-weight: bold; margin-bottom: 4px;">Cohort Class Session Logs (${attendanceLogs.length})</div>
          ${classLogsHtml}
        </div>
      </div>
    </div>

    <!-- 12. PMS Project & Remarks -->
    <div class="grid-2" style="margin-bottom: 12px;">
      <div class="section-box" style="margin-bottom: 0;">
        <div class="section-title">12. Major / Minor Capstone Project</div>
        ${pmsHtml}
      </div>
      <div class="section-box" style="margin-bottom: 0;">
        <div class="section-title">13. Faculty & Mentor Remarks (${remarks.length})</div>
        ${remarksHtml}
      </div>
    </div>

    <!-- 13. Departmental No Dues Clearance Checklist -->
    <div class="section-box">
      <div class="section-title">
        <span>14. Departmental No-Dues Clearance Checklist</span>
        <span>Overall Status: <strong>${noDuesForm?.overallStatus || 'APPROVED'}</strong></span>
      </div>
      <div class="grid-4" style="text-align: center;">
        <div style="border: 1px solid #e2e8f0; padding: 6px; border-radius: 4px; background: #f8fafc;">
          <div class="text-slate-500" style="font-size: 9px; text-transform: uppercase;">Library</div>
          <strong style="font-size: 11px;">${noDuesForm?.libraryStatus || 'CLEARED'}</strong>
        </div>
        <div style="border: 1px solid #e2e8f0; padding: 6px; border-radius: 4px; background: #f8fafc;">
          <div class="text-slate-500" style="font-size: 9px; text-transform: uppercase;">Accounts & Fees</div>
          <strong style="font-size: 11px;">${duesFees === 0 ? 'CLEARED (₹0)' : `DUES: ₹${duesFees}`}</strong>
        </div>
        <div style="border: 1px solid #e2e8f0; padding: 6px; border-radius: 4px; background: #f8fafc;">
          <div class="text-slate-500" style="font-size: 9px; text-transform: uppercase;">TG Mentor</div>
          <strong style="font-size: 11px;">${noDuesForm?.mentorStatus || 'CLEARED'}</strong>
        </div>
        <div style="border: 1px solid #e2e8f0; padding: 6px; border-radius: 4px; background: #f8fafc;">
          <div class="text-slate-500" style="font-size: 9px; text-transform: uppercase;">HOD / Dept</div>
          <strong style="font-size: 11px;">${noDuesForm?.hodStatus || 'CLEARED'}</strong>
        </div>
      </div>
    </div>

    <!-- 14. Signatures Block -->
    <div class="signatures-block">
      <div>
        <div class="sig-line"></div>
        <div style="font-weight: bold;">Parent / Guardian</div>
        <div class="text-slate-500" style="font-size: 9px;">Signature / Acknowledgment</div>
      </div>
      <div>
        <div class="sig-line"></div>
        <div style="font-weight: bold;">${student.mentor?.name || 'Tutor Guardian (TG)'}</div>
        <div class="text-slate-500" style="font-size: 9px;">Assigned TG Mentor Signature</div>
      </div>
      <div>
        <div class="sig-line"></div>
        <div style="font-weight: bold;">Principal / Dean Academic</div>
        <div class="text-slate-500" style="font-size: 9px;">${institutionInfo.signatory}</div>
      </div>
    </div>

    <div class="footer-note">
      ${institutionInfo.footer}
    </div>
  </div>
</body>
</html>`;

  // Create an invisible iframe to execute printing in clean sandbox isolation
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  iframe.style.zIndex = '-9999';
  iframe.id = 'print-dossier-iframe';

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(fullHtml);
  doc.close();

  iframe.contentWindow.focus();

  setTimeout(() => {
    try {
      iframe.contentWindow.print();
    } catch (e) {
      console.error('Print iframe error:', e);
    }
    // Cleanup after print window closes
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 2000);
  }, 400);
}
