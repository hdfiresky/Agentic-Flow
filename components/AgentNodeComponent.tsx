import React from 'react';
import { AgentNode, NodeType, GroundingChunk } from '../types';
import { NODE_WIDTH, NODE_HEIGHT } from '../constants';

interface AgentNodeProps {
  node: AgentNode;
  isSelected: boolean;
  isConnectingFrom: boolean;
  onNodeClick: (nodeId: string, e: React.MouseEvent) => void;
  onNodeMouseDown: (nodeId: string, e: React.MouseEvent) => void;
  isProcessingNode: boolean;
  hasError?: boolean;
}

/**
 * @what Renders a specific icon based on the node's type.
 * @why Provides a quick visual cue to differentiate between Start, End, Agent, and Conditional nodes.
 * @how It uses a switch statement on the `type` prop to return the corresponding SVG icon component.
 * @param {{ type: NodeType }} props - The properties for the component, containing the node type.
 * @returns {React.ReactElement | null} An SVG icon.
 */
const NodeIcon: React.FC<{ type: NodeType }> = ({ type }) => {
  switch (type) {
    case NodeType.START:
      return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2 text-green-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
      </svg>;
    case NodeType.AGENT:
      return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2 text-blue-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-7.5h12c.621 0 1.125-.504 1.125-1.125V11.25c0-.621-.504-1.125-1.125-1.125h-12c-.621 0-1.125.504-1.125 1.125V12.75c0 .621.504 1.125 1.125 1.125Z" />
      </svg>;
    case NodeType.CONDITIONAL_AGENT:
      return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2 text-orange-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h1.5m15 0H21m-6.75 0V3m0 1.5V3m0 1.5v1.5m0-1.5V3m0 3.75H7.5A2.25 2.25 0 0 0 5.25 9.75v4.5A2.25 2.25 0 0 0 7.5 16.5h3.75m0-12V3m0 3.75V3m0 3.75H12m6.75 0H21m-3-3V3m0 1.5V3m0 1.5v1.5m0-1.5V3m-3.75 3.75H16.5A2.25 2.25 0 0 1 18.75 9.75v4.5A2.25 2.25 0 0 1 16.5 16.5h-3.75m0-12v1.5m3.75-1.5V3m-3.75 16.5V21m-3.75-1.5v1.5m0-1.5v-1.5m0 1.5V21m0-3.75H12m0 0H7.5m1.5-12V3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V21m0-15V3m4.5 13.5h.008v.008H16.5V16.5zm-9 0h.008v.008H7.5V16.5zm4.5 0v.008H12V16.5zm0-3v.008H12V13.5zm0-3v.008H12V10.5zm0-3v.008H12V7.5z" />
      </svg>;
    case NodeType.END:
      return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2 text-red-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9.563C9 9.252 9.252 9 9.563 9h4.874c.311 0 .563.252.563.563v4.874c0 .311-.252.563-.563.563H9.564A.562.562 0 0 1 9 14.437V9.564Z" />
      </svg>;
    default:
      return null;
  }
};

/**
 * @what Renders an icon indicating that internet search is enabled for an agent.
 * @why To provide a clear visual indicator on the node itself.
 * @returns {React.ReactElement} An SVG icon.
 */
const InternetSearchIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-sky-500 dark:text-sky-400 ml-auto" aria-labelledby="internetSearchIconTitle">
    <title id="internetSearchIconTitle">Internet Search Enabled</title>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A11.978 11.978 0 0 1 12 13.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 0 3 12c0 .778.099 1.533.284 2.253m0 0A11.978 11.978 0 0 0 12 13.5c-2.998 0-5.74-1.1-7.843-2.918" />
  </svg>
);


/**
 * @what A React component that visually represents a single agent node on the canvas.
 * @why This component is the primary building block of the flowchart, displaying all relevant
 * information for a node and handling user interactions like clicking and dragging.
 * @how It receives a `node` object and various state flags (`isSelected`, `isProcessingNode`, etc.) as props.
 * It dynamically computes CSS classes to reflect the node's current state (e.g., adding a colored ring for selection or errors).
 * It displays the node's type, icon, description, and, if available, its most recent input, output, and any web sources.
 * @param {AgentNodeProps} props - The properties for the component.
 * @returns {React.ReactElement} A `div` element representing the node.
 */
const AgentNodeComponent: React.FC<AgentNodeProps> = ({ node, isSelected, isConnectingFrom, onNodeClick, onNodeMouseDown, isProcessingNode, hasError }) => {
  // Base classes for all nodes
  const baseClasses = "absolute cursor-pointer shadow-lg rounded-lg transition-all duration-150 ease-in-out flex flex-col items-start justify-between overflow-hidden";
  // Dynamic classes based on state
  const selectedClasses = isSelected ? "ring-2 ring-indigo-500 dark:ring-indigo-400 shadow-xl" : "ring-1 ring-gray-300 dark:ring-gray-600";
  const connectingFromClasses = isConnectingFrom ? "ring-2 ring-green-500 dark:ring-green-400" : "";
  const processingClasses = isProcessingNode ? "animate-pulse ring-2 ring-yellow-500 dark:ring-yellow-400" : "";
  const errorClasses = hasError ? "ring-2 ring-red-600 dark:ring-red-500 border-red-600 dark:border-red-500" : "";

  // Set background color based on node type
  let bgColor = "bg-white dark:bg-gray-800";
  if (node.type === NodeType.START) bgColor = "bg-green-50 dark:bg-green-900";
  else if (node.type === NodeType.END) bgColor = "bg-red-50 dark:bg-red-900";
  else if (node.type === NodeType.AGENT) bgColor = "bg-blue-50 dark:bg-blue-900";
  else if (node.type === NodeType.CONDITIONAL_AGENT) bgColor = "bg-orange-50 dark:bg-orange-900";
  
  // Format the node type for display (e.g., 'CONDITIONAL_AGENT' -> 'CONDITIONAL AGENT')
  const displayNodeType = node.type.toString().replace(/_/g, ' ');

  return (
    <div
      style={{ 
        left: node.x, 
        top: node.y, 
        width: NODE_WIDTH, 
        height: NODE_HEIGHT 
      }}
      className={`${baseClasses} ${bgColor} ${selectedClasses} ${connectingFromClasses} ${processingClasses} ${errorClasses}`}
      onClick={(e) => onNodeClick(node.id, e)}
      onMouseDown={(e) => onNodeMouseDown(node.id, e)}
      aria-label={`Node ${displayNodeType}: ${node.description}`}
      aria-selected={isSelected}
    >
      {/* Top section: Icon, Type, Description */}
      <div className="p-3 w-full">
        <div className="flex items-center mb-1">
          <NodeIcon type={node.type} />
          <h3 className="font-semibold text-sm truncate" title={displayNodeType}>{displayNodeType}</h3>
          {(node.type === NodeType.AGENT || node.type === NodeType.CONDITIONAL_AGENT) && node.enableInternetSearch && <InternetSearchIcon />}
        </div>
        <p className="text-xs text-gray-700 dark:text-gray-300 break-words line-clamp-2" title={node.description}>
          {node.description || "No description"}
        </p>
      </div>
       {/* Bottom section: Input/Output and Grounding Metadata */}
       {(node.output || node.lastProcessedInput || (node.groundingMetadata && node.groundingMetadata.length > 0)) && (
         <div className="mt-auto w-full bg-gray-50 dark:bg-gray-700 p-2 border-t border-gray-200 dark:border-gray-600 max-h-[70px] overflow-y-auto text-xs">
           {node.lastProcessedInput && (
             <p className="text-gray-500 dark:text-gray-400 whitespace-pre-wrap break-words" title={`Input: ${node.lastProcessedInput}`}>
               <strong>In:</strong> {node.lastProcessedInput}
             </p>
           )}
           {node.output && (
            <p className="text-green-600 dark:text-green-400 whitespace-pre-wrap break-words mt-1" title={`Output: ${node.output}`}>
              <strong>Out:</strong> {node.output}
            </p>
           )}
           {node.groundingMetadata && node.groundingMetadata.length > 0 && (
             <div className="mt-1">
               <strong className="text-sky-600 dark:text-sky-400">Sources:</strong>
               <ul className="list-none pl-0 space-y-0.5">
                 {node.groundingMetadata.map((chunk, index) => (
                   chunk.web && (
                    <li key={index} className="truncate">
                      <a 
                        href={chunk.web.uri} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        title={chunk.web.uri}
                        className="text-sky-500 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 underline"
                      >
                        {chunk.web.title || chunk.web.uri}
                      </a>
                    </li>
                   )
                 ))}
               </ul>
             </div>
           )}
         </div>
       )}
    </div>
  );
};

export default AgentNodeComponent;