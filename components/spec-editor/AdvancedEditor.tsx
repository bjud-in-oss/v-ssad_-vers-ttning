
import React, { useRef, useState } from 'react';
import LiveVisualDiff from './LiveVisualDiff';
import FileSidebar from './FileSidebar';

interface AdvancedEditorProps {
    files: Record<string, string>;
    activeFile: string;
    setActiveFile: (file: string) => void;
    startFiles: Record<string, string>;
    snapshots: Record<string, string>;
    onContentChange: (content: string) => void;
    onSave: () => void;
    onClose: () => void;
    onSwitchToQuick: () => void;
    onOpenShare: () => void;
    onImport: () => void; // Trigger file input
    viewMode: 'EDIT' | 'DIFF';
    setViewMode: (mode: 'EDIT' | 'DIFF') => void;
    isFileListExpanded: boolean;
    setIsFileListExpanded: (expanded: boolean) => void;
    debugStatus: string;
    
    // File Operations
    onAddFile: (name: string) => void;
    onDeleteFile: (name: string) => void;
    onRenameFile: (oldName: string, newName: string) => void;
}

const AdvancedEditor: React.FC<AdvancedEditorProps> = ({
    files, activeFile, setActiveFile, startFiles, snapshots,
    onContentChange, onSave, onClose, onSwitchToQuick, onOpenShare, onImport,
    viewMode, setViewMode, isFileListExpanded, setIsFileListExpanded, debugStatus,
    onAddFile, onDeleteFile, onRenameFile
}) => {
    // Local state for sidebar/rename UI logic
    const [isAdding, setIsAdding] = useState(false);
    const [newFileName, setNewFileName] = useState('');
    
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState('');

    const editorRef = useRef<HTMLTextAreaElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const isScrollingRef = useRef<boolean>(false);

    // Handlers wrapping props
    const handleStartRename = (fileName: string) => {
        setIsRenaming(true);
        setRenameValue(fileName);
    };

    const handleFinishRename = () => {
        if (renameValue && renameValue !== activeFile) {
            onRenameFile(activeFile, renameValue);
        }
        setIsRenaming(false);
    };

    const handleConfirmAdd = () => {
        if (newFileName) {
            onAddFile(newFileName);
            setIsAdding(false);
            setNewFileName('');
        }
    };

    // Scroll Sync
    const handleEditorScroll = () => {
        if (!editorRef.current || !previewRef.current) return;
        if (isScrollingRef.current) return;
        isScrollingRef.current = true;
        const editor = editorRef.current;
        const preview = previewRef.current;
        const percentage = editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
        preview.scrollTop = percentage * (preview.scrollHeight - preview.clientHeight);
        setTimeout(() => { isScrollingRef.current = false; }, 50);
    };
  
    const handlePreviewScroll = () => {
        if (!editorRef.current || !previewRef.current) return;
        if (isScrollingRef.current) return;
        isScrollingRef.current = true;
        const editor = editorRef.current;
        const preview = previewRef.current;
        const percentage = preview.scrollTop / (preview.scrollHeight - preview.clientHeight);
        editor.scrollTop = percentage * (editor.scrollHeight - editor.clientHeight);
        setTimeout(() => { isScrollingRef.current = false; }, 50);
    };

    return (
        <>
            {/* Header */}
            <div className="p-3 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                <div className="flex items-center gap-4"> 
                    {/* BACK TO QUICK */}
                    <button 
                        onClick={onSwitchToQuick}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold rounded border border-slate-700"
                    >
                        ← Quick Mode
                    </button>

                    {/* HAMBURGER MENU BUTTON */}
                    <button 
                        onClick={() => setIsFileListExpanded(!isFileListExpanded)}
                        className={`p-2 rounded-lg transition-colors ${isFileListExpanded ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                        title={isFileListExpanded ? "Hide Files" : "Show Files"}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    {/* VIEW MODE SELECTOR */}
                    <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-700">
                        <button 
                            onClick={() => setViewMode('EDIT')} 
                            className={`px-4 py-1 text-xs font-bold rounded transition-colors ${viewMode === 'EDIT' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Edit
                        </button>
                        <button 
                            onClick={() => setViewMode('DIFF')} 
                            className={`px-4 py-1 text-xs font-bold rounded transition-colors ${viewMode === 'DIFF' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Diff
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* SHARE BUTTON */}
                    <button 
                        onClick={onOpenShare} 
                        className="px-3 py-1.5 text-xs font-bold text-white bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg transition-transform hover:scale-105 flex items-center gap-1 shadow-lg"
                    >
                        Dela
                    </button>

                    <button 
                        onClick={onClose} 
                        className="p-1.5 text-slate-400 hover:text-white transition-colors"
                        title="Close Editor"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
            
            {/* Editor Body */}
            <div className="flex-1 overflow-hidden relative flex">
                
                {/* SIDEBAR */}
                <FileSidebar 
                    files={files}
                    activeFile={activeFile}
                    setActiveFile={setActiveFile}
                    startFiles={startFiles}
                    snapshots={snapshots}
                    isExpanded={isFileListExpanded}
                    onToggleExpand={() => setIsFileListExpanded(!isFileListExpanded)}
                    isAdding={isAdding}
                    setIsAdding={setIsAdding}
                    newFileName={newFileName}
                    setNewFileName={setNewFileName}
                    onConfirmAdd={handleConfirmAdd}
                    onDelete={onDeleteFile}
                    onStartRename={handleStartRename}
                />

                {/* MAIN CONTENT AREA */}
                <div className="flex-1 flex flex-col relative overflow-hidden">
                    <div className="flex h-full w-full">
                        
                        {/* EDITOR PANE */}
                        <div className={`flex flex-col h-full border-r border-slate-700/50 ${viewMode === 'DIFF' ? 'w-1/2' : 'w-full'}`}>
                            {isRenaming ? (
                                <div className="p-4 border-b border-slate-800 flex gap-2">
                                    <input 
                                        className="bg-slate-800 border border-slate-600 rounded text-sm px-2 py-1 text-white flex-1"
                                        value={renameValue}
                                        onChange={(e) => setRenameValue(e.target.value)}
                                    />
                                    <button onClick={handleFinishRename} className="bg-green-600 text-white px-3 py-1 rounded text-xs">Save</button>
                                    <button onClick={() => setIsRenaming(false)} className="bg-slate-700 text-white px-3 py-1 rounded text-xs">Cancel</button>
                                </div>
                            ) : null}
                            <textarea
                                ref={editorRef}
                                onScroll={handleEditorScroll}
                                value={files[activeFile]}
                                onChange={(e) => onContentChange(e.target.value)}
                                className="flex-1 w-full bg-slate-950 text-slate-300 font-mono text-sm p-6 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50 leading-relaxed" 
                                spellCheck={false}
                                placeholder="Select a file..."
                            />
                        </div>

                        {/* DIFF PANE (Conditional) */}
                        {viewMode === 'DIFF' && (
                            <div 
                                ref={previewRef}
                                onScroll={handlePreviewScroll}
                                className="flex flex-col h-full bg-slate-900 w-1/2 border-l border-slate-800 overflow-auto"
                            >
                                <LiveVisualDiff 
                                    original={snapshots[activeFile] || ""} 
                                    current={files[activeFile] || ""} 
                                    startText={startFiles[activeFile]} 
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <span className="text-[10px] text-slate-600 font-mono">{debugStatus}</span>
                </div>
                <div className="flex gap-4 items-center">
                    <button onClick={onSave} className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-green-900/20 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                        Save as
                    </button>
                </div>
            </div>
        </>
    );
};

export default AdvancedEditor;
