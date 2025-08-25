// lib/exportToCsv.ts
export function exportToCsv(filename: string, rows: any[]) {
  if (!rows.length) return;

  const separator = ",";
  const keys = Object.keys(rows[0]);

  const csv = [
    keys.join(separator),
    ...rows.map((row) =>
      keys
        .map((k) => {
          let cell = row[k] ?? "";
          cell = cell instanceof Date ? cell.toISOString() : String(cell);
          cell = cell.replace(/"/g, '""');
          if (/[",\n]/.test(cell)) cell = `"${cell}"`;
          return cell;
        })
        .join(separator)
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
