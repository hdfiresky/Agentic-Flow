
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AgentNode, AgentEdge, NodeType, ProcessLogEntry, GroundingChunk } from './types';
import { NODE_WIDTH, NODE_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';
import { processAgentTask } from './services/geminiService';
import AgentNodeComponent from './components/AgentNodeComponent';
import AgentEditPanel from './components/AgentEditPanel';
import Toolbar from './components/Toolbar';
import LogPanel from './components/LogPanel';
import FinalOutputPanel from './components/FinalOutputPanel';

const App: React.FC = () => {
  const [nodes, setNodes] = useState<AgentNode[]>([]);
  const [edges, setEdges] = useState<AgentEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [connectingFromNodeId, setConnectingFromNodeId] = useState<string | null>(null);
  
  const [initialQuestion, setInitialQuestion] = useState<string>('');
  const [processingLog, setProcessingLog] = useState<ProcessLogEntry[]>([]);
  const [finalOutput, setFinalOutput] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingError, setProcessingError] = useState<string | null>(null);

  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number, y: number }>({ x: 0, y: 0 });

  const [currentProcessingNodeId, setCurrentProcessingNodeId] = useState<string | null>(null);
  const [nodeErrors, setNodeErrors] = useState<Record<string, boolean>>({});


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

  useEffect(() => {
    initializeFlow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addLog = useCallback((message: string, status: ProcessLogEntry['status'] = 'info', nodeId?: string, groundingMetadata?: GroundingChunk[]) => {
    setProcessingLog(prev => [...prev, { timestamp: new Date(), message, status, nodeId, groundingMetadata }]);
  }, []);

  const handleAddNode = (type: NodeType) => {
    let newNodeX = Math.random() * (CANVAS_WIDTH - NODE_WIDTH - 100) + 50; 
    let newNodeY = Math.random() * (CANVAS_HEIGHT - NODE_HEIGHT - 100) + 50;

    if (type === NodeType.AGENT || type === NodeType.CONDITIONAL_AGENT) {
      let baseNode: AgentNode | undefined = undefined;
      const horizontalOffset = NODE_WIDTH + 40; 
      const verticalOffsetIncrement = NODE_HEIGHT + 20;

      if (selectedNodeId) {
        baseNode = nodes.find(n => n.id === selectedNodeId);
      }
      
      if (!baseNode) {
        const relevantNodes = nodes.filter(n => n.type === type || n.type === NodeType.AGENT); // Prefer same type or any agent
        if (relevantNodes.length > 0) {
          baseNode = relevantNodes[relevantNodes.length - 1];
        } else {
          baseNode = nodes.find(n => n.type === NodeType.START);
        }
      }

      if (baseNode) {
        newNodeX = baseNode.x + horizontalOffset;
        newNodeY = baseNode.y;

        if (newNodeX + NODE_WIDTH > CANVAS_WIDTH) {
          newNodeX = baseNode.x;
          newNodeY = baseNode.y + verticalOffsetIncrement;
        }
      } else {
        const startNode = nodes.find(n => n.type === NodeType.START);
        if (startNode) {
            newNodeX = startNode.x + horizontalOffset;
            newNodeY = startNode.y;
        } else {
            newNodeX = (CANVAS_WIDTH / 2) - (NODE_WIDTH / 2);
            newNodeY = (CANVAS_HEIGHT / 2) - (NODE_HEIGHT / 2);
        }
      }
      
      newNodeX = Math.max(0, Math.min(newNodeX, CANVAS_WIDTH - NODE_WIDTH));
      newNodeY = Math.max(0, Math.min(newNodeY, CANVAS_HEIGHT - NODE_HEIGHT));
      
      const checkOverlap = (x: number, y: number, existingNodes: AgentNode[]): boolean => {
        const newNodeBoundingBox = { minX: x, minY: y, maxX: x + NODE_WIDTH, maxY: y + NODE_HEIGHT };
        const margin = 1; 
        for (const node of existingNodes) {
            const existingNodeBoundingBox = { minX: node.x, minY: node.y, maxX: node.x + NODE_WIDTH, maxY: node.y + NODE_HEIGHT };
            if ( newNodeBoundingBox.minX < existingNodeBoundingBox.maxX + margin && newNodeBoundingBox.maxX > existingNodeBoundingBox.minX - margin &&
                 newNodeBoundingBox.minY < existingNodeBoundingBox.maxY + margin && newNodeBoundingBox.maxY > existingNodeBoundingBox.minY - margin ) {
                return true; 
            }
        }
        return false; 
      };

      let attempts = 0;
      const MAX_ATTEMPTS = 50; 
      const currentNodesSnapshot = nodes; 
      let initialProposedX = newNodeX; 

      while (checkOverlap(newNodeX, newNodeY, currentNodesSnapshot) && attempts < MAX_ATTEMPTS) {
        attempts++;
        if (baseNode) {
            const columnAttempt = Math.floor(attempts / 10);
            const verticalAttemptInColumn = attempts % 10;
            newNodeX = baseNode.x + columnAttempt * horizontalOffset;
            newNodeY = baseNode.y + verticalAttemptInColumn * verticalOffsetIncrement;
            if (newNodeX + NODE_WIDTH > CANVAS_WIDTH) {
                 newNodeX = baseNode.x; 
                 newNodeY = baseNode.y + attempts * (NODE_HEIGHT/2 + 5) ; 
            }
        } else {
            newNodeY += verticalOffsetIncrement;
            if (newNodeY + NODE_HEIGHT > CANVAS_HEIGHT) {
                newNodeY = verticalOffsetIncrement / 2; 
                newNodeX = (initialProposedX + (Math.floor(attempts / 10)) * horizontalOffset) % (CANVAS_WIDTH - NODE_WIDTH);
                 if (newNodeX + NODE_WIDTH > CANVAS_WIDTH) { 
                    newNodeX = (attempts * 20) % (CANVAS_WIDTH - NODE_WIDTH); 
                }
            }
        }
         newNodeX = Math.max(0, Math.min(newNodeX, CANVAS_WIDTH - NODE_WIDTH));
         newNodeY = Math.max(0, Math.min(newNodeY, CANVAS_HEIGHT - NODE_HEIGHT));
      }

      if (attempts >= MAX_ATTEMPTS && checkOverlap(newNodeX, newNodeY, currentNodesSnapshot)) {
        addLog("Canvas is very crowded. Node automatically placed; consider reorganizing manually if it overlaps.", "info");
        newNodeX = (initialProposedX + Math.random() * 100) % (CANVAS_WIDTH - NODE_WIDTH);
        newNodeY = (newNodeY + Math.random() * 50) % (CANVAS_HEIGHT - NODE_HEIGHT);
        newNodeX = Math.max(0, Math.min(newNodeX, CANVAS_WIDTH - NODE_WIDTH));
        newNodeY = Math.max(0, Math.min(newNodeY, CANVAS_HEIGHT - NODE_HEIGHT));
      }
    }
    newNodeX = Math.max(0, Math.min(newNodeX, CANVAS_WIDTH - NODE_WIDTH));
    newNodeY = Math.max(0, Math.min(newNodeY, CANVAS_HEIGHT - NODE_HEIGHT));
    
    let defaultDescription = '';
    if (type === NodeType.AGENT) defaultDescription = `New Agent ${nodes.filter(n => n.type === NodeType.AGENT).length + 1}`;
    else if (type === NodeType.CONDITIONAL_AGENT) defaultDescription = `New Conditional Agent ${nodes.filter(n => n.type === NodeType.CONDITIONAL_AGENT).length + 1}`;
    else if (type === NodeType.START) defaultDescription = 'Start';
    else defaultDescription = 'End';

    const newNode: AgentNode = {
      id: crypto.randomUUID(), type, description: defaultDescription, x: newNodeX, y: newNodeY,
      output: '', lastProcessedInput: '',
      enableInternetSearch: (type === NodeType.AGENT || type === NodeType.CONDITIONAL_AGENT) ? false : undefined,
      groundingMetadata: [],
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
  };

  const handleNodeClick = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (connectingFromNodeId && connectingFromNodeId !== nodeId) {
      const sourceNode = nodes.find(n => n.id === connectingFromNodeId);
      const targetNode = nodes.find(n => n.id === nodeId);

      if (sourceNode && targetNode && sourceNode.type !== NodeType.END && targetNode.type !== NodeType.START) {
        // START and regular AGENT nodes can only have one outgoing connection.
        // CONDITIONAL_AGENT can have multiple.
        const existingEdgeFromSource = edges.find(edge => edge.sourceId === connectingFromNodeId);
        if ((sourceNode.type === NodeType.START || sourceNode.type === NodeType.AGENT) && existingEdgeFromSource) {
            addLog(`${sourceNode.type.replace(/_/g, ' ')} nodes can only have one outgoing connection. Delete existing one first.`, 'error');
            setConnectingFromNodeId(null);
            return;
        }

        const newEdge: AgentEdge = { id: crypto.randomUUID(), sourceId: connectingFromNodeId, targetId: nodeId, conditionKeyword: '' };
        setEdges(prev => [...prev, newEdge]);
        addLog(`Connected ${sourceNode.type.replace(/_/g, ' ')} '${sourceNode.description.substring(0,10)}...' to ${targetNode.type.replace(/_/g, ' ')} '${targetNode.description.substring(0,10)}...'`, 'info');
      } else {
        addLog('Invalid connection attempt (e.g. from END, to START, or node not found).', 'error');
      }
      setConnectingFromNodeId(null);
    } else {
      setSelectedNodeId(nodeId);
    }
  };

  const handleUpdateNodeDescription = (nodeId: string, description: string) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, description } : n));
  };
  
  const handleToggleInternetSearch = (nodeId: string, enabled: boolean) => {
    setNodes(prev => prev.map(n => 
        n.id === nodeId && (n.type === NodeType.AGENT || n.type === NodeType.CONDITIONAL_AGENT) 
        ? { ...n, enableInternetSearch: enabled } 
        : n
    ));
  };
  
  const handleUpdateEdgeKeyword = (edgeId: string, keyword: string) => {
    setEdges(prev => prev.map(e => e.id === edgeId ? { ...e, conditionKeyword: keyword.trim() } : e));
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setEdges(prev => prev.filter(e => e.sourceId !== nodeId && e.targetId !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
    if (connectingFromNodeId === nodeId) setConnectingFromNodeId(null);
    addLog(`Node ${nodeId.substring(0,8)}... deleted.`, 'info');
  };
  
  const handleDeleteEdge = (edgeId: string) => {
    setEdges(prev => prev.filter(e => e.id !== edgeId));
    addLog(`Edge ${edgeId.substring(0,8)}... deleted.`, 'info');
  };

  const handleDeleteEdgesFromSource = (sourceId: string) => {
    setEdges(prev => prev.filter(e => e.sourceId !== sourceId));
    addLog(`Outgoing edges from ${sourceId.substring(0,8)}... deleted.`, 'info');
  };
  const handleDeleteEdgesToTarget = (targetId: string) => {
    setEdges(prev => prev.filter(e => e.targetId !== targetId));
     addLog(`Incoming edges to ${targetId.substring(0,8)}... deleted.`, 'info');
  };

  const handleStartConnection = (nodeId: string) => {
    setConnectingFromNodeId(nodeId);
    setSelectedNodeId(nodeId); 
    addLog(`Attempting to connect from ${nodes.find(n=>n.id === nodeId)?.description.substring(0,10)}.... Click target node.`, 'info');
  };
  
  const handleClearFlow = () => {
    if (window.confirm("Are you sure you want to clear the entire flow and reset? This cannot be undone.")) {
      initializeFlow();
    }
  };

  const handleProcessFlow = async () => {
    if (!initialQuestion.trim()) {
      addLog('Initial question cannot be empty.', 'error'); setProcessingError('Initial question cannot be empty.'); return;
    }
    
    setIsProcessing(true); setProcessingLog([]); setFinalOutput(null); setProcessingError(null);
    setCurrentProcessingNodeId(null); setNodeErrors({});
    setNodes(prevNodes => prevNodes.map(n => ({ ...n, output: undefined, lastProcessedInput: undefined, groundingMetadata: [] })));

    addLog(`Starting flow with question: "${initialQuestion}"`, 'info');

    let currentNode = nodes.find(n => n.type === NodeType.START);
    if (!currentNode) {
      addLog('START node not found.', 'error'); setProcessingError('START node not found.'); setIsProcessing(false); return;
    }
    
    setCurrentProcessingNodeId(currentNode.id);
    setNodes(prev => prev.map(n => n.id === currentNode!.id ? { ...n, lastProcessedInput: initialQuestion, output: initialQuestion } : n));
    addLog(`Node ${currentNode.type}: Output set to initial question.`, 'success', currentNode.id);

    let currentInput = initialQuestion;
    const visitedNodes = new Set<string>(); 

    for (let i = 0; i < nodes.length + 10; i++) { // Increased max iterations slightly for complex conditional paths
      if (visitedNodes.has(currentNode!.id) && currentNode!.type !== NodeType.END) {
         addLog(`Cycle detected or flow too long at node ${currentNode!.id}. Halting.`, 'error', currentNode!.id);
         setProcessingError(`Cycle detected at node ${currentNode!.id}.`); setNodeErrors(prev => ({...prev, [currentNode!.id]: true})); break;
      }
      visitedNodes.add(currentNode!.id);

      if (currentNode!.type === NodeType.END) {
        setFinalOutput(currentInput);
        setNodes(prev => prev.map(n => n.id === currentNode!.id ? { ...n, lastProcessedInput: currentInput, output: currentInput } : n));
        addLog(`Reached END node. Final output will be shown.`, 'success', currentNode!.id);
        setCurrentProcessingNodeId(currentNode!.id); break;
      }

      let nextEdgeToFollow: AgentEdge | undefined = undefined;

      if (currentNode.type === NodeType.AGENT || currentNode.type === NodeType.CONDITIONAL_AGENT) {
        setCurrentProcessingNodeId(currentNode.id);
        addLog(`Processing ${currentNode.type.replace(/_/g, ' ')} node '${currentNode.description}'...`, 'processing', currentNode.id);
        setNodes(prev => prev.map(n => n.id === currentNode!.id ? { ...n, lastProcessedInput: currentInput } : n));
        try {
          const agentResult = await processAgentTask(currentNode.description, currentInput, currentNode.enableInternetSearch);
          setNodes(prev => prev.map(n => n.id === currentNode!.id ? { ...n, output: agentResult.text, groundingMetadata: agentResult.groundingMetadata || [] } : n));
          addLog(`${currentNode.type.replace(/_/g, ' ')} '${currentNode.description}' output: "${agentResult.text.substring(0, 50)}..."`, 'success', currentNode.id, agentResult.groundingMetadata);
          currentInput = agentResult.text; // Output of this agent becomes input for next

          if (currentNode.type === NodeType.CONDITIONAL_AGENT) {
            const outgoingEdges = edges.filter(e => e.sourceId === currentNode!.id);
            if (outgoingEdges.length === 0) {
              addLog(`Conditional Agent '${currentNode.description}' has no outgoing paths. Flow halted.`, 'error', currentNode.id);
              setProcessingError(`Conditional Agent '${currentNode.description}' is a dead end.`); setNodeErrors(prev => ({...prev, [currentNode!.id]: true})); break;
            }
            for (const edge of outgoingEdges) {
              if (edge.conditionKeyword && agentResult.text.toLowerCase().includes(edge.conditionKeyword.toLowerCase())) {
                nextEdgeToFollow = edge;
                addLog(`Conditional Agent '${currentNode.description}' matched keyword "${edge.conditionKeyword}" for path to ${nodes.find(n=>n.id===edge.targetId)?.description.substring(0,15)}...`, 'info', currentNode.id);
                break;
              }
            }
            if (!nextEdgeToFollow) {
              addLog(`Conditional Agent '${currentNode.description}' output "${agentResult.text.substring(0,50)}..." did not match any path keywords. Flow halted.`, 'error', currentNode.id);
              setProcessingError(`Decision failed at Conditional Agent '${currentNode.description}'.`); setNodeErrors(prev => ({...prev, [currentNode!.id]: true})); break;
            }
          } else { // Regular AGENT node
            nextEdgeToFollow = edges.find(e => e.sourceId === currentNode!.id);
          }
        } catch (err: any) {
          const errorMessage = err.message || "Unknown error during agent processing.";
          addLog(`Error processing agent '${currentNode.description}': ${errorMessage}`, 'error', currentNode.id);
          setProcessingError(`Error at agent ${currentNode.description}: ${errorMessage}`); setNodeErrors(prev => ({...prev, [currentNode!.id]: true})); break; 
        }
      } else if (currentNode.type === NodeType.START) {
        nextEdgeToFollow = edges.find(e => e.sourceId === currentNode!.id);
      }
      
      if (!nextEdgeToFollow) {
        // At this point, currentNode cannot be an END node because that case is handled earlier and breaks the loop.
        // So, if there's no next edge, it's an error for START, AGENT, or CONDITIONAL_AGENT nodes.
        addLog(`Node ${currentNode!.type.replace(/_/g, ' ')} '${currentNode!.description}' has no valid outgoing connection. Flow halted.`, 'error', currentNode!.id);
        setProcessingError(`Node ${currentNode!.description} is a dead end or conditional path failed.`); 
        setNodeErrors(prev => ({...prev, [currentNode!.id]: true}));
        break; 
      }

      const nextNode = nodes.find(n => n.id === nextEdgeToFollow!.targetId);
      if (!nextNode) {
        addLog(`Target node for edge ${nextEdgeToFollow!.id} not found. Flow corrupted.`, 'error', currentNode.id);
        setProcessingError('Flow corrupted: target node missing.'); setNodeErrors(prev => ({...prev, [currentNode!.id]: true})); break;
      }
      
      // Before moving to nextNode, set its lastProcessedInput (which is currentInput from previous node/agent)
      // This is primarily for display on the node; actual processing uses currentInput directly.
      setNodes(prev => prev.map(n => n.id === nextNode!.id ? { ...n, lastProcessedInput: currentInput, groundingMetadata: [] } : n));
      
      // If nextNode is an AGENT or CONDITIONAL_AGENT, it will be processed at the start of the next iteration.
      // If nextNode is END, its output will be set at the start of the next iteration when it becomes `currentNode`.

      currentNode = nextNode;
    }
    
    if (currentNode && currentNode.type !== NodeType.END && !processingError) {
         addLog('Flow did not reach an END node.', 'error');
         if(!processingError) setProcessingError('Flow did not complete at an END node.');
    }

    setIsProcessing(false);
    if (!processingError) {
        setCurrentProcessingNodeId(null); 
    }
  };

  const handleNodeMouseDown = (nodeId: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId); if (!node) return;
    setDraggingNodeId(nodeId);
    const nodeRect = (e.target as HTMLElement).closest('.absolute')?.getBoundingClientRect();
    if(nodeRect) { setDragOffset({ x: e.clientX - nodeRect.left, y: e.clientY - nodeRect.top }); } 
    else { setDragOffset({ x: NODE_WIDTH / 2, y: NODE_HEIGHT / 2 }); }
    setSelectedNodeId(nodeId); 
  };

  const flowchartCanvasRef = useRef<HTMLDivElement>(null);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    // Primarily for future canvas panning logic, node dragging handled globally
  }, []);

  const handleCanvasMouseUp = useCallback((e: React.MouseEvent) => {
    // Global mouse up handles clearing draggingNodeId
  }, []);
  
  const handleCanvasClick = () => {
    if(!draggingNodeId) { setSelectedNodeId(null); setConnectingFromNodeId(null); }
  };

  const selectedNodeDetails = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;
  
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
        <div 
          ref={flowchartCanvasRef}
          className="flex-grow flowchart-canvas overflow-auto bg-gray-200 dark:bg-gray-800 relative cursor-grab active:cursor-grabbing"
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}  
          onClick={handleCanvasClick} 
        >
          <div className="relative" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }} >
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
              {edges.map(edge => {
                const sourceNode = nodes.find(n => n.id === edge.sourceId);
                const targetNode = nodes.find(n => n.id === edge.targetId);
                if (!sourceNode || !targetNode) return null;
                
                const x1 = sourceNode.x + NODE_WIDTH / 2;
                const y1 = sourceNode.y + NODE_HEIGHT / 2;
                const x2 = targetNode.x + NODE_WIDTH / 2;
                const y2 = targetNode.y + NODE_HEIGHT / 2;

                const dx = Math.abs(x2 - x1) * 0.3; const dy = Math.abs(y2 - y1) * 0.05; 
                const cp1x = x1 + dx; const cp1y = y1 + (y2 > y1 ? dy : -dy);
                const cp2x = x2 - dx; const cp2y = y2 - (y1 > y2 ? dy : -dy);

                const isSelectedEdge = (selectedNodeId === sourceNode.id || selectedNodeId === targetNode.id);
                const pathData = `M${x1},${y1} C${cp1x},${cp1y} ${cp2x},${cp2y} ${x2},${y2}`;
                
                const tangentAngle = Math.atan2(y2 - cp2y, x2 - cp2x); // Angle of the curve at the target
                const arrowSize = 12; // Length of the arrowhead "wings"
                const arrowheadWingAngle = Math.PI / 6; // 30 degrees for each wing from the line direction

                // Calculate points for the V-shaped arrowhead
                // Point 1 (end of one wing)
                const arrow_p1x = x2 - arrowSize * Math.cos(tangentAngle - arrowheadWingAngle);
                const arrow_p1y = y2 - arrowSize * Math.sin(tangentAngle - arrowheadWingAngle);
                // Point 2 (end of the other wing)
                const arrow_p2x = x2 - arrowSize * Math.cos(tangentAngle + arrowheadWingAngle);
                const arrow_p2y = y2 - arrowSize * Math.sin(tangentAngle + arrowheadWingAngle);
                
                // Path for the V-shaped arrowhead, with the tip at (x2, y2)
                const arrowheadPathData = `M${arrow_p1x},${arrow_p1y} L${x2},${y2} L${arrow_p2x},${arrow_p2y}`;
                
                const edgeStrokeClasses = `transition-all duration-150 stroke-gray-400 dark:stroke-gray-500 ${isSelectedEdge ? 'stroke-indigo-600 dark:stroke-indigo-400' : ''}`;

                return (
                  <g key={edge.id}>
                    <path d={pathData} strokeWidth="2" fill="none" className={edgeStrokeClasses} />
                    <path d={arrowheadPathData} strokeWidth="2" fill="none" className={edgeStrokeClasses}/>
                    {sourceNode.type === NodeType.CONDITIONAL_AGENT && edge.conditionKeyword && (
                      <text
                        x={(x1 + x2) / 2}
                        y={(y1 + y2) / 2 - 6}
                        className={`text-[10px] font-mono pointer-events-none fill-gray-700 dark:fill-gray-300 ${isSelectedEdge ? 'fill-indigo-700 dark:fill-indigo-300 font-semibold' : ''}`}
                        textAnchor="middle"
                      >
                        {edge.conditionKeyword}
                      </text>
                    )}
                    <path d={pathData} stroke="transparent" strokeWidth="15" fill="none" className="cursor-pointer pointer-events-auto" onClick={(e) => { e.stopPropagation(); if (window.confirm('Delete this connection?')) handleDeleteEdge(edge.id); }} />
                  </g>
                );
              })}
            </svg>

            {nodes.map(node => (
              <AgentNodeComponent
                key={node.id} node={node}
                isSelected={selectedNodeId === node.id}
                isConnectingFrom={connectingFromNodeId === node.id}
                onNodeClick={handleNodeClick} onNodeMouseDown={handleNodeMouseDown}
                isProcessingNode={currentProcessingNodeId === node.id && (isProcessing || (!!nodeErrors[node.id] && processingError !== null) )}
                hasError={!!nodeErrors[node.id]}
              />
            ))}
          </div>
        </div>

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
