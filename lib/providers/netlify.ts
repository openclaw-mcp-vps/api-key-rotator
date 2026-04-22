interface SyncNetlifyEnvInput {
  token: string;
  siteId: string;
  key: string;
  value: string;
}

export async function syncNetlifyEnvVar(input: SyncNetlifyEnvInput): Promise<void> {
  const response = await fetch(`https://api.netlify.com/api/v1/sites/${input.siteId}/env`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${input.token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      [input.key]: input.value
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Netlify env sync failed: ${response.status} ${body}`);
  }
}
