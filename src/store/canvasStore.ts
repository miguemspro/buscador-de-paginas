import { create } from 'zustand';
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react';
import type { MindMapNodeData } from '../types/node.types';
import { applyHierarchicalLayoutAfterAddChild } from '../utils/layoutHelpers';

interface CanvasState {
  nodes: any[];
  edges: any[];
  selectedNodeId: string | null;
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (connection: any) => void;
  setNodes: (nodes: any[]) => void;
  setEdges: (edges: any[]) => void;
  addNode: (node: any) => void;
  updateNode: (id: string, data: Partial<MindMapNodeData>) => void;
  deleteNode: (id: string) => void;
  duplicateNode: (id: string) => void;
  setSelectedNodeId: (id: string | null) => void;
  clearCanvas: () => void;
  addChildNode: (parentId: string, childNode: any) => void;
  toggleCollapse: (nodeId: string) => void;
  getChildren: (nodeId: string) => any[];
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
  },

  setNodes: (nodes) => set({ nodes }),

  setEdges: (edges) => set({ edges }),

  addNode: (node) => {
    set({ nodes: [...get().nodes, node] });
  },

  updateNode: (id, data) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, ...data } }
          : node
      ),
    });
  },

  deleteNode: (id) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== id),
      edges: get().edges.filter(
        (edge) => edge.source !== id && edge.target !== id
      ),
    });
  },

  duplicateNode: (id) => {
    const nodeToDuplicate = get().nodes.find((node) => node.id === id);
    if (!nodeToDuplicate) return;

    const newNode = {
      ...nodeToDuplicate,
      id: `${nodeToDuplicate.id}-copy-${Date.now()}`,
      position: {
        x: nodeToDuplicate.position.x + 50,
        y: nodeToDuplicate.position.y + 50,
      },
    };

    get().addNode(newNode);
  },

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  clearCanvas: () => set({ nodes: [], edges: [], selectedNodeId: null }),

  addChildNode: (parentId, childNode) => {
    const parentNode = get().nodes.find((n) => n.id === parentId);
    if (!parentNode) return;

    const updatedParent = {
      ...parentNode,
      data: {
        ...parentNode.data,
        children: [...(parentNode.data.children || []), childNode.id],
      },
    };

    const newChild = {
      ...childNode,
      data: {
        ...childNode.data,
        parentId: parentId,
        level: (parentNode.data.level || 0) + 1,
      },
    };

    const newEdge = {
      id: `edge-${parentId}-${childNode.id}`,
      source: parentId,
      target: childNode.id,
      type: 'smoothstep',
      animated: true,
    };

    const nodesWithChild = get().nodes
      .map((n) => (n.id === parentId ? updatedParent : n))
      .concat(newChild);

    const layoutedNodes = applyHierarchicalLayoutAfterAddChild(
      nodesWithChild,
      parentId,
      newChild.id
    );

    set({
      nodes: layoutedNodes,
      edges: [...get().edges, newEdge],
    });
  },

  toggleCollapse: (nodeId) => {
    const node = get().nodes.find((n) => n.id === nodeId);
    if (!node) return;

    const isCollapsed = !node.data.isCollapsed;

    const toggleDescendants = (id: string, hide: boolean) => {
      const children = get().nodes.filter((n) => n.data.parentId === id);
      children.forEach((child) => {
        set({
          nodes: get().nodes.map((n) =>
            n.id === child.id ? { ...n, hidden: hide } : n
          ),
        });
        toggleDescendants(child.id, hide);
      });
    };

    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, isCollapsed } }
          : n
      ),
    });

    toggleDescendants(nodeId, isCollapsed);
  },

  getChildren: (nodeId) => {
    return get().nodes.filter((n) => n.data.parentId === nodeId);
  },
}));
