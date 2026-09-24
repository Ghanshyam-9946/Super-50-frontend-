import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import api from "../services/api";

// Shared section picker — seeded from GET /master-data/sections (the real
// "1, 2, 3, 4, Super 50" convention, unioned with anything already assigned
// so legacy values never disappear). "+ Add" lets a coordinator type a new
// section value on the spot — it becomes real the moment it's assigned to a
// student, same as Subjects/Activities already work, no separate "create
// section" model needed.
export default function SectionSelect({ value, onChange, className, placeholder = "Select section" }) {
  const [options, setOptions] = useState([]);
  const [adding, setAdding] = useState(false);
  const [newSection, setNewSection] = useState("");

  useEffect(() => {
    api
      .get("/master-data/sections")
      .then(({ data }) => {
        if (data.success) setOptions(data.data);
      })
      .catch(() => {});
  }, []);

  const selectClass = className || "bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm";

  const confirmAdd = () => {
    const trimmed = newSection.trim();
    if (!trimmed) return setAdding(false);
    setOptions((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    onChange({ target: { value: trimmed } });
    setNewSection("");
    setAdding(false);
  };

  if (adding) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          autoFocus
          value={newSection}
          onChange={(e) => setNewSection(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && confirmAdd()}
          placeholder="New section"
          className={selectClass}
        />
        <button type="button" onClick={confirmAdd} className="text-xs font-bold px-2 py-2 rounded-lg border border-[var(--border-light)]">
          OK
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <select value={value} onChange={onChange} className={selectClass}>
        <option value="">{placeholder}</option>
        {options.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => setAdding(true)}
        title="Add a new section"
        className="text-xs font-bold p-2 rounded-lg border border-[var(--border-light)]"
      >
        <Plus size={12} />
      </button>
    </div>
  );
}
