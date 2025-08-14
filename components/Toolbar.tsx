import React from 'react';
import { NodeType } from '../types';

interface ToolbarProps {
  onAddNode: (type: NodeType) => void;
  initialQuestion: string;
  onInitialQuestionChange: (question: string) => void;
  onProcessFlow: () => void;
  isProcessing: boolean;
  onClearFlow: () => void;
}

/**
 * @what A React component that serves as the main toolbar for the application.
 * @why It provides the primary user controls for interacting with the flowchart, such as
 * adding new nodes, inputting the initial question, and starting or resetting the entire flow.
 * @how It's a functional component that receives callbacks and state from the parent `App` component.
 * It renders buttons that trigger these callbacks (`onAddNode`, `onProcessFlow`, `onClearFlow`) and
 * a controlled input field for the initial question. Button states (e.g., disabled) are managed
 * based on props like `isProcessing` and `initialQuestion`.
 * @param {ToolbarProps} props - The properties for the component.
 * @returns {React.ReactElement} A `div` element representing the toolbar.
 */
const Toolbar: React.FC<ToolbarProps> = ({ 
  onAddNode, 
  initialQuestion, 
  onInitialQuestionChange, 
  onProcessFlow, 
  isProcessing,
  onClearFlow
}) => {
  return (
    <div className="p-4 bg-white dark:bg-gray-800 shadow-md flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-2 md:space-x-4">
      {/* Button to add a standard Agent node */}
      <button
        onClick={() => onAddNode(NodeType.AGENT)}
        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 w-full sm:w-auto text-sm sm:text-base"
      >
        Add Agent
      </button>
      {/* Button to add a Conditional Agent node */}
      <button
        onClick={() => onAddNode(NodeType.CONDITIONAL_AGENT)}
        className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400 transition duration-150 w-full sm:w-auto text-sm sm:text-base"
      >
        Add Conditional Agent
      </button>
      
      {/* Input field for the initial question that starts the flow */}
      <div className="flex-grow w-full sm:w-auto">
        <input
          type="text"
          placeholder="Enter initial question for the flow..."
          value={initialQuestion}
          onChange={(e) => onInitialQuestionChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
      </div>
      
      {/* Button to start processing the entire flow */}
      <button
        onClick={onProcessFlow}
        disabled={isProcessing || !initialQuestion}
        className={`px-4 py-2 font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-150 w-full sm:w-auto ${
          isProcessing 
            ? 'bg-yellow-500 text-white cursor-not-allowed' 
            : !initialQuestion
            ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500'
        }`}
      >
        {isProcessing ? 'Processing...' : 'Start Flow'}
      </button>

      {/* Button to clear the entire canvas and reset the application state */}
       <button
        onClick={onClearFlow}
        disabled={isProcessing}
        className={`px-4 py-2 font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-150 w-full sm:w-auto ${
          isProcessing 
            ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
            : 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-400'
        }`}
      >
        Clear Flow & Reset
      </button>
    </div>
  );
};

export default Toolbar;