export default function SearchFilterBar({ filters, onChange, departments = [] }) {
  const update = (key) => (e) => onChange({ ...filters, [key]: e.target.value });

  return (
    <div className="filter-bar">
      <input
        type="text"
        placeholder="Search name, USN, or email…"
        value={filters.search}
        onChange={update('search')}
        className="filter-bar__search"
      />
      <select value={filters.department} onChange={update('department')}>
        <option value="">All departments</option>
        {departments.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
      <select value={filters.status} onChange={update('status')}>
        <option value="">All statuses</option>
        <option value="present">Present</option>
        <option value="absent">Absent</option>
      </select>
    </div>
  );
}
