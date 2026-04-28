import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark, prism as oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { 
  Rocket, 
  MapPin, 
  Wallet, 
  Users, 
  Palette, 
  Code, 
  Loader2, 
  Check, 
  Copy, 
  Download, 
  RefreshCcw,
  Briefcase,
  Megaphone,
  Globe,
  Star,
  ArrowRight,
  ClipboardCheck,
  TrendingUp,
  PieChart,
  ListChecks,
  AlertTriangle,
  Lightbulb,
  ShieldCheck,
  Target,
  CalendarDays,
  HelpCircle,
  ChevronDown,
  Terminal,
  FolderOpen,
  FileCode,
  Zap,
  CheckCircle2,
  Layout,
  Info,
  ImageIcon,
  Sparkles,
  Quote,
  RefreshCw,
  BookOpen,
  Plus,
  Sun,
  Moon
} from 'lucide-react';
import { generateBusinessPlan, generateLogo } from './services/apiService';
import { BusinessPlanResponse } from './types';

export default function App() {
  const [step, setStep] = useState<'landing' | 'dashboard'>('landing');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BusinessPlanResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'brand' | 'plan' | 'marketing' | 'website' | 'financials' | 'analysis' | 'operations' | 'code'>('brand');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [logoLoading, setLogoLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [codeTheme, setCodeTheme] = useState<'dark' | 'light'>('dark');
  
  const [formData, setFormData] = useState({
    idea: '',
    city: '',
    budget: '',
    audience: '',
    style: 'Modern Minimalist',
    format: 'Next.js App Router'
  });

  const [copiedAll, setCopiedAll] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  const loadingMessages = [
    "Consulting local Pakistani data...",
    "Optimizing PKR unit economics...",
    "Curating brand positioning...",
    "Developing marketing hooks...",
    "Generating production-ready code...",
    "Finalizing launch strategy..."
  ];

  const handleGenerate = async () => {
    setLoading(true);
    setStep('dashboard');
    const interval = setInterval(() => {
      setLoadingMessageIndex(prev => (prev + 1) % loadingMessages.length);
    }, 2500);

    try {
      const data = await generateBusinessPlan(formData);
      setResult(data);
    } catch (error) {
      console.error(error);
      alert('Failed to generate. Please try again.');
    } finally {
      setLoading(false);
      clearInterval(interval);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const copyAllCode = () => {
    if (!result?.code.files) return;
    const allCode = result.code.files.map(f => `// ${f.name}\n${f.content}`).join('\n\n');
    navigator.clipboard.writeText(allCode);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const downloadCode = async () => {
    if (!result?.code.files) return;
    
    setDownloading(true);
    try {
      const zip = new JSZip();
      result.code.files.forEach(file => {
        const parts = file.name.split('/');
        if (parts.length > 1) {
          let current: any = zip;
          for (let i = 0; i < parts.length - 1; i++) {
            current = current.folder(parts[i]) || current;
          }
          current.file(parts[parts.length - 1], file.content);
        } else {
          zip.file(file.name, file.content);
        }
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const projectName = result.brand.names[0].replace(/\s+/g, '-').toLowerCase();
      saveAs(content, `${projectName}-business-bundle.zip`);
    } catch (error) {
      console.error('ZIP generation failed:', error);
      alert('Failed to generate ZIP. Downloading individual files as fallback.');
      result.code.files.forEach(file => {
        const blob = new Blob([file.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleGenerateLogo = async () => {
    if (!result) return;
    setLogoLoading(true);
    try {
      const url = await generateLogo(result.brand.names[0], result.brand.positioning, formData.idea);
      setResult({
        ...result,
        brand: { ...result.brand, logoUrl: url }
      });
    } catch (error) {
      console.error('Logo generation error:', error);
      alert('Failed to generate logo. Please try again.');
    } finally {
      setLogoLoading(false);
    }
  };

  const getPreviewContent = () => {
    if (!result?.code.files) return "";
    
    // For HTML format, we need to inject CSS and JS into the main HTML file
    const htmlFile = result.code.files.find(f => f.name.endsWith('index.html') || f.name.endsWith('.html'));
    const cssFiles = result.code.files.filter(f => f.name.endsWith('.css'));
    const jsFiles = result.code.files.filter(f => f.name.endsWith('.js'));

    if (!htmlFile) return "<h1>No HTML file found for preview</h1>";

    let content = htmlFile.content;

    // Inject CSS
    const styles = cssFiles.map(f => `<style>${f.content}</style>`).join('\n');
    content = content.replace('</head>', `${styles}\n</head>`);

    // Inject JS
    const scripts = jsFiles.map(f => `<script>${f.content}</script>`).join('\n');
    content = content.replace('</body>', `${scripts}\n</body>`);

    // If it's Next.js, we show a simplified "Next.js Preview" for now since we can't run a full server in srcdoc
    if (formData.format.includes('Next.js')) {
      return `
        <html>
          <head>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>${result.code.files.find(f => f.name.includes('globals.css'))?.content || ''}</style>
          </head>
          <body class="bg-slate-50 p-8">
            <div class="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-12 text-center">
              <h1 class="text-4xl font-black mb-4">Next.js Project Preview</h1>
              <p class="text-slate-500 mb-8 italic">Full server-side rendering is available upon download. This is a static visual representation.</p>
              <div class="border-t border-slate-100 pt-8 text-left prose max-w-none">
                ${result.website.hero ? `<h2 class="text-3xl font-bold">${result.website.hero}</h2>` : ''}
                ${result.website.subheading ? `<p class="text-xl text-slate-500">${result.website.subheading}</p>` : ''}
              </div>
            </div>
          </body>
        </html>
      `;
    }

    return content;
  };

  if (step === 'landing') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <header className="h-[72px] bg-white/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-8 lg:px-12 border-b border-slate-200/60">
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ rotate: 15 }}
              className="w-11 h-11 bg-slate-900 rounded-xl flex items-center justify-center shadow-xl shadow-slate-900/10 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand/20 to-transparent" />
              <Sparkles className="text-brand relative z-10" size={22} />
            </motion.div>
            <span className="text-xl font-black tracking-tighter font-display uppercase">AI Business Builder Pakistan</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-500 uppercase tracking-widest">
              <span className="hover:text-brand cursor-pointer transition-colors">How it works</span>
              <span className="hover:text-brand cursor-pointer transition-colors">Pricing</span>
            </div>
            <span className="px-3 py-1 rounded-full bg-brand/10 text-brand text-[10px] font-black uppercase border border-brand/20 tracking-tighter">Enterprise v3.0</span>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 lg:px-12 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-left"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/5 border border-brand/10 text-brand text-xs font-bold uppercase tracking-widest mb-6">
                <Zap size={14} /> AI-Powered Business Generation
              </div>
              <h1 className="text-6xl lg:text-8xl font-black leading-[0.95] mb-8 font-display">
                Build your <br />
                <span className="text-brand relative">
                  Empire
                  <svg className="absolute -bottom-2 left-0 w-full h-3 text-brand/20" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 25 0, 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="4" />
                  </svg>
                </span> <br />
                in Pakistan.
              </h1>
              
              <p className="text-xl text-slate-500 mb-10 max-w-xl leading-relaxed">
                Generate high-converting brand identities, battle-tested business plans, 
                and production-ready code — specifically tuned for the Pakistani market.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <button 
                  id="start-building-btn"
                  onClick={() => setStep('dashboard')}
                  className="px-10 py-5 bg-brand text-white rounded-2xl font-black text-lg flex items-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-brand/30 group"
                >
                  Start Building <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <div className="flex -space-x-3 items-center ml-4">
                  {[
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=64&h=64&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=64&h=64&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=64&h=64&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=64&h=64&auto=format&fit=crop'
                  ].map((url, i) => (
                    <img 
                      key={i} 
                      src={url} 
                      className="w-11 h-11 rounded-full border-4 border-white object-cover shadow-lg" 
                      alt={`User ${i + 1}`}
                    />
                  ))}
                  <span className="ml-6 text-sm font-bold text-slate-500 italic tracking-tight">+500 Pakistan SMEs</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative z-10 bg-white rounded-[2.5rem] shadow-2xl p-8 border border-slate-200/60 ring-1 ring-slate-900/5">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  </div>
                  <div className="px-3 py-1 rounded-full bg-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dashboard Preview</div>
                </div>
                <div className="space-y-6">
                  <div className="h-12 bg-slate-50 rounded-xl w-3/4 animate-pulse" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 bg-brand/5 rounded-2xl animate-pulse" />
                    <div className="h-24 bg-slate-50 rounded-2xl animate-pulse" />
                  </div>
                  <div className="h-32 bg-slate-50 rounded-2xl animate-pulse" />
                  <div className="flex justify-end">
                    <div className="h-10 bg-brand/20 w-32 rounded-lg animate-pulse" />
                  </div>
                </div>
              </div>
              {/* Decorative Blobs */}
              <div className="absolute -top-12 -right-12 w-64 h-64 bg-brand/10 blur-[80px] rounded-full" />
              <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full" />
            </motion.div>
          </div>

          <div className="mt-20 pt-16 border-t border-slate-200/60">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
               {[
                 { label: 'Brand Identities', val: '5,000+' },
                 { label: 'Growth Plans', val: '1.2k' },
                 { label: 'Launch Kits', val: '850' },
                 { label: 'Production Apps', val: '300+' }
               ].map(item => (
                 <div key={item.label} className="space-y-2">
                    <div className="text-4xl font-black text-slate-900 font-display">{item.val}</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{item.label}</div>
                 </div>
               ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans overflow-hidden">
      <header className="h-[64px] bg-white border-b border-slate-200 flex shrink-0 items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setStep('landing')}
            className="w-11 h-11 bg-slate-900 rounded-xl flex items-center justify-center shadow-xl shadow-slate-900/10 cursor-pointer active:scale-95 transition-all group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-brand/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <Sparkles className="text-brand group-hover:scale-110 transition-transform relative z-10" size={22} />
          </button>
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-tighter font-display uppercase leading-none text-slate-900">AI Business Builder Pakistan</span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Core Intelligence Engine</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-5">
             <div className="flex -space-x-2">
               {[
                 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=64&h=64&auto=format&fit=crop',
                 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=64&h=64&auto=format&fit=crop',
                 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=64&h=64&auto=format&fit=crop'
               ].map((url, i) => (
                 <img 
                   key={i} 
                   src={url} 
                   className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm" 
                   alt={`Team member ${i + 1}`}
                 />
               ))}
             </div>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Team Workspace</span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase border border-emerald-100 flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" /> System Live
            </span>
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center overflow-hidden border-2 border-white shadow-xl shadow-slate-900/10">
              <img 
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=64&h=64&auto=format&fit=crop" 
                className="w-full h-full object-cover" 
                alt="Main user"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[360px] bg-white border-r border-slate-200 p-10 flex flex-col gap-10 shrink-0 overflow-y-auto custom-scrollbar">

          <div className="space-y-8">
            <div className="flex flex-col gap-3">
              <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black flex items-center gap-2">
                <Lightbulb size={12} className="text-brand" /> Business Idea
              </label>
              <textarea 
                value={formData.idea}
                onChange={(e) => setFormData({...formData, idea: e.target.value})}
                placeholder="e.g. Handmade Leather Bags or Organic Tea Shop"
                className="px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-hidden focus:border-brand focus:ring-4 focus:ring-brand/5 shadow-inner-sm min-h-[140px] resize-none transition-all placeholder:text-slate-300 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="flex flex-col gap-3">
                <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black flex items-center gap-2">
                  <MapPin size={12} className="text-brand" /> City
                </label>
                <input 
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  placeholder="Lahore"
                  className="px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-hidden focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all font-medium"
                />
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black flex items-center gap-2">
                  <Wallet size={12} className="text-brand" /> Budget (PKR)
                </label>
                <input 
                  value={formData.budget}
                  onChange={(e) => setFormData({...formData, budget: e.target.value})}
                  placeholder="e.g. 150,000"
                  className="px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-hidden focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all font-medium"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black flex items-center gap-2">
                <Target size={12} className="text-brand" /> Target Audience
              </label>
              <input 
                value={formData.audience}
                onChange={(e) => setFormData({...formData, audience: e.target.value})}
                placeholder="e.g. Students or Professionals"
                className="px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-hidden focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all font-medium"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-black flex items-center gap-2">
                <Palette size={12} className="text-brand" /> Visual Style
              </label>
              <select 
                value={formData.style}
                onChange={(e) => setFormData({...formData, style: e.target.value})}
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-hidden focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all font-medium cursor-pointer"
              >
                <option>Modern Minimalist</option>
                <option>Traditional Heritage</option>
                <option>Luxury Premium</option>
                <option>Playful Bold</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-black flex items-center gap-2">
                <Code size={12} className="text-brand" /> Technology
              </label>
              <select 
                value={formData.format}
                onChange={(e) => setFormData({...formData, format: e.target.value})}
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-hidden focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all font-medium cursor-pointer"
              >
                <option>Next.js App Router</option>
                <option>Simple HTML/Tailwind</option>
              </select>
            </div>
          </div>

          <button 
            id="regenerate-plan-btn"
            onClick={handleGenerate}
            disabled={!formData.idea || loading}
            className="mt-auto bg-slate-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 disabled:opacity-50 transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98] group"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} className="text-brand group-hover:scale-110 transition-transform" />} 
            {result ? 'Refresh Blueprint' : 'Generate Blueprint'}
          </button>
        </aside>

        {/* Dashboard Area */}
        <section className="flex-1 p-8 overflow-y-auto relative">
          {!result && !loading ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              <div className="w-20 h-20 bg-slate-200 rounded-[2rem] flex items-center justify-center mb-6">
                <Rocket size={40} className="text-slate-400" />
              </div>
              <h2 className="text-2xl font-bold">Ready to build?</h2>
              <p className="max-w-xs">Fill in the generator details on the left to see your business kit.</p>
            </div>
          ) : loading ? (
            <div className="h-full flex flex-col items-center justify-center p-12">
              <div className="relative w-32 h-32 mb-12">
                {/* Animated Rings */}
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-4 border-brand/10 rounded-[2.5rem]"
                />
                <motion.div 
                  animate={{ rotate: -360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-2 border-4 border-dashed border-brand/20 rounded-[2rem]"
                />
                <motion.div 
                  animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-8 bg-brand/20 blur-xl rounded-full"
                />
                
                {/* Center Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ 
                      y: [0, -10, 0],
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Rocket className="text-brand" size={40} />
                  </motion.div>
                </div>
              </div>

              <div className="text-center space-y-4 max-w-sm">
                <div className="h-8">
                  <AnimatePresence mode="wait">
                    <motion.h3 
                      key={loadingMessageIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-2xl font-black tracking-tight text-slate-800"
                    >
                      {loadingMessages[loadingMessageIndex]}
                    </motion.h3>
                  </AnimatePresence>
                </div>
                
                <div className="flex flex-col gap-2">
                  <p className="text-slate-500 text-sm font-medium leading-relaxed">
                    Analyzing market trends in <span className="text-brand font-bold">{formData.city || 'Pakistan'}</span> and crafting a 360° business blueprint.
                  </p>
                  
                  {/* Progress Bar Mockup */}
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-6">
                    <motion.div 
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 15, ease: "linear" }}
                      className="h-full bg-brand"
                    />
                  </div>
                  
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Optimizing PKR Pricing</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generating Code</span>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-full h-full pointer-events-none overflow-hidden">
                 {[...Array(6)].map((_, i) => (
                   <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-brand/30 rounded-full"
                    initial={{ 
                      x: Math.random() * 400 - 200, 
                      y: Math.random() * 400 - 200,
                      opacity: 0 
                    }}
                    animate={{ 
                      y: [0, -400],
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0]
                    }}
                    transition={{ 
                      duration: 2 + Math.random() * 2, 
                      repeat: Infinity, 
                      delay: i * 0.4 
                    }}
                   />
                 ))}
              </div>
            </div>
          ) : result && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* Dashboard Header */}
              <div className="flex items-center justify-between bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <div>
                  <h1 className="text-3xl font-black font-display tracking-tight text-slate-900">Market Research Blueprint</h1>
                  <div className="flex items-center gap-3 mt-1.5 font-bold uppercase tracking-[0.1em] text-[10px]">
                    <span className="text-slate-400">Analysis for</span>
                    <span className="px-2 py-0.5 bg-brand/10 text-brand rounded-md border border-brand/10">"{formData.idea}"</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500">{formData.city || 'Pakistan'}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={handleGenerate}
                    disabled={loading}
                    className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:border-brand hover:text-brand transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                    Regenerate
                  </button>
                  <button 
                    onClick={copyAllCode} 
                    className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:border-brand hover:text-brand transition-all active:scale-95"
                  >
                    {copiedAll ? <ClipboardCheck size={16} className="text-brand" /> : <Copy size={16} />}
                    {copiedAll ? 'Copied' : 'Copy Payload'}
                  </button>
                  <button onClick={downloadCode} className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/10">
                    Export Project
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex bg-white/50 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto custom-scrollbar no-scrollbar">
                {[
                  { id: 'brand', label: 'Identity', icon: Palette },
                  { id: 'plan', label: 'Blueprint', icon: Rocket },
                  { id: 'marketing', label: 'Growth', icon: Megaphone },
                  { id: 'website', label: 'Platform', icon: Globe },
                  { id: 'financials', label: 'Capital', icon: Wallet },
                  { id: 'analysis', label: 'Market', icon: PieChart },
                  { id: 'operations', label: 'Flow', icon: ListChecks },
                  { id: 'code', label: 'Assets', icon: Code },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-5 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all rounded-xl flex items-center gap-2 shrink-0 ${
                      activeTab === tab.id 
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' 
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'
                    }`}
                  >
                    <tab.icon size={14} strokeWidth={2.5} />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="min-h-[400px]">
                {activeTab === 'brand' && (
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
                      <div className="flex items-center gap-3 mb-8">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                           <Palette size={18} />
                        </div>
                        <h3 className="text-xs uppercase tracking-[0.2em] text-slate-400 font-black">Brand Identities</h3>
                      </div>
                      <div className="space-y-6">
                        {Array.isArray(result?.brand?.names) ? result.brand.names.map((name, i) => (
                           <div key={i} className="group">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xl font-black font-display text-slate-900 group-hover:text-brand transition-colors cursor-default">{name}</span>
                                <span className="text-[10px] text-slate-300 font-mono font-bold">MODE_0{i+1}</span>
                              </div>
                              <p className="text-sm italic text-slate-500 font-medium leading-relaxed opacity-70">"{result?.brand?.taglines?.[i] || ''}"</p>
                              {i < result.brand.names.length - 1 && <div className="h-px bg-slate-100 mt-6" />}
                           </div>
                        )) : null}
                      </div>
                    </div>
                    <div className="space-y-8">
                      <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-brand/5 flex items-center justify-center text-brand">
                               <Sparkles size={18} />
                            </div>
                            <h3 className="text-xs uppercase tracking-[0.2em] text-slate-400 font-black">AI Concept Engine</h3>
                          </div>
                          <span className="bg-brand/10 text-brand text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">GPU Powered</span>
                        </div>
                        
                        <div className="aspect-square w-full max-w-[240px] mx-auto bg-slate-50 rounded-3xl border border-slate-200 flex flex-col items-center justify-center overflow-hidden relative group/logo ring-8 ring-slate-50/50">
                          {result.brand.logoUrl ? (
                            <>
                              <img 
                                src={result.brand.logoUrl} 
                                alt="Generated Logo" 
                                className="w-full h-full object-cover transition-transform group-hover/logo:scale-105"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center p-6 text-center">
                                <button 
                                  onClick={handleGenerateLogo}
                                  disabled={logoLoading}
                                  className="bg-white text-slate-900 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                                >
                                  {logoLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
                                  Regenerate
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="text-center p-8">
                              <div className="w-14 h-14 bg-white rounded-2xl shadow-xl shadow-brand/10 flex items-center justify-center mx-auto mb-4">
                                <ImageIcon size={28} className="text-slate-200" />
                              </div>
                              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-6">Visual Identity Empty</p>
                              <button 
                                onClick={handleGenerateLogo}
                                disabled={logoLoading}
                                className="bg-brand text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:shadow-xl hover:shadow-brand/20 transition-all active:scale-95 disabled:opacity-50"
                              >
                                {logoLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                {logoLoading ? 'Processing...' : 'Run Logo AI'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden group/position">
                        <div className="relative z-10">
                          <h3 className="text-xs uppercase tracking-[0.2em] text-slate-500 font-black mb-4">Market Positioning</h3>
                          <p className="text-sm leading-relaxed text-slate-300 font-medium">{result.brand.positioning}</p>
                        </div>
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-brand/10 blur-3xl rounded-full" />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'plan' && (
                  <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                      <div className="bg-white border border-slate-200 rounded-[2rem] p-10 shadow-sm relative overflow-hidden group">
                        <div className="relative z-10">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest mb-6">
                            <Rocket size={12} strokeWidth={3} /> Strategy Blueprint
                          </div>
                          <h3 className="text-3xl font-black font-display text-slate-900 mb-6 leading-tight max-w-xl group-hover:text-brand transition-colors duration-500">{result.plan.productIdea}</h3>
                          <div className="h-px bg-slate-100 w-full mb-8" />
                          <div className="grid sm:grid-cols-1 gap-10">
                             <div>
                                <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-4 block flex items-center gap-2">
                                  <Users size={12} /> Market Target
                                </label>
                                <p className="text-sm font-bold text-slate-700 leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-100 italic relative">
                                  <Quote size={12} className="absolute -top-1 -left-1 text-brand opacity-20" />
                                  {result.plan.audience}
                                </p>
                             </div>
                          </div>
                        </div>
                        <div className="absolute top-0 right-0 p-8 text-slate-50 opacity-20 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-1000">
                           <Layout size={320} />
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-8">
                          <div className="w-10 h-10 rounded-xl bg-brand/5 flex items-center justify-center text-brand">
                             <TrendingUp size={20} />
                          </div>
                          <div>
                            <h3 className="text-xs uppercase tracking-[0.2em] text-slate-400 font-black">Growth Milestones</h3>
                            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">30-60-90 Day Roadmap</p>
                          </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                           {Array.isArray(result?.plan?.growth) ? result.plan.growth.map((g, i) => (
                             <div key={i} className="bg-slate-50 hover:bg-white hover:border-brand/30 hover:shadow-xl hover:shadow-brand/5 border border-transparent p-6 rounded-3xl transition-all group flex gap-4">
                                <div className="text-xl font-black text-slate-200 font-display transition-colors group-hover:text-brand/20">0{i+1}</div>
                                <div className="text-sm font-bold text-slate-800 leading-snug pt-1">
                                   {g}
                                </div>
                             </div>
                           )) : null}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8">
                       <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                          <div className="relative z-10">
                            <h3 className="text-xs uppercase tracking-[0.2em] text-slate-500 font-black mb-8 flex items-center gap-2">
                              <AlertTriangle size={14} className="text-brand" /> Risk Assessment
                            </h3>
                            <p className="text-sm leading-relaxed text-slate-300 italic mb-10 font-medium border-l-2 border-brand/30 pl-4">"{result.plan.risks}"</p>
                            <div className="space-y-4">
                               <div className="p-5 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/[0.08] transition-colors">
                                  <h4 className="text-[10px] font-black uppercase text-brand mb-2 flex items-center gap-2">
                                    <Zap size={10} /> Market Defense
                                  </h4>
                                  <p className="text-xs text-slate-400 leading-relaxed font-medium">Positioning as a local expert to counter global entrants with aggressive hyper-local pricing.</p>
                               </div>
                               <div className="p-5 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/[0.08] transition-colors">
                                  <h4 className="text-[10px] font-black uppercase text-slate-400 mb-2 flex items-center gap-2">
                                    <Globe size={10} /> Scale Potential
                                  </h4>
                                  <p className="text-xs text-slate-500 leading-relaxed font-medium">Tier-1 city domination followed by regional expansion through affiliate network.</p>
                               </div>
                            </div>
                          </div>
                          <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-brand/5 blur-3xl rounded-full" />
                       </div>
                    </div>
                  </div>
                )}

                {activeTab === 'marketing' && (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                       <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                         <h3 className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-4">Ad Campaign Copy</h3>
                         <p className="text-sm leading-relaxed font-medium">{result.marketing.adCopy}</p>
                       </div>
                       <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                          <h3 className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-4">Key Hashtags</h3>
                          <div className="flex flex-wrap gap-2">
                             {Array.isArray(result?.marketing?.hashtags) ? result.marketing.hashtags.map((h, i) => (
                               <span key={i} className="text-brand text-xs font-bold px-3 py-1.5 bg-brand/5 rounded-full border border-brand/10">
                                 {h}
                               </span>
                             )) : null}
                          </div>
                       </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                      <h3 className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-6">Social Media Captions</h3>
                      <div className="space-y-4">
                         {Array.isArray(result?.marketing?.captions) ? result.marketing.captions.map((cap, i) => (
                           <div key={i} className="p-4 bg-slate-50 rounded-lg group relative">
                              <p className="text-sm text-slate-700 italic pr-8">"{cap}"</p>
                              <button onClick={() => copyToClipboard(cap)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Copy size={14} className="text-slate-400" />
                              </button>
                           </div>
                         )) : null}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'website' && (
                  <div className="space-y-10">
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-12 shadow-sm relative overflow-hidden group">
                       <div className="max-w-3xl mx-auto text-center relative z-10">
                          <div className="flex justify-center mb-8">
                             <div className="px-5 py-2 rounded-2xl bg-brand/5 border border-brand/10 text-brand text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-brand animate-ping" /> Landing Preview
                             </div>
                          </div>
                          <h2 className="text-5xl lg:text-6xl font-black font-display mb-6 leading-[1.1] tracking-tight text-slate-900 group-hover:translate-y-[-4px] transition-transform duration-700">{result.website.hero}</h2>
                          <p className="text-lg text-slate-500 mb-12 max-w-xl mx-auto leading-relaxed font-medium">{result.website.subheading}</p>
                          <div className="flex justify-center gap-4">
                            <button className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-slate-900/20">{result.website.cta}</button>
                            <button className="bg-white border border-slate-200 text-slate-900 px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-50 transition-all border-b-4 border-b-slate-200 hover:border-b-2 active:border-b-0 active:translate-y-1">Learn More</button>
                          </div>
                       </div>
                       <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 to-transparent opacity-50" />
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm relative group">
                        <div className="flex items-center gap-4 mb-8">
                           <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                              <BookOpen size={20} />
                           </div>
                           <h3 className="text-xs uppercase tracking-[0.2em] text-slate-400 font-black">Brand Story</h3>
                        </div>
                        <p className="text-base leading-relaxed text-slate-600 font-bold bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100/50 italic group-hover:bg-white transition-colors">"{result.website.about}"</p>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                           <div className="w-10 h-10 rounded-xl bg-brand/5 flex items-center justify-center text-brand">
                              <Layout size={20} />
                           </div>
                           <h3 className="text-xs uppercase tracking-[0.2em] text-slate-400 font-black">Services Deck</h3>
                        </div>
                        <div className="space-y-4">
                           {Array.isArray(result?.website?.services) ? result.website.services.map((s, i) => (
                             <div key={i} className="flex gap-4 items-center text-sm font-black text-slate-800 p-5 bg-slate-50 rounded-2xl border border-transparent hover:border-brand hover:bg-white hover:shadow-xl hover:shadow-brand/5 transition-all">
                               <div className="w-6 h-6 bg-brand/10 rounded-lg flex items-center justify-center text-brand">
                                 <Plus size={14} strokeWidth={3} />
                               </div>
                               {s}
                             </div>
                           )) : null}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm">
                      <div className="flex items-center justify-between mb-10">
                         <h3 className="text-xs uppercase tracking-[0.2em] text-slate-400 font-black">Customer Care (FAQ)</h3>
                         <div className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-400">Pre-built Section</div>
                      </div>
                      <div className="grid lg:grid-cols-2 gap-4">
                         {Array.isArray(result?.website?.faq) ? result.website.faq.map((item, i) => (
                           <div key={i} className="border border-slate-100 rounded-3xl overflow-hidden group">
                              <button 
                                onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                                className={`w-full text-left px-8 py-6 flex items-center justify-between gap-4 transition-all ${expandedFaq === i ? 'bg-brand text-white' : 'bg-slate-50 hover:bg-white'}`}
                              >
                                <span className={`text-sm font-black ${expandedFaq === i ? 'text-white' : 'text-slate-800'}`}>{item.q}</span>
                                <ChevronDown size={18} className={`transition-transform duration-500 ${expandedFaq === i ? 'rotate-180 text-white' : 'text-slate-300'}`} />
                              </button>
                              <AnimatePresence>
                                {expandedFaq === i && (
                                  <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden bg-brand relative"
                                  >
                                    <div className="px-8 pb-8 text-sm text-white/80 font-bold leading-relaxed">
                                      {item.a}
                                    </div>
                                    <div className="absolute right-0 bottom-0 p-4 opacity-10">
                                       <Sparkles size={80} />
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                           </div>
                         )) : null}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'financials' && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                      <h3 className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-4 flex items-center gap-2">
                        <Wallet size={14} /> One-time Startup Costs
                      </h3>
                      <div className="space-y-2">
                        {Array.isArray(result?.financials?.startupCosts) ? result.financials.startupCosts.map((cost, i) => (
                          <div key={i} className="flex justify-between items-center py-2 border-b border-dotted border-slate-200 last:border-0">
                            <span className="text-sm text-slate-600">{cost.item}</span>
                            <span className="font-bold text-slate-900 tracking-tight">{cost.amount}</span>
                          </div>
                        )) : null}
                      </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                      <h3 className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-4 flex items-center gap-2">
                        <RefreshCcw size={14} /> Monthly Expenses
                      </h3>
                      <div className="space-y-2">
                         {Array.isArray(result?.financials?.monthlyExpenses) ? result.financials.monthlyExpenses.map((expense, i) => (
                           <div key={i} className="flex justify-between items-center py-2 border-b border-dotted border-slate-200 last:border-0">
                              <span className="text-sm text-slate-600">{expense.item}</span>
                              <span className="font-bold text-slate-900 tracking-tight">{expense.amount}</span>
                           </div>
                         )) : null}
                      </div>
                    </div>
                    <div className="md:col-span-2 bg-brand/5 border border-brand/20 p-8 rounded-xl">
                       <h3 className="text-[11px] uppercase tracking-widest text-brand font-bold mb-4 flex items-center gap-2">
                         <TrendingUp size={14} /> Revenue Targets & Projections
                       </h3>
                       <p className="text-lg font-bold text-slate-800 leading-relaxed">
                         {result.financials.revenueTargets}
                       </p>
                    </div>
                  </div>
                )}

                {activeTab === 'analysis' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                          <label className="text-[10px] uppercase font-bold text-emerald-600 mb-2 block flex items-center gap-1.5"><ShieldCheck size={12}/> Strengths</label>
                          <ul className="text-xs space-y-1.5 font-medium text-emerald-900">
                             {Array.isArray(result.analysis.swot.strengths) ? result.analysis.swot.strengths.map((s, i) => <li key={i}>• {s}</li>) : <li>• {result.analysis.swot.strengths}</li>}
                          </ul>
                       </div>
                       <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
                          <label className="text-[10px] uppercase font-bold text-red-600 mb-2 block flex items-center gap-1.5"><AlertTriangle size={12}/> Weaknesses</label>
                          <ul className="text-xs space-y-1.5 font-medium text-red-900">
                             {Array.isArray(result.analysis.swot.weaknesses) ? result.analysis.swot.weaknesses.map((s, i) => <li key={i}>• {s}</li>) : <li>• {result.analysis.swot.weaknesses}</li>}
                          </ul>
                       </div>
                       <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                          <label className="text-[10px] uppercase font-bold text-blue-600 mb-2 block flex items-center gap-1.5"><Lightbulb size={12}/> Opportunities</label>
                          <ul className="text-xs space-y-1.5 font-medium text-blue-900">
                             {Array.isArray(result.analysis.swot.opportunities) ? result.analysis.swot.opportunities.map((s, i) => <li key={i}>• {s}</li>) : <li>• {result.analysis.swot.opportunities}</li>}
                          </ul>
                       </div>
                       <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl">
                          <label className="text-[10px] uppercase font-bold text-orange-600 mb-2 block flex items-center gap-1.5"><Target size={12}/> Threats</label>
                          <ul className="text-xs space-y-1.5 font-medium text-orange-900">
                             {Array.isArray(result.analysis.swot.threats) ? result.analysis.swot.threats.map((s, i) => <li key={i}>• {s}</li>) : <li>• {result.analysis.swot.threats}</li>}
                          </ul>
                       </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                       <h3 className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-6">Competitor Landscape</h3>
                       <div className="grid md:grid-cols-2 gap-4">
                          {Array.isArray(result.analysis.competitors) ? result.analysis.competitors.map((comp, i) => (
                            <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                               <h4 className="font-bold text-sm mb-1">{comp.name}</h4>
                               <p className="text-xs text-slate-500 leading-relaxed">{comp.description}</p>
                            </div>
                          )) : (
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                               <p className="text-xs text-slate-500">{result.analysis.competitors}</p>
                            </div>
                          )}
                       </div>
                    </div>
                  </div>
                )}

                {activeTab === 'operations' && (
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                      <h3 className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-4 flex items-center gap-2">
                        <Check size={14} className="text-emerald-500" /> Legal Requirements
                      </h3>
                      <ul className="space-y-2">
                        {Array.isArray(result.operations.legal) ? result.operations.legal.map((item, i) => (
                          <li key={i} className="text-sm flex gap-2 items-start py-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                            <span className="text-slate-700 font-medium">{item}</span>
                          </li>
                        )) : (
                          <li className="text-sm text-slate-700">{result.operations.legal}</li>
                        )}
                      </ul>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                      <h3 className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-4 flex items-center gap-2">
                        <Users size={14} className="text-blue-500" /> Core Team Needs
                      </h3>
                      <ul className="space-y-2">
                         {Array.isArray(result.operations.team) ? result.operations.team.map((item, i) => (
                           <li key={i} className="text-sm flex gap-2 items-start py-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                              <span className="text-slate-700 font-medium">{item}</span>
                           </li>
                         )) : (
                           <li className="text-sm text-slate-700">{result.operations.team}</li>
                         )}
                      </ul>
                    </div>
                    <div className="bg-slate-900 text-white rounded-xl p-6 shadow-xs">
                      <h3 className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-6 flex items-center gap-2">
                        <CalendarDays size={14} /> Launch Timeline (30 Days)
                      </h3>
                      <div className="space-y-6">
                         {Array.isArray(result?.operations?.timeline) ? result.operations.timeline.map((event, i) => (
                           <div key={i} className="relative pl-6 border-l border-brand/30">
                              <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-brand shadow-0 shadow-brand" />
                              <h4 className="text-[11px] uppercase font-bold text-brand mb-2">{event.week}</h4>
                              <ul className="space-y-1">
                                {Array.isArray(event.tasks) ? event.tasks.map((task, j) => (
                                  <li key={j} className="text-xs text-slate-300">• {task}</li>
                                )) : (
                                  <li className="text-xs text-slate-300">• {event.tasks}</li>
                                )}
                              </ul>
                           </div>
                         )) : null}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'code' && (
                  <div className="flex flex-col border border-slate-200 rounded-3xl bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden h-[650px] relative group">
                    <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
                      <div className="flex items-center gap-4">
                        <div className="flex gap-1.5 px-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-200 hover:bg-red-400 transition-colors cursor-pointer" />
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-200 hover:bg-amber-400 transition-colors cursor-pointer" />
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-200 hover:bg-emerald-400 transition-colors cursor-pointer" />
                        </div>
                        <div className="h-6 w-px bg-slate-200" />
                        <div>
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] font-black text-slate-800 tracking-tight uppercase">Workspace</span>
                             <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                          </div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">{(result?.code?.files?.length || 0)} Modules Loaded</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={handleGenerate}
                          disabled={loading}
                          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all bg-slate-50 border border-slate-200 text-slate-500 hover:bg-white hover:text-brand hover:border-brand/30 active:scale-95 disabled:opacity-50 group"
                        >
                          {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCcw size={12} className="group-hover:rotate-180 transition-transform duration-500" />}
                          Retry
                        </button>
                        <div className="w-px h-8 bg-slate-200 mx-1" />
                        <button 
                          onClick={() => setCodeTheme(codeTheme === 'dark' ? 'light' : 'dark')}
                          title={`Switch to ${codeTheme === 'dark' ? 'light' : 'dark'} mode`}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all bg-slate-50 border border-slate-200 text-slate-500 hover:bg-white hover:text-brand hover:border-brand/30 active:scale-95"
                        >
                          {codeTheme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
                        </button>
                        <div className="w-px h-8 bg-slate-200 mx-1" />
                        <button 
                          onClick={() => setShowPreview(!showPreview)}
                          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                            showPreview 
                            ? 'bg-brand text-white border-brand shadow-lg shadow-emerald-500/20' 
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white hover:text-brand'
                          }`}
                        >
                          {showPreview ? <Code size={12} /> : <Globe size={12} />}
                          {showPreview ? 'Source' : 'Preview'}
                        </button>
                        <div className="w-px h-8 bg-slate-200 mx-1" />
                        <button 
                          onClick={copyAllCode} 
                          className="flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-600 px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-white hover:text-slate-900 transition-all active:scale-95"
                        >
                          {copiedAll ? <ClipboardCheck size={12} className="text-emerald-500" /> : <Copy size={12} />}
                          {copiedAll ? 'Copied' : 'Copy'}
                        </button>
                        <button 
                          onClick={downloadCode} 
                          disabled={downloading}
                          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
                        >
                          {downloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} className="text-brand" />}
                          {downloading ? 'Wait' : 'Export'}
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex flex-1 overflow-hidden">
                      {/* File Sidebar - High Density Design */}
                      <div className="w-60 bg-slate-50 border-r border-slate-200 flex flex-col pt-4 shadow-[1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="px-5 mb-4 flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                             <Terminal size={10} className="text-slate-500" /> Explorer
                          </span>
                        </div>
                        <div className="flex-1 overflow-y-auto px-3 space-y-0.5 custom-scrollbar">
                          {Array.isArray(result?.code?.files) ? result.code.files.map((file, i) => {
                            const isSelected = selectedFileIndex === i;
                            const ext = file.name.split('.').pop() || '';
                            const isFolder = file.name.includes('/');
                            const fileName = file.name.split('/').pop() || file.name;
                            const dirName = file.name.includes('/') ? file.name.split('/').slice(0, -1).join('/') + '/' : '';

                            return (
                              <button
                                key={i}
                                onClick={() => setSelectedFileIndex(i)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-[11px] font-semibold flex items-center gap-3 transition-all relative group/file ${
                                  isSelected 
                                  ? 'bg-white text-brand shadow-sm border border-slate-200/60 ring-1 ring-slate-900/5' 
                                  : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-800 border border-transparent'
                                }`}
                              >
                                {isSelected && (
                                  <motion.div 
                                    layoutId="fileHighlight"
                                    className="absolute left-1 w-1 h-4 bg-brand rounded-full"
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                  />
                                )}
                                <div className={`shrink-0 transition-transform group-hover/file:scale-110 ${
                                  isSelected ? 'text-brand' :
                                  ext === 'html' ? 'text-orange-500' :
                                  ext === 'css' ? 'text-blue-500' :
                                  ext === 'js' || ext === 'jsx' ? 'text-yellow-500' :
                                  ext === 'ts' || ext === 'tsx' ? 'text-sky-500' :
                                  'text-slate-400'
                                }`}>
                                  <FileCode size={14} strokeWidth={2.5} />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  {dirName && <span className="text-[8px] text-slate-400 leading-none truncate mb-0.5">{dirName}</span>}
                                  <span className="truncate leading-tight font-bold">{fileName}</span>
                                </div>
                              </button>
                            );
                          }) : (
                            <div className="px-3 py-4 text-center text-[10px] text-slate-400 italic">No files generated</div>
                          )}
                        </div>
                        <div className="p-4 border-t border-slate-200 bg-slate-100/50">
                           <div className="flex items-center justify-between text-[9px] text-slate-400 font-black uppercase tracking-widest">
                              <div className="flex items-center gap-1.5">
                                <Zap size={10} className="text-amber-500" /> main
                              </div>
                              <span className="text-slate-300 font-normal">v1.0.4</span>
                           </div>
                        </div>
                      </div>

                      {/* Code Editor or Preview */}
                      <div className={`flex-1 flex flex-col relative transition-colors duration-300 ${codeTheme === 'dark' ? 'bg-[#0d1117]' : 'bg-white'}`}>
                        {showPreview ? (
                          <div className="flex-1 bg-white relative">
                            <iframe 
                              title="Project Preview"
                              srcDoc={getPreviewContent()}
                              className="w-full h-full border-none"
                            />
                            <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 border border-white/10">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Preview Mode
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className={`flex items-center justify-between px-6 py-3 border-b transition-colors duration-300 ${
                              codeTheme === 'dark' ? 'bg-[#161b22] border-white/5' : 'bg-slate-50 border-slate-200'
                            }`}>
                              <div className="flex items-center gap-3">
                                <span className={`text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-2 ${
                                  codeTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                                }`}>
                                  <FileCode size={12} className="text-brand" />
                                  {result?.code?.files?.[selectedFileIndex]?.name || 'untitled'}
                                </span>
                                <div className={`h-3 w-px ${codeTheme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`} />
                                <span className={`text-[9px] font-bold uppercase ${
                                  codeTheme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                                }`}>
                                  {(result?.code?.files?.[selectedFileIndex]?.content?.length || 0).toLocaleString()} bytes
                                </span>
                              </div>
                              <button 
                                onClick={() => {
                                  const content = result?.code?.files?.[selectedFileIndex]?.content;
                                  if (content) copyToClipboard(content);
                                }} 
                                className={`transition-all p-2 rounded-lg border border-transparent ${
                                  codeTheme === 'dark' 
                                  ? 'text-slate-500 hover:text-white hover:bg-white/5 hover:border-white/10' 
                                  : 'text-slate-400 hover:text-slate-900 hover:bg-slate-200/50 hover:border-slate-200'
                                }`}
                                title="Copy file"
                              >
                                <Copy size={14} />
                              </button>
                            </div>
                            
                            <div className={`flex-1 overflow-auto text-[13px] custom-scrollbar selection:bg-brand/30 ${
                              codeTheme === 'light' ? 'bg-white' : ''
                            }`}>
                              <SyntaxHighlighter 
                                language={
                                  result?.code?.files?.[selectedFileIndex]?.language?.toLowerCase() === 'html' ? 'html' :
                                  result?.code?.files?.[selectedFileIndex]?.language?.toLowerCase() === 'css' ? 'css' :
                                  result?.code?.files?.[selectedFileIndex]?.language?.toLowerCase() === 'jsx' ? 'jsx' :
                                  result?.code?.files?.[selectedFileIndex]?.language?.toLowerCase() === 'tsx' ? 'tsx' :
                                  result?.code?.files?.[selectedFileIndex]?.name.endsWith('.ts') ? 'typescript' :
                                  result?.code?.files?.[selectedFileIndex]?.name.endsWith('.tsx') ? 'tsx' :
                                  result?.code?.files?.[selectedFileIndex]?.name.endsWith('.js') ? 'javascript' :
                                  result?.code?.files?.[selectedFileIndex]?.name.endsWith('.html') ? 'html' :
                                  result?.code?.files?.[selectedFileIndex]?.name.endsWith('.json') ? 'json' :
                                  result?.code?.files?.[selectedFileIndex]?.name.endsWith('.md') ? 'markdown' :
                                  'javascript'
                                } 
                                style={codeTheme === 'dark' ? atomDark : oneLight}
                                showLineNumbers={true}
                                customStyle={{
                                  margin: 0,
                                  borderRadius: 0,
                                  padding: '2.5rem',
                                  background: 'transparent',
                                  minHeight: '100%',
                                  fontFamily: '"JetBrains Mono", monospace'
                                }}
                                lineNumberStyle={{ 
                                  minWidth: '3.5em', 
                                  paddingRight: '1.5em', 
                                  color: codeTheme === 'dark' ? '#4b5563' : '#94a3b8', 
                                  textAlign: 'right', 
                                  opacity: 0.5 
                                }}
                              >
                                {result?.code?.files?.[selectedFileIndex]?.content || ''}
                              </SyntaxHighlighter>
                            </div>
                          </>
                        )}
                        
                        {/* Status Bar */}
                        <div className="h-6 bg-brand flex items-center justify-between px-4">
                           <div className="flex gap-4">
                              <span className="text-[9px] text-white font-bold flex items-center gap-1"><CheckCircle2 size={10} /> Build: Success</span>
                              <span className="text-[9px] text-white/80 font-bold flex items-center gap-1"><Zap size={10} /> Optimized</span>
                           </div>
                           <span className="text-[9px] text-white/70 font-mono uppercase">UTF-8</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </section>
      </main>
    </div>
  );
}
