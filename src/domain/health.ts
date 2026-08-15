/** Unknown is deliberately not healthy: only explicit evidence may count as healthy. */
export function isConfirmedHealthy(state?: 'saludable' | 'necesita_atencion' | 'en_riesgo') {
  return state === 'saludable';
}
