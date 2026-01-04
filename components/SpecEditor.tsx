
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { SPECS } from '../design_specs';
import { storageService } from '../services/storageService';
import { calculateDiffLines } from '../utils/diffUtils';

// Modular Components
import ImportOverlay from './spec-editor/ImportOverlay';
import SaveModal from './spec-editor/SaveModal';
import ShareModal from './spec-editor/ShareModal';
import QuickEditor from './spec-editor/QuickEditor';
import AdvancedEditor from './spec-editor/AdvancedEditor';

interface SpecEditorProps {
    isOpen: boolean; 
    onClose: () => void;
}

const SpecEditor: React.FC<SpecEditorProps> = ({ isOpen, onClose }) => {
  // State
  const [files, setFiles] = useState<Record<string, string>>(SPECS); 
  const [activeFile, setActiveFile] = useState<string>('00_welcome.md');
  const [snapshots, setSnapshots] = useState<Record<string, string>>(SPECS); 
  const [startFiles, setStartFiles] = useState<Record<string, string>>(SPECS); 
  
  const [deletedFiles, setDeletedFiles] = useState<Set<string>>(new Set());
  const [hasInitialized, setHasInitialized] = useState(false);
  
  const [viewMode, setViewMode] = useState<'EDIT' | 'DIFF'>('EDIT');
  const [isFileListExpanded, setIsFileListExpanded] = useState(true);
  
  // Workflow State
  const [editorMode, setEditorMode] = useState<'QUICK' | 'ADVANCED'>('QUICK');
  const [showImportOverlay, setShowImportOverlay] = useState(false); // Controls overlay visibility
  const [hasLoadedRef, setHasLoadedRef] = useState(false); // Tracks if reference is loaded
  
  const [quickText, setQuickText] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [refineSuccess, setRefineSuccess] = useState(false); // Visual feedback state

  const [isChatOnly, setIsChatOnly] = useState(false);
  const [debugStatus, setDebugStatus] = useState<string>("Init...");
  const [showSaveInstructions, setShowSaveInstructions] = useState(false);
  const [showShareOverlay, setShowShareOverlay] = useState(false);

  // Helper Refs
  const fileInputRef = useRef<HTMLInputElement>(null); 

  useEffect(() => {
      if (window.innerWidth < 768) setIsFileListExpanded(false);
  }, []);

  useEffect(() => {
      if (isOpen) {
          // Always try to load specs on open
          storageService.loadSpecs().then(savedSnapshots => {
              if (savedSnapshots && typeof savedSnapshots === 'object' && Object.keys(savedSnapshots).length > 0) {
                  setSnapshots(savedSnapshots);
                  setDebugStatus(`Ref Loaded`);
              } else {
                  setSnapshots(SPECS); 
                  setDebugStatus("No Ref");
              }
          });

          if (!hasInitialized) {
            setFiles(SPECS);
            setStartFiles(SPECS);
            if (!Object.keys(SPECS).includes(activeFile)) setActiveFile(Object.keys(SPECS)[0]);
            setHasInitialized(true);
          }
          
          // Reset workflow state on open
          setEditorMode('QUICK');
          setShowImportOverlay(false);
          setRefineSuccess(false);
      }
  }, [isOpen]);

  const handleClose = () => {
      storageService.saveSpecs(snapshots).then(() => {});
      onClose();
  };

  // --- Content & File Handlers (Advanced) ---
  const handleContentChange = (newContent: string) => {
      setFiles(prev => ({ ...prev, [activeFile]: newContent }));
  };
  
  const handleAddFile = (name: string) => {
      if (name && !files[name]) {
          setFiles(prev => ({ ...prev, [name]: "" }));
          setSnapshots(prev => ({ ...prev, [name]: "" }));
          setStartFiles(prev => ({ ...prev, [name]: "" }));
          setActiveFile(name);
      } else {
          alert("File already exists");
      }
  };

  const handleDeleteFile = (fileName: string) => {
      if (Object.keys(files).length <= 1) {
          alert("Cannot delete the last file.");
          return;
      }
      if (confirm(`Delete '${fileName}'?`)) {
          const newFiles = { ...files };
          delete newFiles[fileName];
          setFiles(newFiles);
          setDeletedFiles(prev => new Set(prev).add(fileName));
          if (activeFile === fileName) {
              setActiveFile(Object.keys(newFiles)[0]);
          }
      }
  };

  const handleRenameFile = (oldName: string, newName: string) => {
      if (newName && newName !== oldName && !files[newName]) {
          const content = files[oldName];
          const newFiles = { ...files };
          delete newFiles[oldName];
          newFiles[newName] = content;
          setFiles(newFiles);

          const newSnapshots = { ...snapshots };
          if (newSnapshots[oldName]) {
              const snapContent = newSnapshots[oldName];
              delete newSnapshots[oldName];
              newSnapshots[newName] = snapContent;
              setSnapshots(newSnapshots);
          }

          const newStart = { ...startFiles };
          if (newStart[oldName]) {
              const startContent = newStart[oldName];
              delete newStart[oldName];
              newStart[newName] = startContent;
              setStartFiles(newStart);
          }
          
          if (deletedFiles.has(oldName)) {
              const newDeleted = new Set(deletedFiles);
              newDeleted.delete(oldName);
              newDeleted.add(newName);
              setDeletedFiles(newDeleted);
          }
          setActiveFile(newName);
      }
  };

  // --- Diff Logic ---
  const getDiffForFile = (fileName: string, overrideContent?: string) => {
      const refText = snapshots[fileName] || "";
      const currentText = overrideContent !== undefined ? overrideContent : (files[fileName] || "");
      
      if (refText === currentText) return null;

      const diff = calculateDiffLines(refText, currentText);
      const CONTEXT = 3;
      const hunks: string[] = [];
      let currentHunk: string[] = [];
      let hunkHasChanges = false;
      let lastChangeIndex = -999;

      for (let k = 0; k < diff.length; k++) {
          const isChange = diff[k].type !== ' ';
          if (isChange) {
              if (lastChangeIndex !== -999 && k - lastChangeIndex > CONTEXT * 2 + 1) {
                  hunks.push(currentHunk.join('\n'));
                  hunks.push('... [Unchanged Section] ...');
                  currentHunk = [];
                  hunkHasChanges = false;
              }
              if (currentHunk.length === 0) {
                  const start = Math.max(0, k - CONTEXT);
                  for (let c = start; c < k; c++) {
                      currentHunk.push(`${diff[c].type} ${diff[c].text}`);
                  }
              }
              currentHunk.push(`${diff[k].type} ${diff[k].text}`);
              hunkHasChanges = true;
              lastChangeIndex = k;
          } else {
              if (hunkHasChanges && k - lastChangeIndex <= CONTEXT) {
                  currentHunk.push(`${diff[k].type} ${diff[k].text}`);
              }
          }
      }
      if (hunkHasChanges) hunks.push(currentHunk.join('\n'));
      return `Här är uppdateringar till specifikationen (${fileName}):\n\n` + hunks.join('\n');
  };

  const generateFullPrompt = (quickModeText?: string) => {
      const allDiffs: string[] = [];
      
      // If Quick Mode, we inject the text into 00_welcome.md temporarily for the prompt generation
      // This ensures the AI sees it as a change to the spec.
      let fileMap = { ...files };
      if (quickModeText) {
          const welcomeFile = '00_welcome.md';
          const originalWelcome = files[welcomeFile] || '';
          // Inject into feedback section
          const updatedWelcome = originalWelcome.replace(
              "[ Skriv dina önskemål här... ]", 
              `[ ${quickModeText} ]`
          );
          fileMap[welcomeFile] = updatedWelcome;
      }

      if (deletedFiles.size > 0) {
          const deletions = Array.from(deletedFiles).map(f => 
              `- DELETE FILE: ${f} (Note: Please rename to "_DELETED_${f}" and clear content)`
          ).join('\n');
          allDiffs.push(`Följande filer har raderats från projektet:\n${deletions}\n\nGlöm inte att uppdatera "design_specs.ts".`);
      }

      Object.keys(fileMap).sort().forEach(fileName => {
          // Pass the potentially modified content (for Quick Mode injection)
          const diff = getDiffForFile(fileName, fileMap[fileName]);
          if (diff) allDiffs.push(diff);
      });

      const newFiles = Object.keys(fileMap).filter(f => !snapshots[f]);
      if (newFiles.length > 0) {
           const newInstructions = newFiles.map(f => `- NEW FILE: ${f} (Remember to add export in design_specs.ts)`).join('\n');
           allDiffs.push(`Följande NYA filer har skapats:\n${newInstructions}`);
      }

      let output = "";
      if (allDiffs.length === 0) {
          output = "Inga ändringar hittades i någon fil jämfört med referensen. (Endast diskussion/reflektion)";
      } else {
          output = allDiffs.join('\n\n');
      }

      output += "\n\nVar god uppdatera applikationen baserat på dessa ändringar.";
      output += `\n--------------------------------------------------------------------------------\nVITAL SYSTEM REMINDER FOR AI:\n1. CONTEXT RECOVERY: You are stateless. You MUST read 'specs/10_process_log.md'...\n2. MANDATORY CLEANUP: Reset feedback...\n3. AUTONOMY: Act like a senior developer.\n--------------------------------------------------------------------------------`;
      return output;
  };

  // --- Actions ---

  const handleSaveEdits = () => {
    // 1. Generate prompt based on Advanced Edits
    const prompt = generateFullPrompt();
    
    // 2. Safe Copy
    if (navigator.clipboard) {
        navigator.clipboard.writeText(prompt)
            .then(() => {
                // Clipboard write successful
            })
            .catch((err) => {
                console.error("Clipboard write failed:", err);
                alert("Could not copy to clipboard. Please check browser permissions.");
            });
    } else {
        alert("Clipboard API not available. Please copy manually.");
    }
    
    // 3. Download Backup
    downloadSpecs(); 
    
    // 4. Sync Ref (Reset Diff for next run)
    const newSnapshots = { ...files };
    setSnapshots(newSnapshots);
    setStartFiles(newSnapshots); 
    storageService.saveSpecs(newSnapshots); 
    setDeletedFiles(new Set());
    
    // 5. Navigate back to Quick Mode
    setEditorMode('QUICK');
    setQuickText(''); 
    alert("Saved & Copied! Back to Quick Mode.");
  };

  const handleRefineAndCopy = async () => {
      if (!quickText.trim()) return;
      setIsRefining(true);
      setRefineSuccess(false);

      try {
          // 1. AI Refinement
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const refineResponse = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: `You are an expert technical product manager. 
              Rewrite the following user request to be clear, specific, and actionable for a senior developer. 
              Keep it concise but detailed.
              
              User Request: "${quickText}"`
          });
          
          const refinedText = refineResponse.text?.trim() || quickText;
          setQuickText(refinedText); 

          // 2. Generate Full Prompt 
          const fullPrompt = generateFullPrompt(refinedText);

          // 3. Copy to Clipboard (Async safe wrap)
          try {
              if (navigator.clipboard) {
                  await navigator.clipboard.writeText(fullPrompt);
              } else {
                  throw new Error("Clipboard API unavailable");
              }
              
              // 4. Open AI Studio 
              const aiLink = getLink('aiStudioLink') || "https://aistudio.google.com/";
              window.open(aiLink, '_blank');

              setRefineSuccess(true);
          } catch (clipErr) {
              console.error("Clipboard error:", clipErr);
              alert("Automatic copy failed (Permission Denied). Please manually copy the prompt from the editor if possible, or try again.");
              // We still set success to true to show the UI state so user knows refinement worked
              setRefineSuccess(true);
          }

      } catch (e) {
          console.error(e);
          alert("Refinement failed. Check API Key.");
      } finally {
          setIsRefining(false);
      }
  };

  const handleSwitchToAdvanced = () => {
      setEditorMode('ADVANCED');
      if (!hasLoadedRef) {
          setShowImportOverlay(true);
      }
  };

  const handleImport = (file: File) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
          const text = event.target?.result as string;
          if (text) {
              const newSnapshots: Record<string, string> = {};
              const parts = text.split(/--- START OF (.*?) ---\n/);
              for (let i = 1; i < parts.length; i += 2) {
                  const name = parts[i];
                  let content = parts[i + 1];
                  const endMarker = `\n--- END OF ${name} ---`;
                  if (content.endsWith(endMarker)) content = content.substring(0, content.length - endMarker.length);
                  else if (content.includes(endMarker)) content = content.split(endMarker)[0];
                  newSnapshots[name] = content;
              }
              if (Object.keys(newSnapshots).length > 0) {
                  setSnapshots(newSnapshots);
                  await storageService.saveSpecs(newSnapshots);
                  setHasLoadedRef(true);
                  setDebugStatus("Ref Imported");
                  
                  // Transition to Advanced
                  setShowImportOverlay(false);
                  setEditorMode('ADVANCED');
              } else {
                  alert("Could not parse file format.");
              }
          }
      };
      reader.readAsText(file);
  };

  const downloadSpecs = () => {
      const timestamp = new Date().toISOString().slice(0,19).replace(/[:T]/g, '-');
      const filename = `restore_point_${timestamp}.md`;
      const combined = Object.entries(files).map(([name, content]) => `--- START OF ${name} ---\n${content}\n--- END OF ${name} ---`).join('\n\n');
      const blob = new Blob([combined], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const getLink = (key: string) => {
      try { return JSON.parse(files['09_settings.json'] || '{}')[key] || ""; } catch(e) { return ""; }
  };

  const saveLink = (key: string, value: string) => {
      const settings = JSON.parse(files['09_settings.json'] || '{}');
      settings[key] = value;
      setFiles(prev => ({ ...prev, '09_settings.json': JSON.stringify(settings, null, 2) }));
  };

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm flex items-start justify-center pt-16 px-4 pb-4"
        onClick={handleClose} 
    >
          {/* 3. SHARE */}
          <ShareModal 
              isOpen={showShareOverlay} 
              onClose={() => setShowShareOverlay(false)} 
              githubLink={getLink('githubLink') || "#"}
              onSaveLink={saveLink}
          />

          {/* MAIN EDITOR CONTAINER */}
          <div 
            className="bg-slate-900 border border-slate-700 w-full max-w-7xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in relative"
            onClick={(e) => e.stopPropagation()} 
          >
            {/* Conditional Rendering based on Mode */}
            {editorMode === 'QUICK' ? (
                <QuickEditor 
                    text={quickText}
                    setText={setQuickText}
                    onRefineAndCopy={handleRefineAndCopy}
                    onSwitchToAdvanced={handleSwitchToAdvanced}
                    onClose={handleClose}
                    isRefining={isRefining}
                    refineSuccess={refineSuccess}
                />
            ) : (
                /* Advanced Mode - possibly covered by ImportOverlay */
                showImportOverlay ? (
                    <ImportOverlay 
                        onImport={handleImport} 
                        onStartFresh={() => { 
                            setHasLoadedRef(true); 
                            setShowImportOverlay(false); 
                            setEditorMode('ADVANCED'); 
                        }} 
                    />
                ) : (
                    <AdvancedEditor 
                        files={files}
                        activeFile={activeFile}
                        setActiveFile={setActiveFile}
                        startFiles={startFiles}
                        snapshots={snapshots}
                        onContentChange={handleContentChange}
                        onSave={handleSaveEdits}
                        onClose={handleClose}
                        onSwitchToQuick={() => setEditorMode('QUICK')}
                        onOpenShare={() => setShowShareOverlay(true)}
                        onImport={() => fileInputRef.current?.click()}
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                        isFileListExpanded={isFileListExpanded}
                        setIsFileListExpanded={setIsFileListExpanded}
                        debugStatus={debugStatus}
                        onAddFile={handleAddFile}
                        onDeleteFile={handleDeleteFile}
                        onRenameFile={handleRenameFile}
                    />
                )
            )}
          </div>
    </div>
  );
};

export default SpecEditor;
