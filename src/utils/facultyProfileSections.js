import {
  Award, BookOpen, Briefcase, CalendarCheck, Copyright, FileText, FolderKanban, GraduationCap,
  Lightbulb, Mic, Sparkles,
} from "lucide-react";

// The repeating sections of a faculty profile — one definition, used by
// the faculty's own editor (My Profile) and by the admin's read-only view,
// so the two can never show different fields for the same section.
//
// `key` is the field on the FacultyProfile document. Some keys are older
// than their titles (booksPublished is "Publications", conferencesAttended
// is "Events / Workshops Attended"): the names are kept so profiles saved
// before the rename still read back.
//
// `title(item)` is the bold line, `meta(item)` the small line under it.
export const PROFILE_SECTIONS = [
  {
    key: "certifications",
    title: "Certifications",
    icon: Award,
    hint: "Courses and certifications you have completed — NPTEL, Coursera, vendor certifications.",
    fields: [
      { key: "title", label: "Certification title" },
      { key: "issuedBy", label: "Issued by" },
      { key: "year", label: "Year" },
      { key: "credentialUrl", label: "Credential link (optional)" },
    ],
    title_: (c) => c.title,
    meta: (c) => [c.issuedBy, c.year],
    link: (c) => c.credentialUrl,
  },
  {
    key: "booksPublished",
    title: "Publications",
    icon: BookOpen,
    hint: "Books, book chapters, articles and other publications. Research papers have their own section.",
    fields: [
      { key: "title", label: "Title" },
      { key: "type", label: "Type", options: ["Book", "Book Chapter", "Article", "Magazine", "Other"] },
      { key: "publisher", label: "Publisher" },
      { key: "year", label: "Year" },
      { key: "isbn", label: "ISBN / ISSN (optional)" },
    ],
    title_: (b) => b.title,
    meta: (b) => [b.type, b.publisher, b.year, b.isbn && `ISBN ${b.isbn}`],
  },
  {
    key: "conferencesAttended",
    title: "Events / Workshops Attended",
    icon: CalendarCheck,
    hint: "FDPs, workshops, seminars, STTPs and conferences you attended.",
    fields: [
      { key: "title", label: "Event / workshop title" },
      { key: "type", label: "Type", options: ["Workshop", "FDP", "STTP", "Seminar", "Webinar", "Conference", "Training", "Other"] },
      { key: "event", label: "Organised by / venue" },
      { key: "duration", label: "Duration (e.g. 5 days)" },
      { key: "year", label: "Year / date" },
      { key: "role", label: "Your role (e.g. Participant)" },
    ],
    title_: (c) => c.title,
    meta: (c) => [c.type, c.event, c.role, c.duration, c.year],
  },
  {
    key: "guestInvitations",
    title: "Invited as Guest / Speaker",
    icon: Mic,
    hint: "Occasions you were invited to as a guest, speaker, resource person, session chair or judge.",
    fields: [
      { key: "title", label: "Topic / event" },
      { key: "role", label: "Invited as", options: ["Guest", "Speaker", "Keynote Speaker", "Resource Person", "Session Chair", "Judge", "Panelist", "Other"] },
      { key: "organization", label: "Invited by (institute / organisation)" },
      { key: "date", label: "Date / year" },
      { key: "description", label: "Details (optional)", type: "textarea" },
    ],
    title_: (g) => g.title,
    meta: (g) => [g.role, g.organization, g.date],
    description: (g) => g.description,
  },
  {
    key: "papersPublished",
    title: "Research Papers",
    icon: FileText,
    hint: "Journal and conference papers. Papers fetched from Google Scholar are listed separately above.",
    fields: [
      { key: "title", label: "Paper title" },
      { key: "authors", label: "Authors" },
      { key: "journal", label: "Journal / conference" },
      { key: "indexing", label: "Indexing", options: ["Scopus", "SCI / SCIE", "Web of Science", "UGC CARE", "Peer Reviewed", "Other"] },
      { key: "year", label: "Year" },
      { key: "link", label: "Link / DOI (optional)" },
    ],
    title_: (p) => p.title,
    meta: (p) => [p.authors, p.journal, p.indexing, p.year],
    link: (p) => p.link,
  },
  {
    key: "patents",
    title: "Patents",
    icon: Lightbulb,
    hint: "Patents filed, published or granted.",
    fields: [
      { key: "title", label: "Patent title" },
      { key: "patentNumber", label: "Application / patent number" },
      { key: "year", label: "Year" },
      { key: "status", label: "Status", options: ["Filed", "Published", "Granted"] },
    ],
    title_: (p) => p.title,
    meta: (p) => [p.patentNumber, p.year, p.status],
  },
  {
    key: "copyrights",
    title: "Copyrights",
    icon: Copyright,
    hint: "Copyrights applied for or registered.",
    fields: [
      { key: "title", label: "Title of the work" },
      { key: "registrationNumber", label: "Diary / registration number" },
      { key: "year", label: "Year" },
      { key: "status", label: "Status", options: ["Applied", "Registered"] },
    ],
    title_: (c) => c.title,
    meta: (c) => [c.registrationNumber, c.year, c.status],
  },
  {
    key: "projects",
    title: "Projects",
    icon: FolderKanban,
    hint: "Funded, consultancy and research projects.",
    fields: [
      { key: "title", label: "Project title" },
      { key: "role", label: "Your role", options: ["Principal Investigator", "Co-Investigator", "Coordinator", "Consultant", "Member", "Other"] },
      { key: "fundingAgency", label: "Funding agency / client" },
      { key: "amount", label: "Amount (optional)" },
      { key: "duration", label: "Duration (e.g. 2023–2025)" },
      { key: "status", label: "Status", options: ["Ongoing", "Completed", "Submitted"] },
      { key: "description", label: "Details (optional)", type: "textarea" },
    ],
    title_: (p) => p.title,
    meta: (p) => [p.role, p.fundingAgency, p.amount, p.duration, p.status],
    description: (p) => p.description,
  },
  {
    key: "qualifications",
    title: "Qualifications",
    icon: GraduationCap,
    basic: true,
    hint: "Your degrees.",
    fields: [
      { key: "degree", label: "Degree" },
      { key: "institution", label: "Institution" },
      { key: "specialization", label: "Specialization" },
      { key: "year", label: "Year" },
    ],
    title_: (q) => q.degree,
    meta: (q) => [q.institution, q.specialization, q.year],
  },
  {
    key: "experience",
    title: "Experience",
    icon: Briefcase,
    basic: true,
    hint: "Teaching and industry experience.",
    fields: [
      { key: "title", label: "Title / designation" },
      { key: "organization", label: "Organization" },
      { key: "startDate", label: "Start year" },
      { key: "endDate", label: "End year" },
      { key: "current", label: "Currently working here", type: "checkbox" },
      { key: "description", label: "Description (optional)", type: "textarea" },
    ],
    title_: (e) => [e.title, e.organization].filter(Boolean).join(" — "),
    meta: (e) => [[e.startDate, e.current ? "Present" : e.endDate].filter(Boolean).join(" – ")],
    description: (e) => e.description,
  },
  {
    key: "otherActivities",
    title: "Other Activities",
    icon: Sparkles,
    basic: true,
    hint: "Anything else worth recording — memberships, awards, committees.",
    fields: [
      { key: "title", label: "Title" },
      { key: "year", label: "Year" },
      { key: "description", label: "Description (optional)", type: "textarea" },
    ],
    title_: (a) => a.title,
    meta: (a) => [a.year],
    description: (a) => a.description,
  },
];

export const sectionByKey = (key) => PROFILE_SECTIONS.find((s) => s.key === key);

export const emptyProfile = () => ({
  headline: "", bio: "", skills: [],
  ...Object.fromEntries(PROFILE_SECTIONS.map((s) => [s.key, []])),
});
