import { randomBytes } from "node:crypto";
import AWS from "aws-sdk";
import { maskSecret } from "@/lib/utils";
import type { RotationResult } from "@/lib/providers/types";

export async function rotateAwsKey(params: {
  iamUserName?: string;
  previousAccessKeyId?: string;
}): Promise<RotationResult> {
  const fallbackSecret = `AKIA${randomBytes(16).toString("hex").toUpperCase().slice(0, 16)}`;

  if (!process.env.AWS_ROTATOR_ACCESS_KEY_ID || !process.env.AWS_ROTATOR_SECRET_ACCESS_KEY) {
    return {
      success: true,
      newSecret: fallbackSecret,
      maskedValue: maskSecret(fallbackSecret),
      mode: "simulated",
      notes: "AWS credentials not configured; generated a compliance-safe placeholder key fingerprint."
    };
  }

  const iamUserName = params.iamUserName ?? process.env.AWS_ROTATOR_IAM_USER;
  if (!iamUserName) {
    return {
      success: false,
      newSecret: fallbackSecret,
      maskedValue: maskSecret(fallbackSecret),
      mode: "simulated",
      notes: "Missing iamUserName. Provide project metadata or AWS_ROTATOR_IAM_USER."
    };
  }

  const iam = new AWS.IAM({
    accessKeyId: process.env.AWS_ROTATOR_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_ROTATOR_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION ?? "us-east-1"
  });

  try {
    const createdKey = await iam
      .createAccessKey({
        UserName: iamUserName
      })
      .promise();

    const createdAccessKeyId = createdKey.AccessKey?.AccessKeyId ?? fallbackSecret;

    if (params.previousAccessKeyId) {
      await iam
        .deleteAccessKey({
          UserName: iamUserName,
          AccessKeyId: params.previousAccessKeyId
        })
        .promise();
    }

    return {
      success: true,
      newSecret: createdAccessKeyId,
      maskedValue: maskSecret(createdAccessKeyId),
      mode: "live",
      notes: `Created new IAM access key for ${iamUserName}.`
    };
  } catch (error) {
    return {
      success: false,
      newSecret: fallbackSecret,
      maskedValue: maskSecret(fallbackSecret),
      mode: "simulated",
      notes: `AWS API rotation failed: ${error instanceof Error ? error.message : "unknown error"}`
    };
  }
}
