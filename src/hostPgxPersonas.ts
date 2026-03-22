/**
 * Demo hosts: each maps to a PGx profile (hardcoded). Selection drives clearance / dosing PGxR.
 */
export const HOST_PGX_PERSONAS = [
  {
    id: "maria-okaf",
    name: "Maria Okafor",
    pgxProfile: "unknown" as const,
  },
  {
    id: "james-patel",
    name: "James Patel",
    pgxProfile: "normal" as const,
  },
  {
    id: "sam-rivera",
    name: "Sam Rivera",
    pgxProfile: "abcb1-low" as const,
  },
  {
    id: "taylor-choi",
    name: "Taylor Choi",
    pgxProfile: "abcb1-high" as const,
  },
] as const;

export type HostPgxPersonaId = (typeof HOST_PGX_PERSONAS)[number]["id"];

export const DEFAULT_HOST_PGX_PERSONA_ID: HostPgxPersonaId =
  HOST_PGX_PERSONAS[0].id;

export function getHostPgxPersona(
  id: HostPgxPersonaId,
): (typeof HOST_PGX_PERSONAS)[number] {
  const found = HOST_PGX_PERSONAS.find((p) => p.id === id);
  if (!found) return HOST_PGX_PERSONAS[0];
  return found;
}

export function isHostPgxPersonaId(v: string): v is HostPgxPersonaId {
  return HOST_PGX_PERSONAS.some((p) => p.id === v);
}
