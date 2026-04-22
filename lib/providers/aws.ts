import { randomBytes } from "node:crypto";
import AWS from "aws-sdk";

import type { RotationOutcome } from "@/lib/providers/types";

interface AwsSecretShape {
  userName?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

export async function rotateAwsCredential(existingSecret: string): Promise<RotationOutcome> {
  const parsed = safeParse(existingSecret);

  if (process.env.AWS_ROTATION_ENABLED !== "true") {
    return {
      newSecret: JSON.stringify({
        userName: parsed.userName ?? "set-user-name",
        accessKeyId: `AKIA${randomBytes(12).toString("hex").toUpperCase()}`,
        secretAccessKey: randomBytes(32).toString("base64url")
      }),
      notes: "Simulated AWS rotation. Set AWS_ROTATION_ENABLED=true and provide IAM permissions for live key creation."
    };
  }

  if (!parsed.userName) {
    throw new Error("AWS key payload must include userName when live rotation is enabled");
  }

  const iam = new AWS.IAM();
  const created = await iam.createAccessKey({ UserName: parsed.userName }).promise();

  if (!created.AccessKey?.AccessKeyId || !created.AccessKey.SecretAccessKey) {
    throw new Error("AWS did not return a complete access key payload");
  }

  if (parsed.accessKeyId) {
    await iam
      .deleteAccessKey({
        UserName: parsed.userName,
        AccessKeyId: parsed.accessKeyId
      })
      .promise();
  }

  return {
    newSecret: JSON.stringify({
      userName: parsed.userName,
      accessKeyId: created.AccessKey.AccessKeyId,
      secretAccessKey: created.AccessKey.SecretAccessKey
    }),
    notes: "AWS IAM access key rotated successfully."
  };
}

function safeParse(secret: string): AwsSecretShape {
  try {
    return JSON.parse(secret) as AwsSecretShape;
  } catch {
    return {};
  }
}
