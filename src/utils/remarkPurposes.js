// The reasons a remark is recorded against a student. Shared wording
// matters: these get counted and compared across the department, so a
// free-text "low attendence" would simply not appear in the totals.
//
// In their own file because both the TG's form and the admin's Mentoring
// System page read them, and a component file that also exports constants
// breaks fast refresh.
export const REMARK_PURPOSES = [
  "Low Attendance",
  "Fee Due / Fee Reminder",
  "Behavioral Issues",
  "Low Academic Performance",
  "Poor Class Participation",
  "POD AI Performance",
  "Training Performance",
  "Placement",
  "Parent\u2013Teacher Meeting (PTM)",
  "Counselling Required",
  "Student Achievement",
  "Participation & Engagement",
];
