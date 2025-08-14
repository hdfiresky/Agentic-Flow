
import React from 'react';
import { ProcessLogEntry } from '../types';

interface LogPanelProps {
  logs: ProcessLogEntry[];
  selectedNodeId: string | null;
}

/**
 * @what A React component that displays a list of processing log entries.
 * @why It provides real-time feedback to the user as the AI flow is being executed,
 * making the process transparent and easier to debug.
 * @how It receives an array of `logs` and an optional `selectedNodeId`. If a node is selected,
 * it filters the logs to show only those relevant to that node (plus global logs). It maps over
 * the `displayedLogs` array to render each log entry, applying a specific color based on the
 * log's status (`success`, `error`, etc.). It also displays any web sources associated with a log entry.
 * @param {LogPanelProps} props - The properties for the component.
 * @returns {React.ReactElement} A `div` element that contains the log view.
 */
const LogPanel: React.FC<LogPanelProps> = ({ logs, selectedNodeId }) => {
  /**
   * @what Determines the text color for a log entry based on its status.
   * @why To visually distinguish between different types of log messages (e.g., making errors red).
   * @param {ProcessLogEntry['status']} status - The status of the log entry.
   * @returns {string} A Tailwind CSS class for the text color.
   */
  const getStatusColor = (status: ProcessLogEntry['status']) => {
    switch (status) {
      case 'success': return 'text-green-500 dark:text-green-400';
      case 'error': return 'text-red-500 dark:text-red-400';
      case 'processing': return 'text-yellow-500 dark:text-yellow-400';
      default: return 'text-gray-500 dark:text-gray-400';
    }
  };

  // Filter logs to show only those for the selected node, or all logs if no node is selected.
  // General logs (without a `nodeId`) are always shown.
  const displayedLogs = selectedNodeId
    ? logs.filter(log => log.nodeId === selectedNodeId || !log.nodeId)
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
            {/* Display grounding sources if they exist for this log entry */}
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
    </div>
  );
};

export default LogPanel;