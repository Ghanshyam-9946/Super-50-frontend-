import { useState, useEffect } from "react";
import api from "../services/api";

// Shared batch picker — shows the familiar "2023-27" label while binding to
// the plain start-year value ("2023") the backend actually stores
// (User.js's pre-save hook normalizes any "2023-27" input down to that).
// Options come from GET /master-data/batches (real distinct student
// batches), so this never drifts from what's actually in the DB.
// `allOption`: pass a label (e.g. "All Batches") to render a leading
// value="all" option instead of the default empty placeholder — for filter
// bars that need an unscoped "everything" state rather than "nothing picked".
export default function BatchSelect({ value, onChange, className, placeholder = "Select batch", allOption }) {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    api
      .get("/master-data/batches")
      .then(({ data }) => {
        if (data.success) setOptions(data.data);
      })
      .catch(() => {});
  }, []);

  return (
    <select
      value={value}
      onChange={onChange}
      className={className || "bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm"}
    >
      {allOption ? <option value="all">{allOption}</option> : <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
