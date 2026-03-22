/**
 * Cloudflare R2 Client
 * Generates signed download URLs for protected files
 */
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

/**
 * Returns a signed URL valid for `expiresInSeconds`
 * @param storagePath - path inside the R2 bucket
 * @param expiresInSeconds - default 300 (5 min)
 */
export async function getSignedDownloadUrl(
  storagePath: string,
  expiresInSeconds = 300
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key:    storagePath,
  })

  return getSignedUrl(r2, command, { expiresIn: expiresInSeconds })
}
