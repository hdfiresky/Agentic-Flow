import React from 'react';

interface FinalOutputPanelProps {
  finalOutput: string | null;
  isProcessing: boolean;
}

const renderMarkdown = (markdown: string): string => {
  if (!markdown) return '';

  let html = markdown;

  // Code blocks (```language\ncode\n``` or ```code```)
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_match, lang, code) => {
    const languageClass = lang ? `language-${lang}` : '';
    return `<pre class="bg-gray-200 dark:bg-gray-700 p-2 rounded overflow-x-auto ${languageClass}"><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
  });
   html = html.replace(/```([\s\S]*?)```/g, (_match, code) => {
    return `<pre class="bg-gray-200 dark:bg-gray-700 p-2 rounded overflow-x-auto"><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
  });


  // Headings (e.g., # H1, ## H2)
  html = html.replace(/^###### (.*$)/gim, '<h6 class="text-sm font-semibold mt-1 mb-0.5">$1</h6>');
  html = html.replace(/^##### (.*$)/gim, '<h5 class="text-md font-semibold mt-1 mb-0.5">$1</h5>');
  html = html.replace(/^#### (.*$)/gim, '<h4 class="text-lg font-semibold mt-2 mb-1">$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mt-2 mb-1">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold mt-3 mb-1.5 border-b pb-1 dark:border-gray-600">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-4 mb-2 border-b pb-1 dark:border-gray-600">$1</h1>');

  // Links [text](url)
  html = html.replace(/\[([^\[]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 underline">$1</a>');

  // Bold (**text** or __text__)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong class="font-semibold">$1</strong>');

  // Italic (*text* or _text_)
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');
  
  // Inline code (`code`)
  html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm">$1</code>');

  // Unordered lists (- item or * item)
  html = html.replace(/^\s*[-*]\s+(.*)/gm, '<li class="ml-4 list-disc">$1</li>');
  html = html.replace(/<\/li>\n<li/g, '</li><li'); // Compact list items
  html = html.replace(/((<li class="ml-4 list-disc">.*<\/li>\s*)+)/g, '<ul class="my-1">$1</ul>');


  // Ordered lists (1. item)
  html = html.replace(/^\s*\d+\.\s+(.*)/gm, '<li class="ml-4 list-decimal">$1</li>');
  // html = html.replace(/<\/li>\n<li/g, '</li><li'); // Already handled by UL for compaction
  html = html.replace(/((<li class="ml-4 list-decimal">.*<\/li>\s*)+)/g, '<ol class="my-1">$1</ol>');


  // Paragraphs (split by double newlines, then wrap non-list/header/pre lines in <p>)
  // Preserve intentional line breaks that are not part of other block elements
  html = html.split(/\n\s*\n/).map(paragraph => {
    const trimmed = paragraph.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<ol') || trimmed.startsWith('<li') || trimmed.startsWith('<pre')) {
      return trimmed; // Already a block element
    }
    return `<p class="my-1">${trimmed.replace(/\n/g, '<br>')}</p>`; // Convert single newlines within paragraphs to <br>
  }).join('');


  return html;
};


const FinalOutputPanel: React.FC<FinalOutputPanelProps> = ({ finalOutput, isProcessing }) => {
  let content;

  if (isProcessing && !finalOutput) {
    content = <p className="text-gray-500 dark:text-gray-400 p-4 animate-pulse">Processing... generating final output.</p>;
  } else if (!finalOutput) {
    content = <p className="text-gray-500 dark:text-gray-400 p-4">No final output yet. Run a flow to see results.</p>;
  } else {
    const htmlOutput = renderMarkdown(finalOutput);
    content = <div className="p-4 prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: htmlOutput }} />;
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800 h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200 border-b pb-2 border-gray-200 dark:border-gray-700 p-4 sticky top-0 bg-gray-50 dark:bg-gray-800 z-10">
        Final Output
      </h3>
      <div className="flex-grow overflow-y-auto text-sm">
        {content}
      </div>
    </div>
  );
};

export default FinalOutputPanel;
