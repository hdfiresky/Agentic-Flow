
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AgentNode, AgentEdge, NodeType, ProcessLogEntry, GroundingChunk } from './types';
import { NODE_WIDTH, NODE_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';
import { processAgentTask } from './services/geminiService';
import AgentNodeComponent from './components/AgentNodeComponent';
import AgentEditPanel from './components/AgentEditPanel';
import Toolbar from './components/Toolbar';
import LogPanel from './components/LogPanel';
import FinalOutputPanel from './components/FinalOutputPanel';

/**
 * @what The main application component for the AI Agent Flowchart.
 * @why This component orchestrates the entire application. It manages the state for all nodes,
 * edges, user interactions, and the processing of the AI flow. It serves as the single source
 * of truth for the application's state.
 * @how It uses React hooks (`useState`, `useEffect`, `useCallback`, `useRef`) to manage state and
 * side effects. It contains all the handler functions for user actions (adding/deleting nodes,
 * creating connections, dragging nodes, etc.) and the core logic for executing the flowchart (`handleProcessFlow`).
 * It passes state and callbacks down to child components (Toolbar, Canvas, Edit Panel, etc.).
 */
const App: React.FC = () => {
  // State for the flowchart graph
  const [nodes, setNodes] = useState<AgentNode[]>([]);
  const [edges, setEdges] = useState<AgentEdge[]>([]);
  
  // State for user interaction and UI
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [connectingFromNodeId, setConnectingFromNodeId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const flowchartCanvasRef = useRef<HTMLDivElement>(null);

  // State for flow processing
  const [initialQuestion, setInitialQuestion] = useState<string>('');
  const [processingLog, setProcessingLog] = useState<ProcessLogEntry[]>([]);
  const [finalOutput, setFinalOutput] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [currentProcessingNodeId, setCurrentProcessingNodeId] = useState<string | null>(null);
  const [nodeErrors, setNodeErrors] = useState<Record<string, boolean>>({});

  /**
   * @what Resets the application to its initial state.
   * @why Used to start with a fresh canvas, both on initial load and when the user clicks "Clear Flow".
   * @how It creates a default `START` and `END` node and resets all state variables to their default values.
   */
  const initializeFlow = useCallback(() => {
    const startNodeId = crypto.randomUUID();
    const endNodeId = crypto.randomUUID();
    setNodes([
      { id: startNodeId, type: NodeType.START, description: 'Workflow Start', x: 50, y: CANVAS_HEIGHT / 2 - NODE_HEIGHT / 2, output: '', lastProcessedInput: '', groundingMetadata: [] },
      { id: endNodeId, type: NodeType.END, description: 'Workflow End', x: CANVAS_WIDTH - NODE_WIDTH - 50, y: CANVAS_HEIGHT / 2 - NODE_HEIGHT / 2, output: '', lastProcessedInput: '', groundingMetadata: [] },
    ]);
    setEdges([]);
    setSelectedNodeId(null);
    setConnectingFromNodeId(null);
    setInitialQuestion('');
    setProcessingLog([]);
    setFinalOutput(null);
    setIsProcessing(false);
    setProcessingError(null);
    setCurrentProcessingNodeId(null);
    setNodeErrors({});
  }, []);

  // Initialize the flow when the component mounts.
  useEffect(() => {
    initializeFlow();
    // The empty dependency array ensures this runs only once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * @what Adds a new entry to the processing log.
   * @why To provide real-time feedback to the user during flow execution.
   * @how It appends a new log object to the `processingLog` state array. `useCallback` is used for performance optimization.
   * @param {string} message - The log message content.
   * @param {ProcessLogEntry['status']} [status='info'] - The status of the log (info, success, error, processing).
   * @param {string} [nodeId] - The ID of the node associated with the log entry.
   * @param {GroundingChunk[]} [groundingMetadata] - Any web sources related to this log entry.
   */
  const addLog = useCallback((message: string, status: ProcessLogEntry['status'] = 'info', nodeId?: string, groundingMetadata?: GroundingChunk[]) => {
    setProcessingLog(prev => [...prev, { timestamp: new Date(), message, status, nodeId, groundingMetadata }]);
  }, []);

  /**
   * @what Adds a new node to the canvas.
   * @why This is the handler for the "Add Agent" and "Add Conditional Agent" buttons in the Toolbar.
   * @how It calculates an intelligent position for the new node to avoid overlapping with existing nodes.
   * It then creates a new node object with a unique ID and default properties and adds it to the `nodes` state.
   * @param {NodeType} type - The type of node to add.
   */
  const handleAddNode = (type: NodeType) => {
    // ... [intelligent placement logic] ...
    let newNodeX = Math.random() * (CANVAS_WIDTH - NODE_WIDTH - 100) + 50; 
    let newNodeY = Math.random() * (CANVAS_HEIGHT - NODE_HEIGHT - 100) + 50;

    // The rest of this function is complex placement logic to prevent node overlap.
    // It tries to place the new node relative to the selected node or the last added node.
    // If it overlaps, it tries multiple positions before giving up and placing it randomly.
    if (type === NodeType.AGENT || type === NodeType.CONDITIONAL_AGENT) {
      let baseNode: AgentNode | undefined = undefined;
      const horizontalOffset = NODE_WIDTH + 40; 
      const verticalOffsetIncrement = NODE_HEIGHT + 20;

      if (selectedNodeId) {
        baseNode = nodes.find(n => n.id === selectedNodeId);
      }
      
      if (!baseNode) {
        const relevantNodes = nodes.filter(n => n.type === type || n.type === NodeType.AGENT);
        if (relevantNodes.length > 0) {
          baseNode = relevantNodes[relevantNodes.length - 1];
        } else {
          baseNode = nodes.find(n => n.type === NodeType.START);
        }
      }

      if (baseNode) {
        newNodeX = baseNode.x + horizontalOffset;
        newNodeY = baseNode.y;
      } else {
        const startNode = nodes.find(n => n.type === NodeType.START);
        if (startNode) {
            newNodeX = startNode.x + horizontalOffset;
            newNodeY = startNode.y;
        }
      }
      
      const checkOverlap = (x: number, y: number, existingNodes: AgentNode[]): boolean => {
        for (const node of existingNodes) {
            if ( Math.abs(x - node.x) * 2 < (NODE_WIDTH * 2) && Math.abs(y - node.y) * 2 < (NODE_HEIGHT * 2) ) {
                return true; 
            }
        }
        return false; 
      };

      let attempts = 0;
      const MAX_ATTEMPTS = 50;
      while (checkOverlap(newNodeX, newNodeY, nodes) && attempts < MAX_ATTEMPTS) {
        attempts++;
        newNodeY += verticalOffsetIncrement;
        if (newNodeY + NODE_HEIGHT > CANVAS_HEIGHT) {
            newNodeY = verticalOffsetIncrement / 2; 
            newNodeX += horizontalOffset;
        }
      }
    }
    newNodeX = Math.max(0, Math.min(newNodeX, CANVAS_WIDTH - NODE_WIDTH));
    newNodeY = Math.max(0, Math.min(newNodeY, CANVAS_HEIGHT - NODE_HEIGHT));
    
    let defaultDescription = `New ${type.replace(/_/g, ' ')} ${nodes.filter(n => n.type === type).length + 1}`;
    
    const newNode: AgentNode = {
      id: crypto.randomUUID(), type, description: defaultDescription, x: newNodeX, y: newNodeY,
      output: '', lastProcessedInput: '',
      enableInternetSearch: (type === NodeType.AGENT || type === NodeType.CONDITIONAL_AGENT) ? false : undefined,
      groundingMetadata: [],
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
  };

  /**
   * @what Handles clicks on a node.
   * @why This function has two purposes: selecting a node, or completing a connection between two nodes.
   * @how If `connectingFromNodeId` is set, it means the user is in "connection mode". Clicking another
   * valid node creates a new edge between them. Otherwise, it simply sets the clicked node as the `selectedNodeId`.
   * @param {string} nodeId - The ID of the clicked node.
   * @param {React.MouseEvent} e - The mouse event.
   */
  const handleNodeClick = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (connectingFromNodeId && connectingFromNodeId !== nodeId) {
      const sourceNode = nodes.find(n => n.id === connectingFromNodeId);
      const targetNode = nodes.find(n => n.id === nodeId);

      if (sourceNode && targetNode && sourceNode.type !== NodeType.END && targetNode.type !== NodeType.START) {
        const existingEdgeFromSource = edges.find(edge => edge.sourceId === connectingFromNodeId);
        if ((sourceNode.type === NodeType.START || sourceNode.type === NodeType.AGENT) && existingEdgeFromSource) {
            addLog(`${sourceNode.type.replace(/_/g, ' ')} nodes can only have one outgoing connection. Delete existing one first.`, 'error');
        } else {
          const newEdge: AgentEdge = { id: crypto.randomUUID(), sourceId: connectingFromNodeId, targetId: nodeId, conditionKeyword: '' };
          setEdges(prev => [...prev, newEdge]);
          addLog(`Connected ${sourceNode.type.substring(0,10)}... to ${targetNode.type.substring(0,10)}...`, 'info');
        }
      } else {
        addLog('Invalid connection attempt.', 'error');
      }
      setConnectingFromNodeId(null);
    } else {
      setSelectedNodeId(nodeId);
    }
  };

  /**
   * @what Updates the description of a specific node.
   * @why This is the callback for the AgentEditPanel to save description changes.
   * @how It finds the node by its ID in the `nodes` array and updates its `description` property.
   * @param {string} nodeId - The ID of the node to update.
   * @param {string} description - The new description text.
   */
  const handleUpdateNodeDescription = (nodeId: string, description: string) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, description } : n));
  };
  
  /**
   * @what Toggles the internet search capability for an agent node.
   * @how Finds the node by ID and sets its `enableInternetSearch` property.
   */
  const handleToggleInternetSearch = (nodeId: string, enabled: boolean) => {
    setNodes(prev => prev.map(n => 
        n.id === nodeId && (n.type === NodeType.AGENT || n.type === NodeType.CONDITIONAL_AGENT) 
        ? { ...n, enableInternetSearch: enabled } 
        : n
    ));
  };
  
  /**
   * @what Updates the keyword for a conditional edge.
   * @how Finds the edge by ID and updates its `conditionKeyword` property.
   */
  const handleUpdateEdgeKeyword = (edgeId: string, keyword: string) => {
    setEdges(prev => prev.map(e => e.id === edgeId ? { ...e, conditionKeyword: keyword.trim() } : e));
  };

  /**
   * @what Deletes a node and its associated edges from the graph.
   * @how It filters the `nodes` and `edges` arrays to remove the specified node and any connections to or from it.
   */
  const handleDeleteNode = (nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setEdges(prev => prev.filter(e => e.sourceId !== nodeId && e.targetId !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };
  
  /** @what Deletes a single edge when clicked directly. */
  const handleDeleteEdge = (edgeId: string) => {
    setEdges(prev => prev.filter(e => e.id !== edgeId));
  };

  /** @what Deletes all outgoing edges from a specific node. */
  const handleDeleteEdgesFromSource = (sourceId: string) => {
    setEdges(prev => prev.filter(e => e.sourceId !== sourceId));
  };

  /** @what Deletes all incoming edges to a specific node. */
  const handleDeleteEdgesToTarget = (targetId: string) => {
    setEdges(prev => prev.filter(e => e.targetId !== targetId));
  };

  /**
   * @what Puts the application into "connection mode".
   * @why This is the handler for the "Connect From This Node" button in the Edit Panel.
   * @how It sets the `connectingFromNodeId`, which causes the UI to indicate that the user should now select a target node.
   */
  const handleStartConnection = (nodeId: string) => {
    setConnectingFromNodeId(nodeId);
    setSelectedNodeId(nodeId); 
  };
  
  /** @what Clears the entire flowchart after user confirmation. */
  const handleClearFlow = () => {
    if (window.confirm("Are you sure you want to clear the entire flow and reset? This cannot be undone.")) {
      initializeFlow();
    }
  };

  /**
   * @what Executes the entire AI agent flowchart.
   * @why This is the core logic of the application, turning the visual graph into an executable process.
   * @how It functions as a state machine. It starts at the `START` node and traverses the graph edge by edge.
   * At each `AGENT` or `CONDITIONAL_AGENT` node, it calls the `processAgentTask` service. For conditional
   * agents, it checks the output against the `conditionKeyword` of its outgoing edges to decide which path to take.
   * It logs each step, updates node statuses, and halts on errors, cycles, or dead ends.
   */
  const handleProcessFlow = async () => {
    if (!initialQuestion.trim()) {
      addLog('Initial question cannot be empty.', 'error'); return;
    }
    
    // Reset state for a new run
    setIsProcessing(true); setProcessingLog([]); setFinalOutput(null); setProcessingError(null);
    setCurrentProcessingNodeId(null); setNodeErrors({});
    setNodes(prevNodes => prevNodes.map(n => ({ ...n, output: undefined, lastProcessedInput: undefined, groundingMetadata: [] })));

    addLog(`Starting flow with question: "${initialQuestion}"`, 'info');

    let currentNode = nodes.find(n => n.type === NodeType.START);
    if (!currentNode) {
      addLog('START node not found.', 'error'); setIsProcessing(false); return;
    }
    
    let currentInput = initialQuestion;
    const visitedNodes = new Set<string>(); // For cycle detection

    // Main processing loop
    for (let i = 0; i < nodes.length + 10; i++) { // Safety break to prevent infinite loops
      if (visitedNodes.has(currentNode!.id)) {
         addLog(`Cycle detected at node ${currentNode!.id}. Halting.`, 'error', currentNode!.id);
         setNodeErrors(prev => ({...prev, [currentNode!.id]: true})); break;
      }
      visitedNodes.add(currentNode!.id);
      setCurrentProcessingNodeId(currentNode!.id);

      // End condition
      if (currentNode!.type === NodeType.END) {
        setFinalOutput(currentInput);
        setNodes(prev => prev.map(n => n.id === currentNode!.id ? { ...n, lastProcessedInput: currentInput, output: currentInput } : n));
        addLog(`Reached END node. Final output set.`, 'success', currentNode!.id);
        break;
      }

      let nextEdgeToFollow: AgentEdge | undefined = undefined;

      // Process Agent nodes
      if (currentNode.type === NodeType.AGENT || currentNode.type === NodeType.CONDITIONAL_AGENT) {
        setNodes(prev => prev.map(n => n.id === currentNode!.id ? { ...n, lastProcessedInput: currentInput } : n));
        try {
          const agentResult = await processAgentTask(currentNode.description, currentInput, currentNode.enableInternetSearch);
          currentInput = agentResult.text; // Output of this node is input for the next
          setNodes(prev => prev.map(n => n.id === currentNode!.id ? { ...n, output: currentInput, groundingMetadata: agentResult.groundingMetadata || [] } : n));
          addLog(`${currentNode.type}: "${agentResult.text.substring(0, 50)}..."`, 'success', currentNode.id, agentResult.groundingMetadata);

          // Find the next edge based on conditions or just the single outgoing edge
          if (currentNode.type === NodeType.CONDITIONAL_AGENT) {
            const outgoingEdges = edges.filter(e => e.sourceId === currentNode!.id);
            nextEdgeToFollow = outgoingEdges.find(edge => edge.conditionKeyword && currentInput.toLowerCase().includes(edge.conditionKeyword.toLowerCase()));
            if (!nextEdgeToFollow) {
              addLog(`Conditional output did not match any path keywords. Halting.`, 'error', currentNode.id);
              setNodeErrors(prev => ({...prev, [currentNode!.id]: true})); break;
            }
          } else {
            nextEdgeToFollow = edges.find(e => e.sourceId === currentNode!.id);
          }
        } catch (err: any) {
          addLog(`Error processing agent '${currentNode.description}': ${err.message}`, 'error', currentNode.id);
          setNodeErrors(prev => ({...prev, [currentNode!.id]: true})); break; 
        }
      } else if (currentNode.type === NodeType.START) {
        nextEdgeToFollow = edges.find(e => e.sourceId === currentNode!.id);
      }
      
      // Navigate to the next node
      if (!nextEdgeToFollow) {
        addLog(`Node '${currentNode!.description}' has no outgoing connection. Flow halted.`, 'error', currentNode!.id);
        setNodeErrors(prev => ({...prev, [currentNode!.id]: true}));
        break; 
      }
      const nextNode = nodes.find(n => n.id === nextEdgeToFollow!.targetId);
      if (!nextNode) {
        addLog(`Target node not found. Flow corrupted.`, 'error', currentNode.id);
        setNodeErrors(prev => ({...prev, [currentNode!.id]: true})); break;
      }
      currentNode = nextNode;
    }
    
    setIsProcessing(false);
    setCurrentProcessingNodeId(null); 
  };

  /**
   * @what Handles the mouse down event on a node to initiate dragging.
   * @how It sets the `draggingNodeId` and calculates the `dragOffset` (the cursor's position
   * relative to the top-left corner of the node) to ensure smooth dragging.
   */
  const handleNodeMouseDown = (nodeId: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId); if (!node) return;
    setDraggingNodeId(nodeId);
    const canvasRect = flowchartCanvasRef.current?.getBoundingClientRect();
    if (canvasRect) {
      setDragOffset({ x: e.clientX - (node.x + canvasRect.left - (flowchartCanvasRef.current?.scrollLeft || 0)), y: e.clientY - (node.y + canvasRect.top - (flowchartCanvasRef.current?.scrollTop || 0)) });
    }
    setSelectedNodeId(nodeId); 
  };
  
  /** @what Handles a click on the canvas background.
   *  @how It deselects any selected node and cancels any pending connection actions. */
  const handleCanvasClick = () => {
    if(!draggingNodeId) { setSelectedNodeId(null); setConnectingFromNodeId(null); }
  };

  // Memoize the selected node details to prevent re-finding it on every render.
  const selectedNodeDetails = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;
  
  /**
   * @what A React hook to handle the global mouse move event for dragging nodes.
   * @why The mouse move event needs to be on the `window` so that dragging continues
   * even if the cursor moves outside the canvas area.
   * @how It adds event listeners for `mousemove` and `mouseup` to the window when `draggingNodeId` is set.
   * On mouse move, it calculates the new (x, y) coordinates for the dragging node based on the cursor position,
   * canvas position, and the initial drag offset. It updates the node's position in the state.
   * On mouse up, it clears the `draggingNodeId` to stop the drag operation.
   */
  useEffect(() => {
    if (!draggingNodeId) return;
    const handleGlobalMouseMove = (e: MouseEvent) => {
        if (!draggingNodeId || !flowchartCanvasRef.current) return;
        const canvasRect = flowchartCanvasRef.current.getBoundingClientRect();
        let newX = e.clientX - canvasRect.left - dragOffset.x + flowchartCanvasRef.current.scrollLeft;
        let newY = e.clientY - canvasRect.top - dragOffset.y + flowchartCanvasRef.current.scrollTop;
        newX = Math.max(0, Math.min(newX, CANVAS_WIDTH - NODE_WIDTH));
        newY = Math.max(0, Math.min(newY, CANVAS_HEIGHT - NODE_HEIGHT));
        setNodes(prev => prev.map(n => n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n ));
    };
    const handleGlobalMouseUp = () => { setDraggingNodeId(null); };
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [draggingNodeId, dragOffset]);

  return (
    <div className="flex flex-col h-screen antialiased text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-900">
      <Toolbar
        onAddNode={handleAddNode}
        initialQuestion={initialQuestion}
        onInitialQuestionChange={setInitialQuestion}
        onProcessFlow={handleProcessFlow}
        isProcessing={isProcessing}
        onClearFlow={handleClearFlow}
      />
      {processingError && <div role="alert" className="p-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 text-center text-sm">{processingError}</div>}
      
      <div className="flex-grow flex overflow-hidden">
        {/* The main canvas area for the flowchart */}
        <div 
          ref={flowchartCanvasRef}
          className="flex-grow flowchart-canvas overflow-auto bg-gray-200 dark:bg-gray-800 relative cursor-grab active:cursor-grabbing"
          onClick={handleCanvasClick} 
        >
          <div className="relative" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }} >
            {/* SVG layer for drawing edges (connections) between nodes */}
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
              {edges.map(edge => {
                const sourceNode = nodes.find(n => n.id === edge.sourceId);
                const targetNode = nodes.find(n => n.id === edge.targetId);
                if (!sourceNode || !targetNode) return null;
                
                // Calculate path for a smooth bezier curve
                const x1 = sourceNode.x + NODE_WIDTH / 2;
                const y1 = sourceNode.y + NODE_HEIGHT / 2;
                const x2 = targetNode.x; // Arrow points to the middle of the left edge
                const y2 = targetNode.y + NODE_HEIGHT / 2;
                const pathData = `M${x1},${y1} C${x1 + 50},${y1} ${x2 - 50},${y2} ${x2},${y2}`;
                
                const isSelectedEdge = (selectedNodeId === sourceNode.id || selectedNodeId === targetNode.id);
                
                return (
                  <g key={edge.id}>
                    <path d={pathData} strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" className={`transition-all duration-150 stroke-gray-400 dark:stroke-gray-500 ${isSelectedEdge ? 'stroke-indigo-600 dark:stroke-indigo-400' : ''}`} />
                    {/* Display condition keyword on the edge */}
                    {sourceNode.type === NodeType.CONDITIONAL_AGENT && edge.conditionKeyword && (
                      <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 6} className={`text-[10px] font-mono pointer-events-none fill-gray-700 dark:fill-gray-300 ${isSelectedEdge ? 'fill-indigo-700 dark:fill-indigo-300 font-semibold' : ''}`} textAnchor="middle">
                        {edge.conditionKeyword}
                      </text>
                    )}
                    {/* Transparent, wider path for easier clicking to delete */}
                    <path d={pathData} stroke="transparent" strokeWidth="20" fill="none" className="cursor-pointer pointer-events-auto" onClick={(e) => { e.stopPropagation(); if (window.confirm('Delete this connection?')) handleDeleteEdge(edge.id); }} />
                    <defs>
                      <marker id="arrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" className={`fill-current ${isSelectedEdge ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}`} />
                      </marker>
                    </defs>
                  </g>
                );
              })}
            </svg>

            {/* Render all the nodes */}
            {nodes.map(node => (
              <AgentNodeComponent
                key={node.id} node={node}
                isSelected={selectedNodeId === node.id}
                isConnectingFrom={connectingFromNodeId === node.id}
                onNodeClick={handleNodeClick} onNodeMouseDown={handleNodeMouseDown}
                isProcessingNode={currentProcessingNodeId === node.id && isProcessing}
                hasError={!!nodeErrors[node.id]}
              />
            ))}
          </div>
        </div>

        {/* The right-side panel for editing, logs, and final output */}
        <div className="w-96 min-w-[350px] max-w-[450px] flex-shrink-0 border-l border-gray-300 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-800 overflow-y-auto">
          <div className="flex-shrink-0 basis-1/3 min-h-[250px] border-b border-gray-300 dark:border-gray-700 overflow-y-auto">
            <AgentEditPanel
              node={selectedNodeDetails}
              allNodes={nodes}
              edges={edges}
              onUpdateDescription={handleUpdateNodeDescription}
              onStartConnection={handleStartConnection}
              onDeleteNode={handleDeleteNode}
              isConnectingFromThisNode={connectingFromNodeId === selectedNodeId && !!selectedNodeId}
              onDeleteEdgeFromSource={handleDeleteEdgesFromSource}
              onDeleteEdgeToTarget={handleDeleteEdgesToTarget}
              onToggleInternetSearch={handleToggleInternetSearch}
              onUpdateEdgeKeyword={handleUpdateEdgeKeyword}
            />
          </div>
          <div className="flex-grow basis-0 min-h-[180px] border-b border-gray-300 dark:border-gray-700 overflow-y-auto">
            <LogPanel logs={processingLog} selectedNodeId={selectedNodeId} />
          </div>
           <div className="flex-grow-[2] basis-0 min-h-[300px] overflow-y-auto">
            <FinalOutputPanel finalOutput={finalOutput} isProcessing={isProcessing} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;