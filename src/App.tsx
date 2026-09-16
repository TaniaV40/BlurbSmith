/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  BookOpen, 
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
  ArrowRight 
} from 'lucide-react';
import Markdown from 'react-markdown';
import { initAuth, googleSignIn, logout, getAccessToken } from './auth';
import { exportToGoogleDoc } from './api';
import type { User } from 'firebase/auth';

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
      // Auto open doc in new tab as well
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
    <div className="min-h-screen bg-brand-navy text-brand-cream font-montserrat selection:bg-brand-gold/30 flex flex-col relative overflow-x-hidden">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 bg-brand-dark/95 text-brand-cream px-4 py-3 rounded-xl border border-brand-teal/40 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-brand-teal shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Auth Prompt Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-navy/80 backdrop-blur-md">
          <div className="bg-brand-dark border border-brand-gold/30 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-6">
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-brand-cream/40 hover:text-brand-cream transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-brand-teal/10 border border-brand-teal/30 flex items-center justify-center text-brand-teal">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-playfair text-xl font-bold text-brand-cream">Connect Google Drive</h3>
                <p className="text-xs text-brand-cream/60">Required to export blurbs to Google Docs</p>
              </div>
            </div>

            <div className="space-y-3 bg-brand-navy/50 p-4 rounded-xl border border-brand-cream/10 text-xs text-brand-cream/80">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-teal shrink-0 mt-0.5" />
                <span>Uses official Google OAuth2 (<code className="text-brand-gold">drive.file</code> scope).</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-brand-teal shrink-0 mt-0.5" />
                <span>BlurbSmith only accesses files it creates in your Google Drive.</span>
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center gap-2 bg-brand-gold hover:bg-brand-gold/90 text-brand-navy font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-brand-gold/15 active:scale-[0.99] disabled:opacity-50"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Authorize & Export to Google Docs
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Export Success Modal */}
      {exportResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-navy/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-brand-dark border border-brand-gold/40 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-6">
            <button 
              onClick={() => setExportResult(null)}
              className="absolute top-4 right-4 text-brand-cream/40 hover:text-brand-cream transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-teal/15 border border-brand-teal/40 flex items-center justify-center text-brand-teal shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-teal">Export Complete</span>
                <h3 className="font-playfair text-2xl font-bold text-brand-cream">Google Doc Created!</h3>
              </div>
            </div>

            <div className="bg-brand-navy/60 border border-brand-gold/20 p-4 rounded-xl space-y-2">
              <div className="text-xs text-brand-cream/60">Document Title</div>
              <div className="font-medium text-brand-gold text-base truncate">
                Book Blurb - {title || 'Untitled Book'}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <a 
                href={exportResult.docUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:flex-1 flex items-center justify-center gap-2 bg-brand-gold hover:bg-brand-gold/90 text-brand-navy font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-brand-gold/20 active:scale-[0.98]"
              >
                <span>Open Google Doc</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                onClick={copyDocLink}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-navy hover:bg-brand-navy/80 text-brand-cream font-medium py-3 px-4 rounded-xl border border-brand-cream/20 transition-all"
              >
                <Copy className="w-4 h-4 text-brand-teal" />
                <span>Copy Link</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      <nav className="border-b border-brand-dark/60 bg-brand-navy/90 backdrop-blur-md sticky top-0 z-40 flex-shrink-0 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-gold/20 to-brand-teal/20 border border-brand-gold/30 flex items-center justify-center text-brand-gold shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-2xl tracking-tight text-brand-cream font-playfair block leading-none">BlurbSmith</span>
              <span className="text-[10px] text-brand-teal font-medium tracking-widest uppercase">Amazon Blurb Engine</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-dark/80 border border-brand-cream/10 text-xs text-brand-cream/70 font-medium">
              <Zap className="w-3.5 h-3.5 text-brand-gold fill-brand-gold" />
              <span>Credits: <strong className="text-brand-teal font-semibold">3/3 Free</strong></span>
            </div>
            
            {needsAuth ? (
              <button 
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="flex items-center gap-2 px-4 py-2 bg-brand-dark hover:bg-brand-dark/80 border border-brand-gold/30 text-brand-cream text-xs sm:text-sm font-semibold rounded-lg transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
              >
                {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin text-brand-gold" /> : <LogIn className="w-4 h-4 text-brand-gold" />}
                <span>Connect Google Drive</span>
              </button>
            ) : (
              <div className="flex items-center gap-3 bg-brand-dark/80 border border-brand-teal/30 px-3 py-1.5 rounded-xl">
                <div className="flex items-center gap-2 text-xs font-medium text-brand-cream/90">
                  <img 
                    src={user?.photoURL || 'https://lh3.googleusercontent.com/a/default-user'} 
                    alt="User" 
                    className="w-6 h-6 rounded-full border border-brand-teal/50 object-cover" 
                  />
                  <span className="max-w-[100px] truncate">{user?.displayName || 'Connected'}</span>
                  <CheckCircle2 className="w-4 h-4 text-brand-teal shrink-0" />
                </div>
                <button 
                  onClick={handleLogout}
                  className="text-[11px] text-brand-cream/40 hover:text-brand-cream transition-colors border-l border-brand-cream/10 pl-2"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
        
        {/* Intro Header */}
        <div className="mb-8 max-w-3xl space-y-2">
          <h1 className="text-3xl sm:text-4xl font-playfair font-bold text-brand-cream tracking-tight">
            Craft High-Converting Book Descriptions
          </h1>
          <p className="text-sm sm:text-base text-brand-cream/70 leading-relaxed font-normal">
            Analyze bestseller structures, generate copy tailored to your story, and export formatted blurbs directly to Google Docs.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start h-full">
          
          {/* Left Column: Inputs */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-playfair font-semibold text-brand-cream flex items-center gap-2">
                <span>Story Inputs</span>
              </h2>
              <span className="text-xs text-brand-gold font-medium bg-brand-gold/10 px-2.5 py-1 rounded-full border border-brand-gold/20">Step 1 of 2</span>
            </div>
            
            <div className="glass-card rounded-2xl p-6 shadow-2xl space-y-5">
              
              {/* Title Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-brand-cream/90 uppercase tracking-wider">Book Title *</label>
                  <span className="text-[11px] text-brand-cream/40">{title.length} chars</span>
                </div>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. The Midnight Library"
                  className="w-full glass-input rounded-xl px-4 py-3 text-sm text-brand-cream placeholder:text-brand-cream/30 focus:outline-none transition-all"
                />
              </div>

              {/* Premise Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-brand-cream/90 uppercase tracking-wider">Premise & Story Details *</label>
                  <span className="text-[11px] text-brand-cream/40">{premise.length} chars</span>
                </div>
                <textarea 
                  value={premise}
                  onChange={(e) => setPremise(e.target.value)}
                  placeholder="Paste your raw story notes, main characters, themes, and plot overview..."
                  rows={5}
                  className="w-full glass-input rounded-xl px-4 py-3 text-sm text-brand-cream placeholder:text-brand-cream/30 focus:outline-none transition-all resize-none"
                />
              </div>

              {/* Reference Blurb Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-brand-cream/90 uppercase tracking-wider">Best-Seller Reference Blurb *</label>
                  <span className="text-[11px] text-brand-cream/40">{reference.length} chars</span>
                </div>
                <textarea 
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Paste a description from a top-selling book in your genre to mirror its pacing, hook style, and structure..."
                  rows={5}
                  className="w-full glass-input rounded-xl px-4 py-3 text-sm text-brand-cream placeholder:text-brand-cream/30 focus:outline-none transition-all resize-none"
                />
              </div>
              
              {/* Generate Button */}
              <div className="pt-2">
                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !title.trim() || !premise.trim() || !reference.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-gold to-[#D4B37F] hover:brightness-110 text-brand-navy font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-brand-gold/15 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Synthesizing Blurb...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Generate Book Description</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>

          {/* Right Column: Output & Export */}
          <div className="space-y-6 lg:sticky lg:top-24">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-playfair font-semibold text-brand-cream">Generated Output</h2>
              <span className="text-xs text-brand-teal font-medium bg-brand-teal/10 px-2.5 py-1 rounded-full border border-brand-teal/20">Step 2 of 2</span>
            </div>

            <div className="glass-card rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[580px] relative">
              
              {!generatedBlurb ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center m-6 rounded-xl border border-dashed border-brand-cream/15 bg-brand-navy/30 space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-brand-navy to-brand-dark rounded-2xl border border-brand-gold/20 flex items-center justify-center shadow-md">
                    <BookOpen className="w-8 h-8 text-brand-gold" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-playfair font-bold text-brand-cream">Ready to Draft</h3>
                    <p className="text-xs text-brand-cream/60 max-w-sm leading-relaxed">
                      Fill out your story details on the left and click generate to craft your optimized Amazon description.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Blurb Render Area */}
                  <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-brand-navy/40">
                    <div className="prose prose-invert max-w-none prose-headings:font-playfair prose-headings:text-brand-gold prose-headings:font-bold prose-p:text-brand-cream/90 prose-p:leading-relaxed prose-strong:text-brand-cream prose-strong:font-semibold">
                      <Markdown>{generatedBlurb}</Markdown>
                    </div>
                  </div>
                  
                  {/* Control Toolbar */}
                  <div className="bg-brand-dark/90 border-t border-brand-cream/10 p-4 flex flex-wrap items-center gap-3">
                    
                    <button 
                      onClick={handleCopy}
                      className="flex items-center gap-2 px-4 py-2 bg-brand-navy hover:bg-brand-navy/80 text-brand-cream text-xs font-semibold rounded-xl transition-all border border-brand-cream/15 active:scale-[0.98]"
                    >
                      <Copy className="w-4 h-4 text-brand-gold" />
                      <span>Copy Copytext</span>
                    </button>
                    
                    <button 
                      onClick={handleExport}
                      disabled={isExporting}
                      className="flex items-center gap-2 px-4 py-2 bg-brand-teal/15 text-brand-teal hover:bg-brand-teal/25 border border-brand-teal/30 text-xs font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                      <span>Save to Google Docs</span>
                    </button>

                    <div className="flex-1"></div>

                    <button 
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="flex items-center gap-1.5 px-3 py-2 text-brand-cream/60 hover:text-brand-cream text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                      <span>Regenerate</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          
        </div>
      </main>

      {/* Upgrade Footer Banner */}
      <footer className="border-t border-brand-cream/10 bg-brand-dark/95 py-4 flex-shrink-0 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-brand-cream/70 flex items-center gap-2">
            <span className="px-2 py-0.5 bg-brand-gold/20 text-brand-gold font-bold rounded text-[10px] uppercase">Pro Upgrade</span>
            <span>Need unlimited generations & direct Google Workspace sync? Upgrade for $9.99/mo.</span>
          </div>
          <button className="flex items-center gap-1.5 px-5 py-2 bg-brand-gold text-brand-navy hover:bg-brand-gold/90 text-xs font-bold rounded-xl transition-all shadow-md active:scale-[0.98]">
            <span>Explore Pro Plan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </footer>
    </div>
  );
}
