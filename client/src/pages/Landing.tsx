import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { MessageSquare, Download, Server, Database, ArrowRight, Box, Zap, Shield, Terminal } from "lucide-react";

// Updated Asset Imports
import heroBg from "@assets/generated_images/hero_background_with_logistics_data_network.png";
import logoIcon from "@assets/generated_images/futuristic_chatbot_logo_with_fedex_colors.png";

export default function Landing() {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoIcon} alt="FDP Assistant Logo" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-bold text-lg tracking-tight">FDP Assistant</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#architecture" className="hover:text-primary transition-colors">Architecture</a>
            <Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/chat">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                Web Chat
              </Button>
            </Link>
            <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 border border-white/10">
              <Download className="w-4 h-4 mr-2" /> Extension
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6">
        {/* Hero Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
           <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background to-background z-10" />
           <img src={heroBg} alt="Logistics Network" className="w-full h-full object-cover opacity-40 mix-blend-screen" />
        </div>

        <div className="container mx-auto relative z-10 max-w-5xl text-center">
          <motion.div 
            initial={fadeIn.initial} 
            animate={fadeIn.animate} 
            transition={fadeIn.transition}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-accent mb-6 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
              </span>
              v2.0 Now Cloud Ready
            </span>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 drop-shadow-sm">
              Your Intelligent Guide to <br />
              <span className="text-primary">FedEx Development</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              RAG-powered assistant for the FedEx Developer Portal. 
              Get instant answers, code snippets, and API guidance directly in your browser.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/chat">
                <Button size="lg" className="h-12 px-8 text-base bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 border border-white/10 transition-all hover:scale-105">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Start Chatting
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base border-white/10 bg-white/5 hover:bg-white/10 hover:text-white hover:border-white/20 backdrop-blur-sm transition-all hover:scale-105">
                <Server className="w-5 h-5 mr-2" />
                Deploy Server
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white/[0.02] border-t border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Database className="w-6 h-6 text-accent" />,
                title: "Vector Knowledge Base",
                desc: "Scrapes FedEx documentation and indexes it for semantic search, ensuring accurate and up-to-date answers."
              },
              {
                icon: <Terminal className="w-6 h-6 text-primary" />,
                title: "Contextual Code Gen",
                desc: "Generates Python, Java, and Node.js snippets tailored to specific FedEx API endpoints."
              },
              {
                icon: <Zap className="w-6 h-6 text-orange-400" />,
                title: "Chrome Extension",
                desc: "Overlays directly on developer.fedex.com to provide context-aware assistance while you browse docs."
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/50 transition-all group hover:bg-white/[0.07]"
              >
                <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-white/5">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture Diagram / Info */}
      <section id="architecture" className="py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden relative shadow-2xl shadow-black/50">
             <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
             <div className="p-8 md:p-16 grid md:grid-cols-2 gap-12 items-center relative z-10">
               <div>
                 <h2 className="text-3xl font-bold mb-6">Hybrid Architecture</h2>
                 <div className="space-y-8">
                   <div className="flex gap-4 group">
                     <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 text-primary font-mono text-sm group-hover:scale-110 transition-transform">1</div>
                     <div>
                       <h4 className="font-semibold mb-2 text-lg">Local Processing</h4>
                       <p className="text-sm text-muted-foreground leading-relaxed">Web scraper runs locally to build the vector index from the latest documentation. This ensures you have control over the data ingestion pipeline.</p>
                     </div>
                   </div>
                   <div className="flex gap-4 group">
                     <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center flex-shrink-0 text-accent font-mono text-sm group-hover:scale-110 transition-transform">2</div>
                     <div>
                       <h4 className="font-semibold mb-2 text-lg">Cloud Inference</h4>
                       <p className="text-sm text-muted-foreground leading-relaxed">Vector DB artifact is pushed to the cloud server where the LLM (Ollama/OpenAI) serves requests via a FastAPI endpoint.</p>
                     </div>
                   </div>
                   <div className="flex gap-4 group">
                     <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 text-white font-mono text-sm group-hover:scale-110 transition-transform">3</div>
                     <div>
                       <h4 className="font-semibold mb-2 text-lg">Extension Client</h4>
                       <p className="text-sm text-muted-foreground leading-relaxed">The Chrome extension connects to your secure cloud API to deliver answers directly on the portal page.</p>
                     </div>
                   </div>
                 </div>
                 <div className="mt-10 pt-8 border-t border-white/10">
                   <Link href="/dashboard">
                    <Button variant="link" className="p-0 text-accent hover:text-accent/80 font-medium">
                      View System Status <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                   </Link>
                 </div>
               </div>
               
               {/* Mock Diagram */}
               <div className="aspect-square rounded-2xl bg-black/40 border border-white/10 p-8 flex flex-col items-center justify-center gap-8 relative overflow-hidden">
                  <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]"></div>
                  
                  <div className="relative z-10 w-full flex flex-col items-center">
                    {/* Cloud Layer */}
                    <div className="flex items-center gap-4 w-full justify-center">
                       <div className="p-6 rounded-xl bg-white/10 border border-white/5 text-center w-40 backdrop-blur-md shadow-xl">
                          <Server className="w-10 h-10 mx-auto mb-3 text-primary" />
                          <div className="text-sm font-mono font-semibold">Cloud API</div>
                       </div>
                    </div>
                    
                    {/* Connection Line */}
                    <div className="h-16 w-px bg-gradient-to-b from-primary to-white/20 relative my-2">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_var(--primary)] animate-pulse"></div>
                    </div>
                    
                    {/* Client Layer */}
                    <div className="flex items-center gap-8 w-full justify-center">
                       <div className="p-5 rounded-xl bg-white/5 border border-white/5 text-center w-32 hover:bg-white/10 transition-colors cursor-default">
                          <Database className="w-8 h-8 mx-auto mb-2 text-accent" />
                          <div className="text-xs font-mono text-muted-foreground">Vector Store</div>
                       </div>
                       <div className="p-5 rounded-xl bg-white/5 border border-white/5 text-center w-32 hover:bg-white/10 transition-colors cursor-default">
                          <Box className="w-8 h-8 mx-auto mb-2 text-white" />
                          <div className="text-xs font-mono text-muted-foreground">Extension</div>
                       </div>
                    </div>
                  </div>
               </div>
             </div>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-white/5 bg-black/20">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground">&copy; 2025 FedEx Developer Portal Assistant. Open Source Prototype.</p>
        </div>
      </footer>
    </div>
  );
}
