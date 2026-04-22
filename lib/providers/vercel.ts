interface SyncVercelEnvInput {
  token: string;
  projectId: string;
  key: string;
  value: string;
}

export async function syncVercelEnvVar(input: SyncVercelEnvInput): Promise<void> {
  const response = await fetch(`https://api.vercel.com/v10/projects/${input.projectId}/env`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      key: input.key,
      value: input.value,
      type: "encrypted",
      target: ["production", "preview", "development"]
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Vercel env sync failed: ${response.status} ${body}`);
  }
}
