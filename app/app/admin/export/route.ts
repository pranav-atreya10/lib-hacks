import { getViewer } from "@/lib/auth";
import { q } from "@/lib/db";
import { libraryItems } from "@/lib/library";

function cell(value: unknown): string {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Company admins: every view, like and review in the workspace, as CSV. */
export async function GET() {
  const viewer = await getViewer();
  if (!viewer?.membership || viewer.membership.role !== "admin") {
    return new Response("Only company admins can export.", { status: 403 });
  }
  const companyId = viewer.membership.companyId;
  const [rows, items] = await Promise.all([
    q<{ kind: string; name: string; email: string; item_key: string; detail: string; created_at: Date | string }>(
      `select 'view' as kind, u.name, u.email, v.item_key, '' as detail, v.created_at
         from views v join users u on u.id = v.user_id where v.company_id = $1
       union all
       select 'like', u.name, u.email, l.item_key, '', l.created_at
         from likes l join users u on u.id = l.user_id where l.company_id = $1
       union all
       select 'review', u.name, u.email, r.item_key, r.rating || '★ ' || r.body, r.created_at
         from reviews r join users u on u.id = r.user_id where r.company_id = $1
       order by created_at desc`,
      [companyId],
    ),
    libraryItems(companyId),
  ]);
  const titles = new Map(items.map((item) => [item.key, item.title]));
  const lines = [
    ["when", "action", "person", "email", "file", "detail"].join(","),
    ...rows.map((row) =>
      [new Date(row.created_at).toISOString(), row.kind, row.name, row.email, titles.get(row.item_key) ?? row.item_key, row.detail]
        .map(cell)
        .join(","),
    ),
  ];
  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${viewer.membership.companySlug}-activity.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
