"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { Lead, LeadStatus } from "@/types/database.types"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ExternalLink, MessageCircle, Clock, Search, Filter } from "lucide-react"

export function LeadsTable() {
    const [leads, setLeads] = useState<Lead[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<LeadStatus | 'ALL'>('NEW')
    const { toast } = useToast()

    useEffect(() => {
        fetchLeads()

        const channel = supabase
            .channel('schema-db-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'Lead',
                },
                (payload) => {
                    console.log('Realtime Update:', payload)
                    fetchLeads() // Simple refetch on any change
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [filter])

    const fetchLeads = async () => {
        try {
            setLoading(true)
            let query = supabase.from('Lead').select('*').order('createdAt', { ascending: false }).limit(50)

            if (filter !== 'ALL') {
                query = query.eq('status', filter)
            }

            const { data, error } = await query

            if (error) throw error
            if (data) setLeads(data as Lead[])
        } catch (error: any) {
            toast({
                title: "Erro ao buscar leads",
                description: error.message,
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const updateStatus = async (id: string, newStatus: LeadStatus) => {
        try {
            const { error } = await supabase
                .from('Lead')
                .update({ status: newStatus })
                .eq('id', id)

            if (error) throw error

            toast({
                title: "Status Atualizado",
                description: `O status do lead foi alterado para ${newStatus}.`,
            })
            // Local optimistic update
            setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l)))
        } catch (error: any) {
            toast({
                title: "Erro ao atualizar",
                description: error.message,
                variant: "destructive"
            })
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Leads Encontrados</h2>

                <div className="flex items-center space-x-2">
                    <Select value={filter} onValueChange={(v: string) => setFilter(v as any)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filtrar por Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Todos os Status</SelectItem>
                            <SelectItem value="NEW">Novos (NEW)</SelectItem>
                            <SelectItem value="REVIEWING">Revisando (REVIEWING)</SelectItem>
                            <SelectItem value="CONTACTED">Contactados (CONTACTED)</SelectItem>
                            <SelectItem value="LATER">Depois (LATER)</SelectItem>
                            <SelectItem value="DISMISSED">Descartados (DISMISSED)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {loading && leads.length === 0 ? (
                <div className="flex justify-center p-8 text-muted-foreground">Carregando leads...</div>
            ) : leads.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-12 text-center">
                    <Search className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg font-medium">Nenhum lead encontrado</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        {filter !== 'ALL' ? `Nenhum lead com status ${filter}.` : "O sistema ainda não capturou novos leads."}
                    </p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {leads.map((lead) => (
                        <Card key={lead.id} className="flex flex-col h-full border-l-4" style={{
                            borderLeftColor: lead.classification === 'BUYER' ? '#22c55e' : '#f59e0b'
                        }}>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-base truncate max-w-[200px]" title={lead.senderName || lead.senderNumber}>
                                            {lead.senderName || lead.senderNumber}
                                        </CardTitle>
                                        <CardDescription className="text-xs truncate" title={lead.groupName}>
                                            {lead.groupName}
                                        </CardDescription>
                                    </div>
                                    <Badge variant={lead.classification === 'BUYER' ? "default" : "secondary"}>
                                        {lead.classification} ({(lead.confidence * 100).toFixed(0)}%)
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 pb-2">
                                <div className="bg-muted p-3 border rounded-md text-sm mb-3">
                                    <p className="whitespace-pre-wrap font-medium">{lead.messageText}</p>
                                </div>

                                <div className="space-y-1 mb-2">
                                    <p className="text-xs text-muted-foreground font-semibold inline-flex items-center">
                                        <Search className="w-3 h-3 mr-1" /> IA:
                                    </p>
                                    <p className="text-xs italic text-muted-foreground">"{lead.geminiReason}"</p>
                                </div>

                                <div className="flex items-center text-xs text-muted-foreground mt-4">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true, locale: ptBR })}
                                </div>
                            </CardContent>
                            <CardFooter className="pt-2 flex flex-col items-stretch gap-2 border-t mt-auto">
                                <div className="flex gap-2 w-full pt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 bg-[#25D366] text-white hover:bg-[#128C7E] border-none"
                                        onClick={() => window.open(lead.whatsappLink, '_blank')}
                                    >
                                        <MessageCircle className="w-4 h-4 mr-2" />
                                        Chamar
                                    </Button>
                                    <Select value={lead.status} onValueChange={(v: string) => updateStatus(lead.id, v as LeadStatus)}>
                                        <SelectTrigger className="w-[130px] h-9 text-xs">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NEW">NEW</SelectItem>
                                            <SelectItem value="REVIEWING">REVIEWING</SelectItem>
                                            <SelectItem value="CONTACTED">CONTACTED</SelectItem>
                                            <SelectItem value="LATER">LATER</SelectItem>
                                            <SelectItem value="DISMISSED">DISMISSED</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
