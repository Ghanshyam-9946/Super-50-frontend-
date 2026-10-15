import { useState } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { REMARK_PURPOSES } from "../../utils/remarkPurposes";

// The one remark form, used wherever a remark is written against a student
// — the TG's student profile and the admin's Mentoring System page.
//
// It lives here rather than being written out twice because the two were
// already drifting: the admin's copy sent only the text, so remarks added
// from the Mentoring System page carried no purpose and no action taken,
// and dropped out of every count and report that groups remarks by purpose.


const fieldCls =
  "w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-2.5 px-4 text-[13px] font-medium normal-case tracking-normal text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]";
const labelCls =
  "flex flex-col gap-1 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]";

/**
 * @param {string}   studentId
 * @param {Function} onAdded  called with the student's full remark list
 * @param {string}   title    heading above the form
 */
export default function RemarkForm({ studentId, onAdded, title = "Add Remark" }) {
  const [purposeChoice, setPurposeChoice] = useState("");
  const [purposeOther, setPurposeOther] = useState("");
  const [text, setText] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const purpose = purposeChoice === "Other" ? purposeOther.trim() : purposeChoice;
    if (!purpose) return toast.error("Please choose a purpose");
    if (!text.trim()) return toast.error("Please write the remark");

    setSaving(true);
    try {
      const res = await api.post(`/admin/students/${studentId}/remarks`, {
        text: text.trim(),
        purpose,
        actionTaken: actionTaken.trim(),
      });
      onAdded?.(res.data.data.remarks);
      setText("");
      setActionTaken("");
      setPurposeChoice("");
      setPurposeOther("");
      toast.success("Remark added");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add remark");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-light)] shadow-sm">
      <h4 className="font-bold text-[var(--text-primary)] mb-4">{title}</h4>
      <form onSubmit={submit}>
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <label className={labelCls}>
            Purpose
            {/* A fixed list so remarks can be counted and compared later;
                "Other" keeps the free-text escape hatch for anything
                unforeseen. */}
            <select value={purposeChoice} onChange={(e) => setPurposeChoice(e.target.value)} className={fieldCls}>
              <option value="">Select a purpose&hellip;</option>
              {REMARK_PURPOSES.map((p) => <option key={p} value={p}>{p}</option>)}
              <option value="Other">Other</option>
            </select>
            {purposeChoice === "Other" && (
              <input
                value={purposeOther}
                onChange={(e) => setPurposeOther(e.target.value)}
                className={`${fieldCls} mt-1.5`}
                placeholder="Write the purpose"
              />
            )}
          </label>

          <label className={labelCls}>
            Action taken
            {/* A textarea, not an input: what was done about something
                usually takes more than one line. */}
            <textarea
              rows="3"
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              className={`${fieldCls} resize-y`}
              placeholder={"e.g. Parent called on 12 Sept\nWarned about attendance\nTo review next week"}
            />
          </label>
        </div>

        <textarea
          rows="5"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className={`${fieldCls} py-3 resize-y mb-1`}
          placeholder={"What happened, in as much detail as is useful.\nLine breaks are kept."}
        />
        <p className="text-[10px] text-[var(--text-secondary)] mb-3">Line breaks are kept exactly as you type them.</p>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-premium px-6 py-2 text-xs font-bold rounded-xl shadow-sm disabled:opacity-40">
            {saving ? "Saving…" : "Add Remark"}
          </button>
        </div>
      </form>
    </div>
  );
}

// One remark as it is read back, with the purpose and the action shown
// rather than buried — the same shape in both places.
export function RemarkCard({ remark }) {
  return (
    <div className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-light)] space-y-2">
      {remark.purpose && (
        <span className="inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30">
          {remark.purpose}
        </span>
      )}
      <p className="text-xs font-medium text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">{remark.text}</p>
      {remark.actionTaken && (
        <div className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap border-l-2 border-[var(--border-light)] pl-2">
          <span className="font-bold text-[var(--text-primary)]">Action taken: </span>
          {remark.actionTaken}
        </div>
      )}
      <div className="flex flex-col gap-0.5 text-[9px] font-black uppercase tracking-wider text-[var(--text-secondary)] pt-2 border-t border-[var(--border-light)]">
        <span className="text-[var(--primary)]">By: {remark.addedBy?.name || "Admin"}</span>
        <span>
          {new Date(remark.addedAt).toLocaleString("en-IN")}
          {remark.editedAt ? ` · edited ${new Date(remark.editedAt).toLocaleString("en-IN")}` : ""}
        </span>
      </div>
    </div>
  );
}
