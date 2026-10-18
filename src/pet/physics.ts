/** The fixed box reserves all squash/stretch and hop poses, not only the neutral art. */
export const PET_ENVELOPE = 1.35;

export interface AxisStep { position: number; velocity: number; collisions: number }
export interface FlightState {
  x: number; y: number; vx: number; vy: number; width: number; height: number; collisions: number;
}

const clamp = (value: number, limit: number) => Math.max(0, Math.min(limit, value));

/**
 * Reflect an unfolded, constant-speed coordinate into a bounded interval.
 * Unlike a one-collision-per-frame integrator, this preserves every reflection
 * even when one delayed frame crosses the complete viewport several times.
 */
export function reflectAxis(position: number, velocity: number, limit: number, seconds: number): AxisStep {
  const bound = Math.max(0, limit);
  const start = clamp(position, bound);
  if (!bound || !velocity || !Number.isFinite(seconds) || seconds <= 0) {
    return { position: start, velocity, collisions: 0 };
  }
  const unfolded = start + velocity * seconds;
  const collisions = velocity > 0
    ? Math.floor(unfolded / bound) - Math.floor(start / bound) + (start === bound ? 1 : 0)
    : Math.ceil(start / bound) - Math.ceil(unfolded / bound) + (start === 0 ? 1 : 0);
  const wrapped = ((unfolded % (bound * 2)) + bound * 2) % (bound * 2);
  return {
    position: wrapped <= bound ? wrapped : bound * 2 - wrapped,
    velocity: collisions % 2 ? -velocity : velocity,
    collisions,
  };
}

export function stepFlight(state: FlightState, viewportWidth: number, viewportHeight: number, seconds: number): FlightState {
  const x = reflectAxis(state.x, state.vx, viewportWidth - state.width, seconds);
  const y = reflectAxis(state.y, state.vy, viewportHeight - state.height, seconds);
  return { ...state, x: x.position, y: y.position, vx: x.velocity, vy: y.velocity,
    collisions: state.collisions + x.collisions + y.collisions };
}

/** Also works when a phone or a resized window is smaller than the requested pet. */
export function fitPetSize(requested: number, viewportWidth: number, viewportHeight: number): number {
  return Math.max(0, Math.min(requested, viewportWidth / PET_ENVELOPE, viewportHeight / PET_ENVELOPE));
}

export function resizeFlight(state: FlightState, spriteSize: number, viewportWidth: number, viewportHeight: number): FlightState {
  const extent = spriteSize * PET_ENVELOPE;
  return { ...state, width: extent, height: extent,
    x: clamp(state.x, Math.max(0, viewportWidth - extent)),
    y: clamp(state.y, Math.max(0, viewportHeight - extent)) };
}
