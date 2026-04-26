import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/components/admin/AdminPage";
import { PageKeySelector, usePageKey } from "@/components/admin/PageKeySelector";
import HeroEditor from "@/components/admin/HeroEditor";

export const Route = createFileRoute("/_admin/admin/hero")({ component: AdminHero });

function AdminHero() {
  const [pageKey, setPageKey] = usePageKey();
  return (
    <AdminPage
      title="Hero"
      description="The main banner section at the top of your homepage."
      actions={<PageKeySelector value={pageKey} onChange={setPageKey} />}
    >
      <HeroEditor />
    </AdminPage>
  );
}
