export type AgentGroup = 'health' | 'behavior' | 'newPet';

export interface AgentConfig {
  group: AgentGroup;
  label: string;
  agentId?: string;
}

// One ElevenLabs agent per group. Only the agent matching the chosen
// experience is ever loaded — never more than one at a time. A group with
// no agentId configured simply isn't offered yet (see isAgentLive).
export const AGENTS: Record<AgentGroup, AgentConfig> = {
  health: {
    group: 'health',
    label: 'Health Assessment',
    agentId: process.env.NEXT_PUBLIC_ELEVENLABS_HEALTH_AGENT_ID,
  },
  behavior: {
    group: 'behavior',
    label: 'Behavior & Training',
    agentId: process.env.NEXT_PUBLIC_ELEVENLABS_BEHAVIOR_AGENT_ID,
  },
  newPet: {
    group: 'newPet',
    label: 'New Pet Guide',
    agentId: process.env.NEXT_PUBLIC_ELEVENLABS_NEW_PET_AGENT_ID,
  },
};

export function isAgentLive(group: AgentGroup): boolean {
  return !!AGENTS[group].agentId;
}
