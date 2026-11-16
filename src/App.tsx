import { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Copy, 
  Download, 
  Code2,
  RefreshCw, 
  Loader2, 
  Zap, 
  ArrowRight,
  BookOpen
} from 'lucide-react';
import Markdown from 'react-markdown';
import { downloadFormattedDoc, markdownToKdpHtml } from './api';
import { TmaHeader } from './components/TmaHeader';
import { TmaNavyCard } from './components/TmaNavyCard';

function stripEmDashes(text: string): string {
  return text
    .replace(/\s*[\u2014\u2013]\s*/g, ', ')
    .replace(/([^\n-])\s*--\s*([^\n-])/g, '$1, $2')
    .replace(/,\s*,/g, ',')
    .replace(/,\s*([.!?])/g, '$1');
}

export default function App() {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [title, setTitle] = useState('');
  const [premise, setPremise] = useState('');
  const [reference, setReference] = useState('');
  const [generatedBlurb, setGeneratedBlurb] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  const handleReset = () => {
    setTitle('');
    setPremise('');
    setReference('');
    setGeneratedBlurb('');
  };

  const handleGenerate = async () => {
    if (!title.trim() || !premise.trim() || !reference.trim()) {
      alert("Please fill in the book title, premise, and reference blurb.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, premise, reference })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to generate blurb');
      }
      
      const data = await res.json();
      setGeneratedBlurb(stripEmDashes(data.text || ''));
      triggerToast('Blurb generated successfully!');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error generating blurb');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedBlurb) return;
    navigator.clipboard.writeText(generatedBlurb);
    triggerToast('Copied blurb to clipboard!');
  };

  const handleCopyKdpHtml = () => {
    if (!generatedBlurb) return;
    const kdpHtml = markdownToKdpHtml(generatedBlurb);
    navigator.clipboard.writeText(kdpHtml);
    triggerToast('Copied Amazon KDP HTML to clipboard!');
  };

  const handleDownloadDoc = () => {
    if (!generatedBlurb) {
      alert("Please generate a blurb before downloading.");
      return;
    }
    const filename = downloadFormattedDoc(title || 'Untitled Book', generatedBlurb);
    triggerToast(`Downloaded "${filename}" (opens in Word & Google Docs)!`);
  };

  return (
    <div className="min-h-screen bg-[#F7F2EA] text-[#1c3447] font-montserrat flex flex-col relative overflow-x-hidden">
      
      {/* TMA Header */}
      <TmaHeader 
        appName="BLURBSMITH"
        appFunction="AMAZON BEST-SELLER COPYWRITING ENGINE"
        badgeText="FOR AUTHORS"
        logoSrc="/Modern_Author_logo.png"
        onReset={handleReset}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-50 flex items-center gap-3 bg-[#1c3447] text-white px-5 py-3 rounded-xl border border-[#C9A66B] shadow-2xl animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-[#2A7B4C] shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow w-full">
        
        {/* Page Hero Header */}
        <div className="mb-10 text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1c3447] text-[#C9A66B] border border-[#C9A66B]/30 text-xs font-bold tracking-widest uppercase shadow-sm">
            <Zap className="w-3.5 h-3.5 fill-[#C9A66B]" />
            <span>THE MODERN AUTHOR COPYWRITING SUITE</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-playfair font-bold text-[#1c3447] tracking-tight">
            Craft High-Converting Book Descriptions
          </h1>
          <p className="text-sm sm:text-base text-[#1c3447]/80 leading-relaxed font-medium max-w-2xl mx-auto">
            Analyze bestseller structures, generate punchy copy tailored to your story, and export formatted blurbs for Word, Google Docs, or Amazon KDP.
          </p>
        </div>

        {/* Two-Column Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Left Column: TMA Navy Card Form Inputs */}
          <div>
            <TmaNavyCard stepText="STEP 1 OF 2: STORY INPUTS" title="Book Details & Reference">
              <div className="space-y-5 mt-2">
                
                {/* Title Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[#C9A66B] uppercase tracking-wider font-montserrat m-0">Book Title *</label>
                    <span className="text-[11px] text-[#E2D7C7]/60">{title.length} chars</span>
                  </div>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. The Midnight Library"
                  />
                </div>

                {/* Premise Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[#C9A66B] uppercase tracking-wider font-montserrat m-0">Premise & Story Details *</label>
                    <span className="text-[11px] text-[#E2D7C7]/60">{premise.length} chars</span>
                  </div>
                  <textarea 
                    value={premise}
                    onChange={(e) => setPremise(e.target.value)}
                    placeholder="Paste your raw story notes, main characters, themes, and plot overview..."
                    rows={5}
                  />
                </div>

                {/* Reference Blurb Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[#C9A66B] uppercase tracking-wider font-montserrat m-0">Best-Seller Reference Blurb *</label>
                    <span className="text-[11px] text-[#E2D7C7]/60">{reference.length} chars</span>
                  </div>
                  <textarea 
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Paste a description from a top-selling book in your genre to mirror its pacing, hook style, and structure..."
                    rows={5}
                  />
                </div>
                
                {/* Generate Button */}
                <div className="pt-2">
                  <button 
                    onClick={handleGenerate}
                    disabled={isGenerating || !title.trim() || !premise.trim() || !reference.trim()}
                    className="btn-primary-gold w-full py-4 text-base"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        <span>Synthesizing Blurb...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        <span>Generate Book Description</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            </TmaNavyCard>
          </div>

          {/* Right Column: TMA Navy Card Output */}
          <div>
            <TmaNavyCard stepText="STEP 2 OF 2: OUTPUT & EXPORT" title="Generated Blurb Output">
              
              <div className="min-h-[460px] flex flex-col justify-between mt-2">
                {!generatedBlurb ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center my-4 rounded-xl border border-dashed border-[#C9A66B]/30 bg-[#132432] space-y-4">
                    <div className="w-16 h-16 bg-[#1c3447] rounded-2xl border border-[#C9A66B]/40 flex items-center justify-center shadow-lg">
                      <BookOpen className="w-8 h-8 text-[#C9A66B]" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-playfair font-bold text-white">Ready to Draft</h3>
                      <p className="text-xs text-[#E2D7C7]/80 max-w-sm leading-relaxed">
                        Fill out your story details on the left and click generate to craft your optimized Amazon description.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Blurb Render Area */}
                    <div className="flex-1 overflow-y-auto p-6 rounded-xl bg-[#132432] border border-[#C9A66B]/30 max-h-[420px] my-3">
                      <div className="prose prose-invert max-w-none prose-headings:font-playfair prose-headings:text-[#C9A66B] prose-headings:font-bold prose-p:text-white prose-p:leading-relaxed prose-strong:text-white prose-strong:font-semibold">
                        <Markdown>{generatedBlurb}</Markdown>
                      </div>
                    </div>
                    
                    {/* Control Toolbar */}
                    <div className="pt-3 flex flex-wrap items-center gap-2.5 border-t border-[#C9A66B]/20 mt-2">
                      <button 
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#132432] hover:bg-[#132432]/80 text-white text-xs font-bold rounded-full border border-[#C9A66B]/40 transition-all active:scale-[0.98]"
                      >
                        <Copy className="w-4 h-4 text-[#C9A66B]" />
                        <span>Copy Text</span>
                      </button>

                      <button 
                        onClick={handleCopyKdpHtml}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#132432] hover:bg-[#132432]/80 text-white text-xs font-bold rounded-full border border-[#C9A66B]/40 transition-all active:scale-[0.98]"
                      >
                        <Code2 className="w-4 h-4 text-[#C9A66B]" />
                        <span>Copy KDP HTML</span>
                      </button>
                      
                      <button 
                        onClick={handleDownloadDoc}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#2A7B4C]/30 text-[#6EE7B7] hover:bg-[#2A7B4C]/50 border border-[#2A7B4C] text-xs font-bold rounded-full transition-all active:scale-[0.98]"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Doc (.doc)</span>
                      </button>

                      <div className="flex-1"></div>

                      <button 
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="flex items-center gap-1.5 px-3 py-2 text-[#C9A66B] hover:text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                        <span>Regenerate</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

            </TmaNavyCard>
          </div>
          
        </div>
      </main>

      {/* Sleek Footer Banner */}
      <footer className="border-t border-[#C9A66B]/30 bg-[#1c3447] text-white py-6 flex-shrink-0 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-[#E2D7C7]/90 flex items-center gap-3">
            <span className="gold-pill-badge py-1 px-3 text-[10px]">TMA PRO SUITE</span>
            <span>Upgrade to Pro ($9.99/mo) for 50 generations and instant formatted exports.</span>
          </div>
          <button className="btn-primary-gold text-xs py-2 px-5">
            <span>Explore Pro Plan</span>
            <ArrowRight className="w-3.5 h-3.5 ml-2" />
          </button>
        </div>
      </footer>
    </div>
  );
}
