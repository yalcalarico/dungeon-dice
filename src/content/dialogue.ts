import { ashenCourtyard } from './campaign'

export type DialogueNode = {
  id: string
  speaker: string
  text: string
  minTrust: number
  nextTrust?: number
}

export const iriaDialogue: readonly DialogueNode[] = (ashenCourtyard.dialogues ?? [])
  .map((dialogue) => ({
    id: dialogue.id,
    speaker: ashenCourtyard.npcs?.find((npc) => npc.id === dialogue.npcId)?.name ?? dialogue.npcId,
    text: dialogue.text,
    minTrust: dialogue.minTrust,
    nextTrust: dialogue.nextTrust,
  }))

export function getDialogueNode(nodes: readonly DialogueNode[], trust: number): DialogueNode {
  return nodes.findLast((node) => trust >= node.minTrust) ?? nodes[0]
}
