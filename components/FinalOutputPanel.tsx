import React from 'react';

interface FinalOutputPanelProps {
  finalOutput: string | null;
  isProcessing: boolean;
}

/**
 * @what Converts a markdown string to an HTML string with Tailwind CSS classes.
 * @why To display the AI's final output in a nicely formatted way, supporting common markdown
 * features like headings, lists, bold/italic text, and code blocks.
 * @how It uses a series of `replace` calls with regular expressions to find markdown syntax
 * and convert it to the corresponding HTML tags with appropriate styling classes. This is a
 * lightweight, dependency-free markdown parser.
 * @param {string} markdown - The raw markdown text to convert.
 * @returns {string} An HTML string.
 */
const renderMarkdown = (markdown: string): string => {
  if (!markdown) return '';

  let html = markdown;

  // Code blocks (```language\ncode\n``` or ```code```)
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_match, lang, code) => {
    const languageClass = lang ? `language-${lang}` : '';
    // Escape HTML characters inside code blocks to prevent them from being rendered as HTML.
    const safeCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<pre class="bg-gray-200 dark:bg-gray-700 p-2 rounded overflow-x-auto ${languageClass}"><code>${safeCode}</code></pre>`;
  });
   html = html.replace(/```([\s\S]*?)```/g, (_match, code) => {
    const safeCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<pre class="bg-gray-200 dark:bg-gray-700 p-2 rounded overflow-x-auto"><code>${safeCode}</code></pre>`;
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
  html = html.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');
  
  // Inline code (`code`)
  html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm">$1</code>');

  // Unordered lists (- item or * item)
  // Process line by line to create <li> elements
  html = html.replace(/^\s*[-*]\s+(.*)/gm, '<li class="ml-4 list-disc">$1</li>');
  // Wrap consecutive <li> elements in a <ul>
  html = html.replace(/((?:<li class="ml-4 list-disc">.*<\/li>\s*)+)/g, '<ul class="my-1">$1</ul>');

  // Ordered lists (1. item)
  // Process line by line to create <li> elements
  html = html.replace(/^\s*\d+\.\s+(.*)/gm, '<li class="ml-4 list-decimal">$1</li>');
  // Wrap consecutive <li> elements in an <ol>
  html = html.replace(/((?:<li class="ml-4 list-decimal">.*<\/li>\s*)+)/g, '<ol class="my-1">$1</ol>');

  // Paragraphs: Split by double newlines, then wrap remaining lines in <p> tags.
  // This preserves intentional line breaks inside paragraphs using <br>.
  html = html.split(/\n\s*\n/).map(paragraph => {
    const trimmed = paragraph.trim();
    if (!trimmed) return '';
    // Avoid wrapping elements that are already block-level HTML
    if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<ol') || trimmed.startsWith('<li') || trimmed.startsWith('<pre')) {
      return trimmed;
    }
    // Convert single newlines within paragraphs to <br> for line breaks
    return `<p class="my-1">${trimmed.replace(/\n/g, '<br>')}</p>`;
  }).join('');

  return html;
};


/**
 * @what A React component that displays the final output of a completed flowchart execution.
 * @why This component provides the end result to the user in a dedicated, clean, and readable format.
 * @how It receives the `finalOutput` string and an `isProcessing` flag. If the flow is running,
 * it shows a loading message. If there's no output yet, it shows a placeholder. When `finalOutput`
 * is available, it passes it to the `renderMarkdown` helper function and renders the resulting HTML
 * using `dangerouslySetInnerHTML`.
 * @param {FinalOutputPanelProps} props - The properties for the component.
 * @returns {React.ReactElement} A `div` element containing the final output view.
 */
const FinalOutputPanel: React.FC<FinalOutputPanelProps> = ({ finalOutput, isProcessing }) => {
  let content;

  if (isProcessing && !finalOutput) {
    content = <p className="text-gray-500 dark:text-gray-400 p-4 animate-pulse">Processing... generating final output.</p>;
  } else if (!finalOutput) {
    content = <p className="text-gray-500 dark:text-gray-400 p-4">No final output yet. Run a flow to see results.</p>;
  } else {
    // Convert the markdown output to HTML and render it.
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
