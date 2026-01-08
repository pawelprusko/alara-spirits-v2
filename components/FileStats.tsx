import React from 'react';
import { ProcessedFile } from '../types';

interface FileStatsProps {
  files: ProcessedFile[];
  totalSize: number;
}

export const FileStats: React.FC<FileStatsProps> = ({ files, totalSize }) => {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const extensionCounts = files.reduce((acc, file) => {
    const ext = file.path.split('.').pop() || 'other';
    acc[ext] = (acc[ext] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
        <div className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Znalezione pliki</div>
        <div className="text-2xl font-bold text-white mt-1">{files.length}</div>
      </div>
      <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
        <div className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Całkowity rozmiar</div>
        <div className="text-2xl font-bold text-blue-400 mt-1">{formatSize(totalSize)}</div>
      </div>
      <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 col-span-2">
        <div className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-2">Typy plików</div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(extensionCounts).map(([ext, count]) => (
            <span key={ext} className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-200">
              .{ext} <span className="text-slate-400 ml-1">({count})</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};