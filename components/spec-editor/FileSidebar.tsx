
import React from 'react';

interface FileSidebarProps {
    files: Record<string, string>;
    activeFile: string;
    setActiveFile: (file: string) => void;
    startFiles: Record<string, string>;
    snapshots: Record<string, string>;
    isExpanded: boolean;
    onToggleExpand: () => void;
    isAdding: boolean;
    setIsAdding: (adding: boolean) => void;
    newFileName: string;
    setNewFileName: (name: string) => void;
    onConfirmAdd: () => void;
    onDelete: (fileName: string) => void;
    onStartRename: (fileName: string) => void;
}

const FileSidebar: React.FC<FileSidebarProps> = ({
    files, activeFile, setActiveFile, startFiles, snapshots,
    isExpanded, onToggleExpand, isAdding, setIsAdding, newFileName, setNewFileName, onConfirmAdd,
    onDelete, onStartRename
}) => {
    
    const allFileList = Object.keys(files).sort();

    const hasUserChanges = (fileName: string) => {
        const start = startFiles[fileName] || "";
        const current = files[fileName] || "";
        return start !== current;
    };
  
    const hasAIChanges = (fileName: string) => {
        const ref = snapshots[fileName] || "";
        const start = startFiles[fileName] || "";
        return ref !== start;
    };

    return (
        <div className={`bg-slate-950 border-r border-slate-800 flex flex-col transition-all duration-300 relative z-10 overflow-hidden ${isExpanded ? 'w-48' : 'w-0 border-none'}`}>
            <div className="min-w-[12rem] flex flex-col h-full"> 
                <div className="p-3 pl-3 bg-slate-900/50 flex justify-between items-center border-b border-slate-800 h-14"> 
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Files</span>
                    <button onClick={() => { setIsAdding(true); setNewFileName(''); }} className="hover:text-cyan-400 text-slate-400 p-1" title="Add File">+</button>
                </div>
                {isAdding && (
                    <div className="px-2 py-2 bg-slate-800/50 border-l-2 border-green-500 flex gap-1 shrink-0 animate-fade-in">
                        <input 
                            autoFocus
                            className="bg-slate-900 border border-slate-700 rounded text-xs px-2 py-1 text-white flex-1 min-w-0"
                            placeholder="name.md"
                            value={newFileName}
                            onChange={(e) => setNewFileName(e.target.value)}
                            onKeyDown={(e) => {
                                if(e.key === 'Enter') onConfirmAdd();
                                if(e.key === 'Escape') setIsAdding(false);
                            }}
                        />
                        <button onClick={onConfirmAdd} className="text-green-500 hover:text-green-400 px-1">✓</button>
                        <button onClick={() => setIsAdding(false)} className="text-red-500 hover:text-red-400 px-1">✕</button>
                    </div>
                )}
                <div className="flex-1 overflow-y-auto py-2">
                    {allFileList.map(fileName => {
                        const userChanged = hasUserChanges(fileName);
                        const aiChanged = hasAIChanges(fileName);

                        return (
                            <div key={fileName} className="group relative flex items-center">
                                <button
                                    onClick={() => { 
                                        setActiveFile(fileName); 
                                        // On mobile, collapse after selection
                                        if(window.innerWidth < 768) onToggleExpand();
                                    }}
                                    className={`flex-1 px-4 py-2 text-left text-xs font-medium transition-colors border-l-2 flex items-center justify-between ${
                                        activeFile === fileName 
                                        ? 'bg-slate-800/50 text-cyan-400 border-cyan-500' 
                                        : 'text-slate-400 border-transparent hover:bg-slate-900 hover:text-slate-200'
                                    }`}
                                >
                                    <span className="truncate pr-8">{fileName}</span>
                                    <div className="flex gap-1 ml-2 shrink-0">
                                        {aiChanged && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Changed by AI"></span>}
                                        {userChanged && <span className="w-1.5 h-1.5 rounded-full bg-green-500" title="Changed by You"></span>}
                                    </div>
                                </button>
                                {(activeFile === fileName) && (
                                    <div className="absolute right-1 flex gap-1 bg-slate-900/80 rounded px-1">
                                        <button onClick={(e) => { e.stopPropagation(); onStartRename(fileName); }} className="text-slate-400 hover:text-white p-1" title="Rename">
                                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); onDelete(fileName); }} className="text-slate-400 hover:text-red-400 p-1" title="Delete">
                                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default FileSidebar;
