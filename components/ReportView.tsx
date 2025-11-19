import React from 'react';
import ReactMarkdown from 'react-markdown';

interface ReportViewProps {
  markdown: string;
}

// Simple internal markdown renderer since we can't install react-markdown in this prompt setup cleanly
// But actually, I will just render it using a simple pre-wrap or a basic parser for the purpose of this demo.
// Ideally, we would use 'react-markdown'. I will simulate a nice view.

export const ReportView: React.FC<ReportViewProps> = ({ markdown }) => {
  // Quick hack to format markdown-like text if we don't have a library, 
  // but let's try to make it look good with CSS whitespace preservation.
  
  // Formatting the headers for the specific structure requested
  const formattedContent = markdown.split('\n').map((line, index) => {
    if (line.startsWith('# ')) return <h1 key={index} className="text-3xl font-bold text-blue-400 mt-6 mb-4">{line.replace('# ', '')}</h1>;
    if (line.startsWith('## ')) return <h2 key={index} className="text-2xl font-semibold text-emerald-400 mt-5 mb-3 border-b border-emerald-500/30 pb-2">{line.replace('## ', '')}</h2>;
    if (line.startsWith('### ')) return <h3 key={index} className="text-xl font-semibold text-slate-200 mt-4 mb-2">{line.replace('### ', '')}</h3>;
    if (line.startsWith('- ')) return <li key={index} className="ml-4 text-slate-300 mb-1 list-disc">{line.replace('- ', '')}</li>;
    if (line.startsWith('  - ')) return <li key={index} className="ml-8 text-slate-400 mb-1 list-circle">{line.replace('  - ', '')}</li>;
    if (line.match(/^\d+\./)) return <li key={index} className="ml-4 text-slate-300 mb-1 list-decimal">{line}</li>;
    if (line.trim() === '') return <br key={index} />;
    return <p key={index} className="text-slate-300 mb-2 leading-relaxed">{line}</p>;
  });

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-lg overflow-hidden">
      <div className="bg-slate-700/50 px-6 py-4 border-b border-slate-700">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          📝 รายงานการวิเคราะห์เชิงลึก
        </h2>
      </div>
      <div className="p-8 bg-slate-900/50">
        <div className="prose prose-invert max-w-none">
           {formattedContent}
        </div>
      </div>
    </div>
  );
};
