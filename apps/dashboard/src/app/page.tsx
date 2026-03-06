import { LeadsTable } from "@/components/leads-table"
import { GroupsManager } from "@/components/groups-manager"
import { ScanController } from "@/components/scan-controller"
import { StatsBar } from "@/components/stats-bar"
import { ConnectionPill } from "@/components/connection-status"
import { GroupLinksView } from "@/components/group-links"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
              LeadWatcher
            </h1>
            <p className="text-muted-foreground">Monitor Inteligente de WhatsApp by Antigravity</p>
          </div>

          <ConnectionPill />
        </div>

        <StatsBar />

        <Tabs defaultValue="leads" className="w-full">
          <TabsList className="mb-4 flex flex-wrap h-auto gap-2">
            <TabsTrigger value="leads">Leads Capturados</TabsTrigger>
            <TabsTrigger value="groups">Monitoramento (Grupos)</TabsTrigger>
            <TabsTrigger value="scanner">Scanner Retroativo</TabsTrigger>
            <TabsTrigger value="links">Links de Novos Grupos</TabsTrigger>
          </TabsList>

          <TabsContent value="leads" className="space-y-4">
            <LeadsTable />
          </TabsContent>

          <TabsContent value="groups">
            <GroupsManager />
          </TabsContent>

          <TabsContent value="scanner">
            <ScanController />
          </TabsContent>

          <TabsContent value="links">
            <GroupLinksView />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
