import { Typography } from "@mui/material";
import _ from "lodash";
import { Dispatch, SetStateAction, createContext } from "react";
import {
  Background,
  BackgroundVariant,
  type Edge,
  type Node,
  useEdgesState,
  useNodesState,
} from "react-flow-renderer";

import { EditableNode } from "../EditableNode/EditableNode";
import { StyledReactFlow } from "./Diagram.styles";

const nodeTypes = { editable: EditableNode };

export type As = "Parent" | "Child";

let nodeId = 1;
const nextNodeId = () => (nodeId++).toString();
let edgeId = 0;
const nextEdgeId = () => (edgeId++).toString();

interface BuildProps {
  id: string;
  x: number;
  y: number;
}

const buildNode = ({ id, x, y }: BuildProps) => {
  return {
    id: id,
    data: {
      label: `text${id}`,
    },
    position: { x: x, y: y },
    type: "editable",
  };
};

const initialNodes = [buildNode({ id: "0", x: 250, y: 25 })];

interface ContextValue {
  addNode: (_toNode: string, _as: As) => void;
}

export const DiagramContext = createContext<ContextValue>({ addNode: () => null }); // default should never be used

const addNode = (
  setNodes: Dispatch<SetStateAction<Node<{ label: string }>[]>>,
  setEdges: Dispatch<SetStateAction<Edge[]>>,
  toNodeId: string,
  as: As
) => {
  const newNodeId = nextNodeId();

  setNodes((nodes) => {
    const toNode = nodes.find((node) => node.id === toNodeId);
    if (!toNode) throw new Error("toNode not found");

    const yShift = as === "Parent" ? -100 : 100;
    const newNode = buildNode({
      id: newNodeId,
      x: toNode.position.x,
      y: toNode.position.y + yShift,
    });

    return nodes.concat(newNode);
  });

  setEdges((edges) => {
    const newEdgeId = nextEdgeId();
    const sourceNode = as === "Parent" ? newNodeId : toNodeId;
    const targetNode = as === "Parent" ? toNodeId : newNodeId;
    const newEdge = { id: newEdgeId, source: sourceNode, target: targetNode };

    return edges.concat(newEdge);
  });
};

const deselectNodes = (setNodes: Dispatch<SetStateAction<Node<{ label: string }>[]>>) => {
  setNodes((nodes) => {
    return nodes.map((node) => {
      return { ...node, selected: false };
    });
  });
};

export const Diagram = () => {
  const [nodes, setNodes] = useNodesState(initialNodes);
  const [edges, setEdges] = useEdgesState([]);

  const curriedAddNode = (toNodeId: string, as: As) => addNode(setNodes, setEdges, toNodeId, as);
  const curriedDeselectNodes = () => deselectNodes(setNodes);
  const emptyText = <Typography variant="h5">Right-click to create</Typography>;

  return (
    /* use context because Flow component creates nodes for us, so it's awkward to pass info to nodes */
    <DiagramContext.Provider value={{ addNode: curriedAddNode }}>
      <StyledReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        onPaneClick={curriedDeselectNodes}
      >
        <Background variant={BackgroundVariant.Dots} />
        {_(nodes).isEmpty() && emptyText}
      </StyledReactFlow>
    </DiagramContext.Provider>
  );
};