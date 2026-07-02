import { Application, ROLE_TYPE_LABELS, STATUS_LABELS } from "./types";

function escape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function applicationsToCsv(applications: Application[]): string {
  const header = [
    "Company",
    "Role",
    "Role Type",
    "Term",
    "Status",
    "Location",
    "Work Mode",
    "Sponsorship",
    "Source",
    "Referred By",
    "Salary",
    "Applied Date",
    "Deadline",
    "Next Action",
    "Next Action Date",
    "Excitement",
    "Tags",
    "URL",
    "Notes",
  ];
  const rows = applications.map((a) =>
    [
      a.company,
      a.role,
      ROLE_TYPE_LABELS[a.roleType],
      a.term,
      STATUS_LABELS[a.status],
      a.location ?? "",
      a.workMode ?? "",
      a.sponsorship,
      a.source ?? "",
      a.referrerName ?? "",
      a.salary ?? "",
      a.appliedDate ?? "",
      a.deadline ?? "",
      a.nextAction ?? "",
      a.nextActionDate ?? "",
      String(a.excitement),
      a.tags.join("; "),
      a.url ?? "",
      a.notes,
    ]
      .map(escape)
      .join(",")
  );
  return [header.join(","), ...rows].join("\n");
}

export function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
