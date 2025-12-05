import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, Database, Server, Clock, CheckCircle, AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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
  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">System Status</h1>
              <p className="text-muted-foreground">Monitor your RAG pipeline and scraper health</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
             </span>
             <span className="text-sm font-medium text-green-500">Operational</span>
          </div>
        </div>

        {/* Status Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vector Index</CardTitle>
              <Database className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">14,205</div>
              <p className="text-xs text-muted-foreground">Documents indexed</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Scrape</CardTitle>
              <Clock className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2h 15m</div>
              <p className="text-xs text-muted-foreground">Ago via Python Scraper</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Latency</CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">145ms</div>
              <p className="text-xs text-muted-foreground">Average p95</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Server className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">573</div>
              <p className="text-xs text-muted-foreground">via Chrome Extension</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          {/* Chart */}
          <Card className="col-span-4 bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle>Query Volume</CardTitle>
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
                    <XAxis 
                      dataKey="time" 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `${value}`} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="queries" 
                      stroke="hsl(var(--primary))" 
                      fillOpacity={1} 
                      fill="url(#colorQueries)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Scraper Logs Mockup */}
          <Card className="col-span-3 bg-white/5 border-white/10 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Scraper Logs</CardTitle>
              <Button variant="outline" size="sm" className="h-8 border-white/10 hover:bg-white/10">
                <RefreshCw className="mr-2 h-3 w-3" /> Sync
              </Button>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-4 font-mono text-xs">
                {[
                  { time: "14:02:33", level: "INFO", msg: "Starting crawl on developer.fedex.com" },
                  { time: "14:02:35", level: "INFO", msg: "Found 24 new API endpoints" },
                  { time: "14:02:41", level: "WARN", msg: "Rate limit warning - pausing for 2s" },
                  { time: "14:02:45", level: "INFO", msg: "Parsing /ship/v1/shipments schema" },
                  { time: "14:03:12", level: "SUCCESS", msg: "Updated 156 vector embeddings" },
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
        </div>
      </div>
    </div>
  );
}
