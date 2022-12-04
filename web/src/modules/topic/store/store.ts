import create from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { NodeType } from "../components/nodeDecorations";
import { Direction, layout } from "../utils/layout";

export type NodeRelation = "Parent" | "Child";

// TODO: perhaps we could use classes to isolate/indicate state & state change?
/* eslint-disable functional/no-let */
let nodeId = 0;
const nextNodeId = () => (nodeId++).toString();
let edgeId = 0;
const nextEdgeId = () => (edgeId++).toString();
/* eslint-enable functional/no-let */

interface BuildProps {
  id: string;
  type: NodeType;
}
const buildNode = ({ id, type }: BuildProps) => {
  return {
    id: id,
    data: {
      label: `text${id}`,
      score: "-" as Score,
      width: 300,
    },
    position: { x: 0, y: 0 }, // assume layout will adjust this
    selected: false,
    type: type,
  };
};
export type Node = ReturnType<typeof buildNode>;

function buildEdge(sourceNodeId: string, targetNodeId: string) {
  return {
    id: nextEdgeId(),
    data: {
      score: "-" as Score,
    },
    source: sourceNodeId,
    target: targetNodeId,
    type: "ScoreEdge",
  };
}
export type Edge = ReturnType<typeof buildEdge>;

const getInitialNodes = (startingNodeType: NodeType) => {
  const { layoutedNodes: initialNodes } = layout(
    [buildNode({ id: nextNodeId(), type: startingNodeType })],
    [],
    "TB"
  );

  return initialNodes;
};

const diagrams: Record<string, DiagramState> = {
  root: {
    nodes: getInitialNodes("Problem"),
    edges: [],
    direction: "TB",
  },
};

const doesDiagramExist = (diagramId: string) => {
  return Object.keys(diagrams).includes(diagramId);
};

interface AllDiagramState {
  activeDiagramId: string;
  rootDiagramId: string;
  claimDiagramIds: string[];
}

interface DiagramState {
  nodes: Node[];
  edges: Edge[];
  direction: Direction;
}

export type ComponentType = "node" | "edge";

export const possibleScores = ["-", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] as const;
export type Score = typeof possibleScores[number];

interface DiagramActions {
  addNode: (_toNodeId: string, _as: NodeRelation, _type: NodeType) => void;
  deselectNodes: () => void;
  doesDiagramExist: (diagramId: string) => boolean;
  scoreParent: (parentId: string, parentType: ComponentType, score: Score) => void;
  setActiveDiagram: (diagramId: string) => void;
  setNodeLabel: (nodeId: string, value: string) => void;
}

// TODO: reorganize so that lint errors are more specific; right now, any error in this invocation
// seems to report all lines in the invocation, making it very hard to debug.
export const useDiagramStore = create<AllDiagramState & DiagramState & DiagramActions>()(
  // seems like we should be able to auto-wrap all stores with devtools

  immer(
    devtools((set, get) => ({
      activeDiagramId: "root",
      rootDiagramId: "root",
      claimDiagramIds: [],
      nodes: diagrams.root.nodes,
      edges: diagrams.root.edges,
      direction: diagrams.root.direction,

      addNode: (toNodeId, as, type) => {
        set(
          (state) => {
            const toNode = state.nodes.find((node) => node.id === toNodeId);
            if (!toNode) throw new Error("toNode not found");

            const newNodeId = nextNodeId();
            const newNode = buildNode({
              id: newNodeId,
              type: type,
            });

            const sourceNodeId = as === "Parent" ? newNodeId : toNodeId;
            const targetNodeId = as === "Parent" ? toNodeId : newNodeId;
            const newEdge = buildEdge(sourceNodeId, targetNodeId);

            const newNodes = state.nodes.concat(newNode);
            const newEdges = state.edges.concat(newEdge);
            const { layoutedNodes, layoutedEdges } = layout(newNodes, newEdges, state.direction);

            /* eslint-disable functional/immutable-data, no-param-reassign */
            state.nodes = layoutedNodes;
            state.edges = layoutedEdges;
            /* eslint-enable functional/immutable-data, no-param-reassign */
          },
          false,
          "addNode" // little gross, seems like this should be inferrable from method name
        );
      },

      deselectNodes: () => {
        set(
          (state) => {
            state.nodes.forEach((node) => {
              // TODO: super jank - node.selected is always false, so setting to true ensures the change is fired (I think)
              // somehow returning { ...node, selected: false } without immer was actually working as well...
              // probably should change how we're using `selected`
              /* eslint-disable functional/immutable-data, no-param-reassign */
              node.selected = true;
              node.selected = false;
              /* eslint-enable functional/immutable-data, no-param-reassign */
            });
          },
          false,
          "deselectNodes"
        );
      },

      doesDiagramExist: doesDiagramExist,

      // will this trigger re-render for all parentType components, since Diagram depends on the whole array?
      // theoretically we should be able to just re-render the affected component...
      // at least the HTML should mostly be unchanged I guess; not sure how big of a deal the performance impact is here
      scoreParent: (parentId, parentType, score) => {
        set(
          (state) => {
            const parentsKey = parentType === "node" ? "nodes" : "edges";
            // RIP typescript can't infer this https://github.com/microsoft/TypeScript/issues/33591#issuecomment-786443978
            const parents: (Node | Edge)[] = state[parentsKey];
            const parent = parents.find((parent) => parent.id === parentId);
            if (!parent) throw new Error("parent not found");

            /* eslint-disable functional/immutable-data, no-param-reassign */
            parent.data.score = score;
            /* eslint-enable functional/immutable-data, no-param-reassign */
          },
          false,
          "scoreParent"
        );
      },

      setActiveDiagram: (diagramId) => {
        set(
          (state) => {
            // save current diagram state before switching
            // TODO: perhaps we could use classes to isolate/indicate state & state change?
            /* eslint-disable functional/immutable-data */
            diagrams[get().activeDiagramId].nodes = get().nodes; // get() because diagrams exist outside of this immer'd method and should not take draft state outside of this scope
            diagrams[get().activeDiagramId].edges = get().edges;
            /* eslint-enable functional/immutable-data */

            // create new diagram if it doesn't exist
            if (!doesDiagramExist(diagramId)) {
              // TODO: perhaps we could use classes to isolate/indicate state & state change?
              // eslint-disable-next-line functional/immutable-data
              diagrams[diagramId] = {
                nodes: getInitialNodes("RootClaim"),
                edges: [],
                direction: "LR",
              };

              const claimDiagramIds = state.claimDiagramIds.concat(diagramId);

              /* eslint-disable functional/immutable-data, no-param-reassign */
              state.claimDiagramIds = claimDiagramIds;
              /* eslint-enable functional/immutable-data, no-param-reassign */
            }

            // set diagram
            /* eslint-disable functional/immutable-data, no-param-reassign */
            state.activeDiagramId = diagramId;
            state.nodes = diagrams[diagramId].nodes;
            state.edges = diagrams[diagramId].edges;
            state.direction = diagrams[diagramId].direction;
            /* eslint-enable functional/immutable-data, no-param-reassign */
          },
          false,
          "setActiveDiagram"
        );
      },

      setNodeLabel: (nodeId, value) => {
        set(
          (state) => {
            const node = state.nodes.find((node) => node.id === nodeId);
            if (!node) throw new Error("node not found");

            /* eslint-disable functional/immutable-data, no-param-reassign */
            node.data.label = value;
            /* eslint-enable functional/immutable-data, no-param-reassign */
          },
          false,
          "setNodeLabel"
        );
      },
    }))
  )
);
