
import React from 'react';
import { ProcessLogEntry } from '../types';

interface LogPanelProps {
  logs: ProcessLogEntry[];
  selectedNodeId: string | null;
}

const LogPanel: React.FC<LogPanelProps> = ({ logs, selectedNodeId }) => {
  const getStatusColor = (status: ProcessLogEntry['status']) => {
    switch (status) {
      case 'success': return 'text-green-500 dark:text-green-400';
      case 'error': return 'text-red-500 dark:text-red-400';
      case 'processing': return 'text-yellow-500 dark:text-yellow-400';
      default: return 'text-gray-500 dark:text-gray-400';
    }
  };

  const displayedLogs = selectedNodeId
    ? logs.filter(log => log.nodeId === selectedNodeId || !log.nodeId) // Show general logs too if node selected
    : logs;

  const panelTitle = selectedNodeId 
    ? `Logs (Filtered for Node ${selectedNodeId.substring(0,8)}...)` 
    : "Global Processing Log";

  const noLogsMessage = selectedNodeId
    ? "No logs specific to this node. Global logs may still appear."
    : "No processing logs yet. Start a flow to see logs.";

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 shadow-lg rounded-lg h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200 border-b pb-2 border-gray-200 dark:border-gray-700">
        {panelTitle}
      </h3>
      <div className="flex-grow overflow-y-auto space-y-2 pr-2 text-sm">
        {displayedLogs.length === 0 && <p className="text-gray-500 dark:text-gray-400">{noLogsMessage}</p>}
        {displayedLogs.map((log, index) => (
          <div key={index} className={`font-mono text-xs overflow-x-auto ${getStatusColor(log.status)}`}>
            <div>
              <span className="font-semibold">{log.timestamp.toLocaleTimeString()}:</span>
              <span className="ml-1 whitespace-pre-wrap">{log.message}</span>
            </div>
            {log.groundingMetadata && log.groundingMetadata.length > 0 && (
              <div className="mt-1 pl-4">
                <strong className="text-sky-600 dark:text-sky-400 text-xs">Sources:</strong>
                <ul className="list-none pl-2 space-y-0.5">
                  {log.groundingMetadata.map((chunk, chunkIndex) => (
                    chunk.web && (
                      <li key={chunkIndex} className="truncate">
                        <a 
                          href={chunk.web.uri} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          title={chunk.web.uri}
                          className="text-sky-500 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 underline text-xs"
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
        ))}
      </div>
      {/* Final output section removed from here */}
    </div>
  );
};

export default LogPanel;
