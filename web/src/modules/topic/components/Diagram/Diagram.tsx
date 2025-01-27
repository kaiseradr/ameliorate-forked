import { Cancel } from "@mui/icons-material";
import { Typography } from "@mui/material";
import _ from "lodash";
import { ComponentType, useEffect } from "react";
import {
  Background,
  BackgroundVariant,
  type EdgeProps as DefaultEdgeProps,
  type NodeProps as DefaultNodeProps,
  type EdgeChange,
  type EdgeSelectionChange,
  type NodeChange,
  type NodeSelectionChange,
  ReactFlowProvider,
} from "reactflow";

import { emitter } from "../../../../common/event";
import { useViewportUpdater } from "../../hooks/flowHooks";
import { setSelected } from "../../store/actions";
import { useIsAnyArguableSelected } from "../../store/arguableHooks";
import { connectNodes } from "../../store/createDeleteActions";
import { useFilteredDiagram } from "../../store/store";
import { closeClaimDiagram } from "../../store/viewActions";
import { ArguableType, type Edge, type Node } from "../../utils/diagram";
import { type NodeType } from "../../utils/node";
import { FlowNode } from "../Node/FlowNode";
import { ScoreEdge } from "../ScoreEdge/ScoreEdge";
import { PositionedCloseButton, StyledReactFlow } from "./Diagram.styles";

const buildNodeComponent = (type: NodeType) => {
  // eslint-disable-next-line react/display-name -- react flow dynamically creates these components without name anyway
  return (props: NodeProps) => {
    return <FlowNode {...props} type={type} />;
  };
};

// this can be generated via `nodeDecorations` but hard to do without the complexity making it hard to follow, so leaving this hardcoded
const nodeTypes: Record<NodeType, ComponentType<NodeProps>> = {
  problem: buildNodeComponent("problem"),
  solution: buildNodeComponent("solution"),
  solutionComponent: buildNodeComponent("solutionComponent"),
  criterion: buildNodeComponent("criterion"),
  effect: buildNodeComponent("effect"),
  rootClaim: buildNodeComponent("rootClaim"),
  support: buildNodeComponent("support"),
  critique: buildNodeComponent("critique"),
};

const edgeTypes: Record<"ScoreEdge", ComponentType<EdgeProps>> = { ScoreEdge: ScoreEdge };

// react-flow passes exactly DefaultNodeProps but data can be customized
// not sure why, but DefaultNodeProps has xPos and yPos instead of Node's position.x and position.y
export interface NodeProps extends DefaultNodeProps {
  data: Node["data"];
}

export interface EdgeProps extends DefaultEdgeProps {
  // we'll always pass data - why does react-flow make it nullable :(
  // can't figure out how to amend this to make it non-nullable, since react-flow's Edge is defined as a type, not an interface
  data?: Edge["data"];
}

const onArguableChange = (changes: (NodeChange | EdgeChange)[], arguableType: ArguableType) => {
  const selectChanges = changes.filter((change) => change.type === "select") as
    | NodeSelectionChange[]
    | EdgeSelectionChange[];

  if (selectChanges.length > 0) setSelected(selectChanges, arguableType);
};

interface DiagramProps {
  diagramId: string;
}

const DiagramWithoutProvider = ({ diagramId }: DiagramProps) => {
  const diagram = useFilteredDiagram(diagramId);
  const { moveViewportToIncludeNode } = useViewportUpdater();
  const isAnyArguableSelected = useIsAnyArguableSelected();

  const nodes = diagram.nodes;
  const edges = diagram.edges;

  const showCloseButton = diagram.type === "claim";
  const closeButton = (
    <PositionedCloseButton onClick={() => closeClaimDiagram()} color="primary">
      <Cancel />
    </PositionedCloseButton>
  );

  useEffect(() => {
    const unbind = emitter.on("addNode", (node) => {
      if (node.data.diagramId !== diagramId) return;
      moveViewportToIncludeNode(node);
    });
    return () => unbind();
  }, [diagramId, moveViewportToIncludeNode]);

  const emptyText = <Typography variant="h5">Right-click to create</Typography>;

  return (
    <>
      {showCloseButton && closeButton}

      <StyledReactFlow
        id={diagramId} // need unique ids to use multiple flow instances on the same page
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ maxZoom: 1 }}
        minZoom={0.25}
        onConnect={({ source, target }) => void connectNodes(source, target)}
        onEdgesChange={(changes) => onArguableChange(changes, "edge")}
        onNodesChange={(changes) => onArguableChange(changes, "node")}
        nodesDraggable={false}
        nodesConnectable={diagram.type !== "claim"} // claim diagram is a tree, so cannot connect existing nodes
        isAnyArguableSelected={isAnyArguableSelected}
      >
        <Background variant={BackgroundVariant.Dots} />
        {_(nodes).isEmpty() && emptyText}
      </StyledReactFlow>
    </>
  );
};

export const Diagram = (props: DiagramProps) => (
  // wrap in provider so we can use react-flow state https://reactflow.dev/docs/api/react-flow-provider/
  <ReactFlowProvider>
    <DiagramWithoutProvider {...props} />
  </ReactFlowProvider>
);
