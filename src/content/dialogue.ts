export type DialogueNode = {
  id: string
  speaker: string
  text: string
  minTrust: number
  nextTrust?: number
}

export const iriaDialogue: readonly DialogueNode[] = [
  { id: 'iria-route', speaker: 'Iria', text: 'La guardiana te ofrece una ruta segura hacia el patio.', minTrust: 0, nextTrust: 1 },
  { id: 'iria-relic', speaker: 'Iria', text: 'Iria confía en ti y te entrega una pista sobre la reliquia.', minTrust: 1, nextTrust: 2 },
  { id: 'iria-farewell', speaker: 'Iria', text: 'Iria asiente. Ya te ha contado todo lo que sabe.', minTrust: 2 },
]

export function getDialogueNode(nodes: readonly DialogueNode[], trust: number): DialogueNode {
  return nodes.findLast((node) => trust >= node.minTrust) ?? nodes[0]
}
