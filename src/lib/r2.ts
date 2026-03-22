/**
 * Cloudflare R2 Client
 * Generates signed download URLs and uploads files to R2.
 */
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
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

/**
 * Uploads a file to R2.
 * @param storagePath - path inside the R2 bucket
 * @param body - file bytes
 * @param contentType - MIME type
 */
export async function uploadToR2(
  storagePath: string,
  body: Buffer | Uint8Array,
  contentType?: string
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: storagePath,
    Body: body,
    ContentType: contentType || 'application/octet-stream',
  })

  await r2.send(command)
}
