/** A snapshot is visible only when it has a real owner UID matching the active UID. */
export function isPlantSnapshotVisible(snapshotUid: string | null, activeUid: string | undefined): boolean {
  return activeUid !== undefined && snapshotUid === activeUid;
}

/** Async writes must belong to both the active UID and the active generation. */
export function isPlantDataIdentityCurrent(
  targetUid: string,
  targetGeneration: number,
  activeUid: string | undefined,
  activeGeneration: number,
): boolean {
  return targetUid === activeUid && targetGeneration === activeGeneration;
}
