"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { MonitoredGroup } from "@/types/database.types"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { PlayCircle, PauseCircle, Users, RefreshCw } from "lucide-react"

export function GroupsManager() {
    const [groups, setGroups] = useState<MonitoredGroup[]>([])
    const [loading, setLoading] = useState(true)
    const { toast } = useToast()

    const fetchGroups = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('MonitoredGroup')
                .select('*')
                .order('groupName', { ascending: true })

            if (error) throw error
            if (data) setGroups(data as MonitoredGroup[])
        } catch (error: any) {
            toast({
                title: "Erro ao buscar grupos",
                description: error.message,
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchGroups()

        const channel = supabase
            .channel('schema-db-changes-groups')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'MonitoredGroup',
                },
                () => {
                    fetchGroups()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const toggleGroup = async (groupId: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('MonitoredGroup')
                .update({ active: !currentStatus })
                .eq('groupId', groupId)

            if (error) throw error

            toast({
                title: !currentStatus ? "Grupo Ativado" : "Grupo Pausado",
                description: "Status do grupo alterado com sucesso.",
            })
            // Optimistic update
            setGroups(prev => prev.map(g => g.groupId === groupId ? { ...g, active: !currentStatus } : g))
        } catch (error: any) {
            toast({
                title: "Erro ao atualizar",
                description: error.message,
                variant: "destructive"
            })
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xl">Grupos Monitorados</CardTitle>
                    <CardDescription>Gerencie quais grupos o bot deve analisar</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchGroups} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Atualizar
                </Button>
            </CardHeader>
            <CardContent>
                {loading && groups.length === 0 ? (
                    <div className="flex justify-center p-8 text-muted-foreground">Carregando grupos...</div>
                ) : groups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg border-dashed">
                        <Users className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
                        <h3 className="text-lg font-medium">Nenhum grupo</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            O bot ainda não capturou nenhuma mensagem de grupo.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {groups.map((group) => (
                            <div key={group.groupId} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-sm md:text-base">{group.groupName}</p>
                                        {group.active ? (
                                            <Badge variant="default" className="bg-green-500 hover:bg-green-600">Ativo</Badge>
                                        ) : (
                                            <Badge variant="secondary">Pausado</Badge>
                                        )}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        ID: <span className="font-mono">{group.groupId}</span> • Visto há {formatDistanceToNow(new Date(group.updatedAt), { addSuffix: true, locale: ptBR })}
                                    </div>
                                </div>

                                <Button
                                    variant={group.active ? "destructive" : "default"}
                                    size="sm"
                                    onClick={() => toggleGroup(group.groupId, group.active)}
                                    className={!group.active ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                                >
                                    {group.active ? (
                                        <>
                                            <PauseCircle className="h-4 w-4 mr-2" />
                                            Pausar
                                        </>
                                    ) : (
                                        <>
                                            <PlayCircle className="h-4 w-4 mr-2" />
                                            Ativar
                                        </>
                                    )}
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
