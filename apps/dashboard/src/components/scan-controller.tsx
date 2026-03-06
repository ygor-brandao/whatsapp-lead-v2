"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { MonitoredGroup } from "@/types/database.types"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Search, Loader2, ListTree, Activity } from "lucide-react"

export function ScanController() {
    const [groups, setGroups] = useState<MonitoredGroup[]>([])
    const [targetCount, setTargetCount] = useState<number>(100)
    const [selectedGroup, setSelectedGroup] = useState<string>("ALL")
    const [jobs, setJobs] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [starting, setStarting] = useState(false)
    const { toast } = useToast()

    // TODO: Use actual backend API URL from env, for now assumed relative if they were served together, 
    // but they are different apps. For a production app, NEXT_PUBLIC_API_URL should be used.
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

    useEffect(() => {
        fetchGroups()
        fetchJobs()
    }, [])

    const fetchGroups = async () => {
        try {
            const { data, error } = await supabase
                .from('MonitoredGroup')
                .select('*')
                .order('groupName', { ascending: true })

            if (error) throw error
            if (data) setGroups(data as MonitoredGroup[])
        } catch (error: any) {
            console.error(error)
        }
    }

    const fetchJobs = async () => {
        try {
            setLoading(true)
            const res = await fetch(`${API_URL}/api/v1/scan/jobs`)
            if (!res.ok) throw new Error('Falha ao buscar jobs')
            const data = await res.json()
            setJobs(data.jobs || [])
        } catch (error: any) {
            toast({
                title: "Aviso",
                description: "Não foi possível carregar o histórico de scans (Backend offline?).",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const startScan = async () => {
        if (targetCount < 1 || targetCount > 100000) {
            toast({ title: "Erro", description: "Quantidade deve ser entre 1 e 100000", variant: "destructive" })
            return
        }

        try {
            setStarting(true)
            const payload: any = { targetCount: Number(targetCount) }
            if (selectedGroup !== "ALL") {
                payload.groupId = selectedGroup
            }

            const res = await fetch(`${API_URL}/api/v1/scan/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.message || 'Erro ao iniciar scan')
            }

            toast({
                title: "Scan Iniciado!",
                description: "As mensagens estão sendo processadas em background.",
            })
            fetchJobs() // Atualizar lista
        } catch (error: any) {
            toast({
                title: "Erro ao iniciar scan",
                description: error.message,
                variant: "destructive"
            })
        } finally {
            setStarting(false)
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Search className="w-5 h-5" />
                        Novo Scan Retroativo
                    </CardTitle>
                    <CardDescription>
                        Varre mensagens antigas para encontrar leads que você perdeu.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="group">Grupo Alvo</Label>
                        <Select value={selectedGroup} onValueChange={(v: string) => setSelectedGroup(v)}>
                            <SelectTrigger id="group">
                                <SelectValue placeholder="Selecione um grupo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Todos os Grupos Ativos</SelectItem>
                                {groups.map(g => (
                                    <SelectItem key={g.groupId} value={g.groupId}>{g.groupName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="targetCount">Quantidade de Mensagens (por grupo)</Label>
                        <Input
                            id="targetCount"
                            type="number"
                            min={1}
                            max={100000}
                            value={targetCount}
                            onChange={(e) => setTargetCount(Number(e.target.value))}
                        />
                        <p className="text-xs text-muted-foreground">O bot vai buscar até esse limite de mensagens no histórico e passar pela IA.</p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={startScan} disabled={starting} className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white">
                        {starting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ListTree className="mr-2 h-4 w-4" />}
                        Iniciar Varredura
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Histórico de Scans
                    </CardTitle>
                    <CardDescription>
                        Últimas execuções de varredura.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                    ) : jobs.length === 0 ? (
                        <p className="text-sm text-center text-muted-foreground p-4 border border-dashed rounded-md">Nenhum scan executado recentemente.</p>
                    ) : (
                        <div className="space-y-3">
                            {jobs.map((job: any) => (
                                <div key={job.id} className="flex flex-col space-y-1 p-3 border rounded-md text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-xs text-muted-foreground">ID: {job.id.substring(0, 8)}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${job.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                job.status === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {job.status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center mt-1 text-xs">
                                        <span>{job.groupId || 'Todos os Grupos'}</span>
                                        <span>{job.processedMsgs} / {job.targetCount} msgs</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true, locale: ptBR })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
