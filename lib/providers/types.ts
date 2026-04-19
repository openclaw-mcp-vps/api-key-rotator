export interface RotationResult {
  success: boolean;
  newSecret: string;
  maskedValue: string;
  mode: "live" | "simulated";
  notes: string;
}

export interface DeploymentSyncResult {
  synced: boolean;
  message: string;
}
