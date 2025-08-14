import React, { useState, useEffect } from 'react';
import { AgentNode, NodeType, AgentEdge } from '../types'; // Added AgentEdge

interface AgentEditPanelProps {
  node: AgentNode | null;
  allNodes: AgentNode[]; // New: all nodes for context
  edges: AgentEdge[]; // New: all edges for context
  onUpdateDescription: (nodeId: string, description: string) => void;
  onStartConnection: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  isConnectingFromThisNode: boolean;
  onDeleteEdgeFromSource: (sourceNodeId: string) => void;
  onDeleteEdgeToTarget: (targetNodeId: string) => void;
  onToggleInternetSearch?: (nodeId: string, enabled: boolean) => void;
  onUpdateEdgeKeyword: (edgeId: string, keyword: string) => void; // New prop
}

const AgentEditPanel: React.FC<AgentEditPanelProps> = ({ 
  node, 
  allNodes,
  edges,
  onUpdateDescription, 
  onStartConnection, 
  onDeleteNode,
  isConnectingFromThisNode,
  onDeleteEdgeFromSource,
  onDeleteEdgeToTarget,
  onToggleInternetSearch,
  onUpdateEdgeKeyword
}) => {
  const [description, setDescription] = useState('');
  const [enableInternetSearch, setEnableInternetSearch] = useState(false);

  useEffect(() => {
    if (node) {
      setDescription(node.description);
      setEnableInternetSearch(node.enableInternetSearch || false);
    }
  }, [node]);

  if (!node) {
    return (
      <div className="p-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg h-full">
        <p className="text-gray-500 dark:text-gray-400">Select a node to see its details.</p>
      </div>
    );
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };

  const handleDescriptionBlur = () => {
    if (node) {
      onUpdateDescription(node.id, description);
    }
  };

  const handleInternetSearchToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (node && onToggleInternetSearch) {
      const checked = e.target.checked;
      setEnableInternetSearch(checked);
      onToggleInternetSearch(node.id, checked);
    }
  };
  
  const canConnectFrom = node.type !== NodeType.END;
  const canDelete = node.type !== NodeType.START && node.type !== NodeType.END;
  const displayNodeType = node.type.toString().replace(/_/g, ' ');

  const outgoingEdgesFromThisNode = edges.filter(edge => edge.sourceId === node.id);

  return (
    <div className="p-6 bg-white dark:bg-gray-800 shadow-xl rounded-lg flex flex-col space-y-4">
      <h3 className="text-xl font-semibold text-indigo-700 dark:text-indigo-400 border-b pb-2 border-gray-200 dark:border-gray-700">Edit Node: <span className="font-mono text-sm">{node.id.substring(0,8)}...</span></h3>
      
      <div>
        <label htmlFor="nodeType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
        <input
          type="text"
          id="nodeType"
          value={displayNodeType}
          readOnly
          className="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm cursor-not-allowed"
        />
      </div>

      {(node.type === NodeType.AGENT || node.type === NodeType.CONDITIONAL_AGENT) && (
        <>
          <div>
            <label htmlFor="nodeDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {node.type === NodeType.CONDITIONAL_AGENT ? "Conditional Agent Logic / Role" : "Agent Description / Role"}
            </label>
            <textarea
              id="nodeDescription"
              rows={3}
              value={description}
              onChange={handleDescriptionChange}
              onBlur={handleDescriptionBlur}
              placeholder={
                node.type === NodeType.CONDITIONAL_AGENT 
                ? "e.g., If input requires analysis, output 'ANALYZE_PATH'. If summarization, output 'SUMMARIZE_PATH'."
                : "e.g., Summarize the input text."
              }
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          {onToggleInternetSearch && (
            <div className="flex items-center mt-2">
              <input
                id="enableInternetSearch"
                name="enableInternetSearch"
                type="checkbox"
                checked={enableInternetSearch}
                onChange={handleInternetSearchToggle}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
              />
              <label htmlFor="enableInternetSearch" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                Enable Internet Search
              </label>
            </div>
          )}
        </>
      )}

      {node.type === NodeType.CONDITIONAL_AGENT && outgoingEdgesFromThisNode.length > 0 && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1 mb-1">Conditional Paths & Keywords:</h4>
          {outgoingEdgesFromThisNode.map(edge => {
            const targetNode = allNodes.find(n => n.id === edge.targetId);
            const targetNodeDisplay = targetNode 
              ? `${targetNode.type.toString().replace(/_/g, ' ')} (${targetNode.description.substring(0,15)}...)` 
              : 'Unknown Node';
            return (
              <div key={edge.id} className="mb-2 p-2 border rounded-md dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                <label htmlFor={`keyword-${edge.id}`} className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                  Path to: <span className="font-semibold">{targetNodeDisplay}</span>
                </label>
                <input
                  type="text"
                  id={`keyword-${edge.id}`}
                  value={edge.conditionKeyword || ''}
                  onChange={(e) => onUpdateEdgeKeyword(edge.id, e.target.value)}
                  placeholder="Keyword from agent output"
                  className="mt-1 block w-full px-2 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-xs"
                />
              </div>
            );
          })}
        </div>
      )}

       {node.type === NodeType.START && (
         <p className="text-sm text-gray-600 dark:text-gray-400">The START node initiates the flow with the user's question.</p>
       )}
       {node.type === NodeType.END && (
         <p className="text-sm text-gray-600 dark:text-gray-400">The END node displays the final output of the flow.</p>
       )}

      <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        {canConnectFrom && (
          <button
            onClick={() => onStartConnection(node.id)}
            disabled={isConnectingFromThisNode}
            className={`w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
              isConnectingFromThisNode 
                ? 'bg-yellow-500 hover:bg-yellow-600 cursor-default' 
                : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
            }`}
          >
            {isConnectingFromThisNode ? 'Select Target Node...' : 'Connect From This Node'}
          </button>
        )}
      </div>
      
      <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Manage Connections:</h4>
        <button
          onClick={() => onDeleteEdgeFromSource(node.id)}
          className="w-full text-left px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800 rounded-md"
        >
          Delete Outgoing Edge(s)
        </button>
        <button
          onClick={() => onDeleteEdgeToTarget(node.id)}
          className="w-full text-left px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800 rounded-md"
        >
          Delete Incoming Edge(s)
        </button>
      </div>

      {canDelete && (
        <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => onDeleteNode(node.id)}
            className="w-full flex items-center justify-center px-4 py-2 border border-red-500 text-sm font-medium rounded-md shadow-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400"
          >
            Delete This {node.type === NodeType.CONDITIONAL_AGENT ? "Conditional Agent" : "Agent"}
          </button>
        </div>
      )}
    </div>
  );
};

export default AgentEditPanel;