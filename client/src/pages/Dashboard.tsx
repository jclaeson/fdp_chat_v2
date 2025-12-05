import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Activity, Database, Server, Clock, CheckCircle, AlertTriangle, RefreshCw, ArrowLeft, Play, Settings, Terminal, Save, Search } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { scraperAPI, settingsAPI } from "@/lib/api";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const data = [
  { time: "00:00", queries: 12 },
  { time: "04:00", queries: 8 },
  { time: "08:00", queries: 45 },
  { time: "12:00", queries: 120 },
  { time: "16:00", queries: 90 },
  { time: "20:00", queries: 55 },
  { time: "23:59", queries: 20 },
];

export default function Dashboard() {
  const queryClient = useQueryClient();
  
  const { data: scraperStatus, isLoading } = useQuery({
    queryKey: ['scraper-status'],
    queryFn: scraperAPI.getStatus,
    refetchInterval: 5000,
  });

  const runScraperMutation = useMutation({
    mutationFn: scraperAPI.run,
    onSuccess: () => {
      toast.success("Scraper started successfully!");
      queryClient.invalidateQueries({ queryKey: ['scraper-status'] });
    },
    onError: () => {
      toast.error("Failed to start scraper");
    }
  });

  const isScraping = scraperStatus?.status === 'running';

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">System Control</h1>
              <p className="text-muted-foreground">Manage your RAG pipeline, Scraper, and LLM configurations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
             </span>
             <span className="text-sm font-medium text-green-500">System Online</span>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10 p-1">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="scraper" data-testid="tab-scraper">Scraper & Data</TabsTrigger>
            <TabsTrigger value="llm" data-testid="tab-llm">LLM Configuration</TabsTrigger>
            <TabsTrigger value="logs" data-testid="tab-logs">System Logs</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            {/* Status Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Vector Index</CardTitle>
                  <Database className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-documents-indexed">
                    {scraperStatus?.chunksCreated || '0'}
                  </div>
                  <p className="text-xs text-muted-foreground">Chunks indexed</p>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Last Scrape</CardTitle>
                  <Clock className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-last-scrape">
                    {scraperStatus?.completedAt 
                      ? formatDistanceToNow(new Date(scraperStatus.completedAt), { addSuffix: true })
                      : 'Never'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {scraperStatus?.status === 'running' ? 'Currently running...' : 'via Python Scraper'}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Scraper Status</CardTitle>
                  <Activity className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold capitalize" data-testid="text-scraper-status">
                    {scraperStatus?.status || 'Idle'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {scraperStatus?.documentsFound ? `${scraperStatus.documentsFound} docs found` : 'Ready to run'}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Model Backend</CardTitle>
                  <Server className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-model-backend">Hybrid</div>
                  <p className="text-xs text-muted-foreground">Ollama + OpenAI</p>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle>Query Volume (Mock Data)</CardTitle>
                <CardDescription>Requests processed by the RAG engine over the last 24h</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                      <defs>
                        <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} labelStyle={{ color: 'hsl(var(--foreground))' }} />
                      <Area type="monotone" dataKey="queries" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorQueries)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SCRAPER TAB */}
          <TabsContent value="scraper" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="col-span-2 bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle>Scraper Configuration</CardTitle>
                  <CardDescription>Manage how your Python scraper ingests FedEx documentation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Target URL</Label>
                    <div className="flex gap-2">
                      <Input 
                        defaultValue="https://developer.fedex.com/api/en-us/catalog.html" 
                        className="bg-black/20" 
                        data-testid="input-target-url"
                      />
                      <Button variant="outline" data-testid="button-search-url"><Search className="w-4 h-4" /></Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Depth Limit</Label>
                      <Input type="number" defaultValue="3" className="bg-black/20" data-testid="input-depth-limit" />
                    </div>
                    <div className="space-y-2">
                      <Label>Request Delay (ms)</Label>
                      <Input type="number" defaultValue="1000" className="bg-black/20" data-testid="input-request-delay" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-black/20">
                    <div className="space-y-0.5">
                      <Label className="text-base">Scheduled Scrape</Label>
                      <p className="text-sm text-muted-foreground">Automatically update vector store every 24h</p>
                    </div>
                    <Switch defaultChecked data-testid="switch-scheduled-scrape" />
                  </div>
                </CardContent>
                <CardFooter className="justify-between border-t border-white/10 pt-6">
                  <div className="text-sm text-muted-foreground">
                    {scraperStatus?.completedAt 
                      ? `Last run: ${formatDistanceToNow(new Date(scraperStatus.completedAt), { addSuffix: true })}`
                      : 'Never run'}
                  </div>
                  <div className="flex gap-2">
                     <Button 
                       className="bg-accent hover:bg-accent/90 text-white" 
                       onClick={() => runScraperMutation.mutate()}
                       disabled={isScraping || runScraperMutation.isPending}
                       data-testid="button-run-scraper"
                     >
                        {isScraping ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                        {isScraping ? "Running..." : "Run Scraper Now"}
                     </Button>
                  </div>
                </CardFooter>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle>Vector Store</CardTitle>
                  <CardDescription>ChromaDB Status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                   <div className="space-y-4">
                      <div className="flex justify-between items-center">
                         <span className="text-sm text-muted-foreground">Chunks</span>
                         <span className="font-mono font-bold" data-testid="text-chunks-count">
                           {scraperStatus?.chunksCreated || 0}
                         </span>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="text-sm text-muted-foreground">Documents</span>
                         <span className="font-mono font-bold" data-testid="text-docs-count">
                           {scraperStatus?.documentsFound || 0}
                         </span>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="text-sm text-muted-foreground">Embedding Model</span>
                         <Badge variant="outline">nomic-embed-text</Badge>
                      </div>
                   </div>
                   <div className="pt-4 border-t border-white/10">
                      <Button variant="destructive" className="w-full" size="sm" data-testid="button-rebuild-index">
                         <RefreshCw className="w-3 h-3 mr-2" /> Rebuild Index
                      </Button>
                   </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* LLM CONFIG TAB */}
          <TabsContent value="llm" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
               <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                     <CardTitle>Model Settings</CardTitle>
                     <CardDescription>Configure Ollama / OpenAI parameters</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                     <div className="space-y-4">
                        <div className="space-y-2">
                           <Label>RAG Model (Ollama)</Label>
                           <select className="w-full h-10 rounded-md border border-input bg-black/20 px-3 py-2 text-sm" data-testid="select-rag-model">
                              <option>llama3 (Default)</option>
                              <option>llama3.1</option>
                              <option>mistral</option>
                           </select>
                        </div>
                        <div className="space-y-2">
                           <Label>General Chat Model (OpenAI)</Label>
                           <select className="w-full h-10 rounded-md border border-input bg-black/20 px-3 py-2 text-sm" data-testid="select-openai-model">
                              <option>gpt-4o-mini (Default)</option>
                              <option>gpt-4o</option>
                              <option>gpt-4-turbo</option>
                           </select>
                        </div>
                        <div className="space-y-4">
                           <div className="flex justify-between">
                              <Label>Temperature</Label>
                              <span className="text-xs text-muted-foreground">0.7</span>
                           </div>
                           <Slider defaultValue={[0.7]} max={1} step={0.1} data-testid="slider-temperature" />
                        </div>
                     </div>
                  </CardContent>
               </Card>

               <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                     <CardTitle>System Prompt</CardTitle>
                     <CardDescription>Define the persona and rules for the assistant</CardDescription>
                  </CardHeader>
                  <CardContent>
                     <textarea 
                        className="w-full h-[250px] bg-black/20 rounded-md border border-input p-4 font-mono text-sm leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                        defaultValue={`You are an expert FedEx Developer Assistant. 
Your goal is to help developers integrate with FedEx APIs.
Rules:
1. Always prioritize security and best practices.
2. When providing code snippets, use the latest API v1 endpoints.
3. If the answer is not in the context, admit you don't know.
4. Be concise and professional.`}
                        data-testid="textarea-system-prompt"
                     />
                  </CardContent>
                  <CardFooter className="justify-end border-t border-white/10 pt-4">
                     <Button data-testid="button-save-prompt">
                        <Save className="w-4 h-4 mr-2" /> Save Prompt
                     </Button>
                  </CardFooter>
               </Card>
            </div>
          </TabsContent>

          {/* LOGS TAB */}
          <TabsContent value="logs">
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>System Logs</CardTitle>
                <div className="flex gap-2">
                  <Input placeholder="Filter logs..." className="h-8 w-[200px] bg-black/20" data-testid="input-filter-logs" />
                  <Button variant="outline" size="sm" className="h-8 border-white/10 hover:bg-white/10" data-testid="button-refresh-logs">
                    <RefreshCw className="mr-2 h-3 w-3" /> Sync
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 font-mono text-xs max-h-[500px] overflow-y-auto">
                  {scraperStatus?.errorMessage && (
                    <div className="flex gap-2 items-start border-l-2 border-red-500 pl-3 pb-1">
                      <span className="text-muted-foreground">{new Date().toLocaleTimeString()}</span>
                      <span className="font-bold text-red-400">[ERROR]</span>
                      <span className="text-white/80">{scraperStatus.errorMessage}</span>
                    </div>
                  )}
                  {[
                    { time: "14:02:33", level: "INFO", msg: "System initialized successfully" },
                    { time: "14:02:35", level: "INFO", msg: "Database connection established" },
                    { time: "14:02:41", level: "SUCCESS", msg: "OpenAI integration active" },
                    { time: "14:02:45", level: "INFO", msg: "Hybrid routing configured: RAG + GPT-4" },
                  ].map((log, i) => (
                    <div key={i} className="flex gap-2 items-start border-l-2 border-white/10 pl-3 pb-1">
                      <span className="text-muted-foreground">{log.time}</span>
                      <span className={`font-bold ${
                        log.level === 'INFO' ? 'text-blue-400' : 
                        log.level === 'WARN' ? 'text-yellow-400' : 
                        'text-green-400'
                      }`}>[{log.level}]</span>
                      <span className="text-white/80">{log.msg}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
