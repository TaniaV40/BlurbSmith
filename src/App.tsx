import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  LogIn, 
  CheckCircle2, 
  Copy, 
  FileText, 
  RefreshCw, 
  Loader2, 
  ExternalLink, 
  X, 
  ShieldCheck, 
  Check, 
  Zap, 
  ArrowRight,
  BookOpen
} from 'lucide-react';
import Markdown from 'react-markdown';
import { initAuth, googleSignIn, logout, getAccessToken } from './auth';
import { exportToGoogleDoc } from './api';
import type { User } from 'firebase/auth';
import { TmaHeader } from './components/TmaHeader';
import { TmaNavyCard } from './components/TmaNavyCard';

export default function App() {
  const [needsAuth, setNeedsAuth] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const [title, setTitle] = useState('');
  const [premise, setPremise] = useState('');
  const [reference, setReference] = useState('');
  const [generatedBlurb, setGeneratedBlurb] = useState('');

  // UI Modals & Toast State
  const [exportResult, setExportResult] = useState<{ docId: string; docUrl: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setUser(user);
        setNeedsAuth(false);
      },
      () => {
        setUser(null);
        setNeedsAuth(true);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setNeedsAuth(false);
        setShowAuthModal(false);
        triggerToast('Google Drive connected successfully!');
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      alert(err.message || 'Login failed. Please check popup permissions.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setNeedsAuth(true);
    triggerToast('Disconnected from Google Drive.');
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
      setGeneratedBlurb(data.text);
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

  const handleExport = async () => {
    if (needsAuth) {
      setShowAuthModal(true);
      return;
    }
    
    if (!generatedBlurb) {
      alert("Please generate a blurb before exporting.");
      return;
    }

    setIsExporting(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        setShowAuthModal(true);
        throw new Error("No Google Drive access token available.");
      }
      
      const result = await exportToGoogleDoc(token, title || 'Untitled Book', generatedBlurb);
      setExportResult(result);
      window.open(result.docUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      console.error("Export error:", err);
      alert(err.message || "Failed to export to Google Docs. Please try connecting Google Drive again.");
    } finally {
      setIsExporting(false);
    }
  };

  const copyDocLink = () => {
    if (!exportResult?.docUrl) return;
    navigator.clipboard.writeText(exportResult.docUrl);
    triggerToast('Google Doc URL copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-[#F7F2EA] text-[#1c3447] font-montserrat flex flex-col relative overflow-x-hidden">
      
      {/* TMA Header */}
      <TmaHeader 
        appName="BLURBSMITH"
        appFunction="AMAZON BEST-SELLER COPYWRITING ENGINE"
        badgeText="FOR AUTHORS"
        logoSrc="/Modern_Author_logo.png"
        isDriveConnected={!needsAuth}
        userDisplayName={user?.displayName || undefined}
        userPhotoURL={user?.photoURL || undefined}
        onConnectDrive={needsAuth ? handleLogin : undefined}
        onDisconnectDrive={!needsAuth ? handleLogout : undefined}
        onReset={handleReset}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-50 flex items-center gap-3 bg-[#1c3447] text-white px-5 py-3 rounded-xl border border-[#C9A66B] shadow-2xl animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-[#2A7B4C] shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Auth Prompt Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#132432]/80 backdrop-blur-md">
          <div className="bg-[#1c3447] border-2 border-[#C9A66B] rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-6 text-white">
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-[#E2D7C7]/60 hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#C9A66B]/15 border border-[#C9A66B]/40 flex items-center justify-center text-[#C9A66B]">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-playfair text-xl font-bold text-white">Connect Google Drive</h3>
                <p className="text-xs text-[#E2D7C7]/70">Required to export blurbs to Google Docs</p>
              </div>
            </div>

            <div className="space-y-3 bg-[#132432] p-4 rounded-xl border border-[#C9A66B]/20 text-xs text-[#E2D7C7]/90">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#2A7B4C] shrink-0 mt-0.5" />
                <span>Uses official Google OAuth2 (<code className="text-[#C9A66B]">drive.file</code> scope).</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#2A7B4C] shrink-0 mt-0.5" />
                <span>BlurbSmith only accesses files it creates in your Google Drive.</span>
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="btn-primary-gold w-full py-3.5"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Connecting...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Authorize & Export to Google Docs
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Export Success Modal */}
      {exportResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#132432]/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#1c3447] border-2 border-[#C9A66B] rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-6 text-white">
            <button 
              onClick={() => setExportResult(null)}
              className="absolute top-4 right-4 text-[#E2D7C7]/60 hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#2A7B4C]/20 border border-[#2A7B4C]/50 flex items-center justify-center text-[#6EE7B7]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#C9A66B]">Export Complete</span>
                <h3 className="font-playfair text-2xl font-bold text-white">Google Doc Created!</h3>
              </div>
            </div>

            <div className="bg-[#132432] border border-[#C9A66B]/30 p-4 rounded-xl space-y-1">
              <div className="text-xs text-[#E2D7C7]/70">Document Title</div>
              <div className="font-bold text-[#C9A66B] text-base truncate">
                Book Blurb - {title || 'Untitled Book'}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <a 
                href={exportResult.docUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary-gold w-full sm:flex-1 py-3"
              >
                <span>Open Google Doc</span>
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>

              <button
                onClick={copyDocLink}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#132432] hover:bg-[#132432]/80 text-white font-bold py-3 px-4 rounded-full border border-[#C9A66B]/40 transition-all text-xs"
              >
                <Copy className="w-4 h-4 text-[#C9A66B]" />
                <span>Copy Link</span>
              </button>
            </div>
          </div>
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
            Analyze bestseller structures, generate punchy copy tailored to your story, and export formatted blurbs directly to Google Docs.
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
                    <div className="pt-3 flex flex-wrap items-center gap-3 border-t border-[#C9A66B]/20 mt-2">
                      <button 
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#132432] hover:bg-[#132432]/80 text-white text-xs font-bold rounded-full border border-[#C9A66B]/40 transition-all active:scale-[0.98]"
                      >
                        <Copy className="w-4 h-4 text-[#C9A66B]" />
                        <span>Copy Text</span>
                      </button>
                      
                      <button 
                        onClick={handleExport}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#2A7B4C]/30 text-[#6EE7B7] hover:bg-[#2A7B4C]/50 border border-[#2A7B4C] text-xs font-bold rounded-full transition-all active:scale-[0.98] disabled:opacity-50"
                      >
                        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                        <span>Export to Google Doc</span>
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
            <span>Upgrade to Pro ($9.99/mo) for 50 generations and automatic Google Drive syncing.</span>
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
