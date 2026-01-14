/**
 * Calcula posições dos nós em layout hierárquico
 */

export interface LayoutNode {
  id: string;
  parentId?: string | null;
  children?: string[];
  level?: number;
  position: { x: number; y: number };
}

const HORIZONTAL_SPACING = 400;
const VERTICAL_SPACING = 250;
const CHILD_OFFSET_X = 100;

/**
 * Calcula a posição de um nó filho baseado na posição do pai
 */
export function calculateChildPosition(
  parentPosition: { x: number; y: number },
  childIndex: number,
  totalChildren: number,
  level: number
): { x: number; y: number } {
  const totalWidth = (totalChildren - 1) * HORIZONTAL_SPACING;
  const startX = parentPosition.x - totalWidth / 2;

  return {
    x: startX + childIndex * HORIZONTAL_SPACING + level * CHILD_OFFSET_X,
    y: parentPosition.y + VERTICAL_SPACING,
  };
}

/**
 * Recalcula todas as posições dos nós em layout hierárquico
 */
export function recalculateHierarchicalLayout(nodes: any[]): any[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const updatedNodes = [...nodes];

  const nodesByLevel = new Map<number, any[]>();

  nodes.forEach((node) => {
    const level = node.data.level || 0;
    if (!nodesByLevel.has(level)) {
      nodesByLevel.set(level, []);
    }
    nodesByLevel.get(level)!.push(node);
  });

  nodesByLevel.forEach((levelNodes, level) => {
    if (level === 0) {
      levelNodes.forEach((node, index) => {
        const nodeIndex = updatedNodes.findIndex((n) => n.id === node.id);
        if (nodeIndex >= 0) {
          updatedNodes[nodeIndex] = {
            ...updatedNodes[nodeIndex],
            position: {
              x: index * (HORIZONTAL_SPACING * 2),
              y: 50,
            },
          };
        }
      });
    } else {
      levelNodes.forEach((node) => {
        const parent = nodeMap.get(node.data.parentId);
        if (parent) {
          const siblings = updatedNodes.filter(
            (n) => n.data.parentId === parent.id
          );
          const childIndex = siblings.findIndex((n) => n.id === node.id);

          const newPosition = calculateChildPosition(
            parent.position,
            childIndex,
            siblings.length,
            level
          );

          const nodeIndex = updatedNodes.findIndex((n) => n.id === node.id);
          if (nodeIndex >= 0) {
            updatedNodes[nodeIndex] = {
              ...updatedNodes[nodeIndex],
              position: newPosition,
            };
          }
        }
      });
    }
  });

  return updatedNodes;
}

/**
 * Aplica layout hierárquico após adicionar um nó filho
 */
export function applyHierarchicalLayoutAfterAddChild(
  nodes: any[],
  parentId: string,
  newChildId: string
): any[] {
  return recalculateHierarchicalLayout(nodes);
}
