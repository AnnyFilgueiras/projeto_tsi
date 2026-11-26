import { createHash } from 'node:crypto';
import sharp from 'sharp';
import {
  payloadTooLargeProblem,
  ProblemError,
  unsupportedMediaTypeProblem,
} from '../../../shared/problem.js';

// ADR-012 image standard: max 5 MiB upload, normalized to WebP <= 1024x1024 preserving aspect ratio.
export const MAX_PHOTO_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_PHOTO_DIMENSION_PX = 1024;
export const WEBP_QUALITY = 82;

export interface ProcessedDishPhoto {
  readonly hash: string;
  readonly webpBytes: Buffer;
}

export function isWebpBuffer(bytes: Buffer): boolean {
  return (
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString('ascii') === 'RIFF' &&
    bytes.subarray(8, 12).toString('ascii') === 'WEBP'
  );
}

function isJpegBuffer(bytes: Buffer): boolean {
  return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

function isPngBuffer(bytes: Buffer): boolean {
  return (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  );
}

function hasSupportedImageMagicBytes(bytes: Buffer): boolean {
  return isWebpBuffer(bytes) || isJpegBuffer(bytes) || isPngBuffer(bytes);
}

/**
 * Validates input image magic bytes (WebP, JPEG, PNG), resizes within 1024x1024 px
 * without enlargement or cropping, re-encodes to WebP stripping EXIF metadata, verifies
 * output WebP magic bytes, and computes the SHA-256 content hash (ADR-012).
 */
export async function processDishPhoto(rawBytes: Buffer): Promise<ProcessedDishPhoto> {
  if (rawBytes.length === 0) {
    throw new ProblemError(
      unsupportedMediaTypeProblem('O arquivo de imagem está vazio ou ausente.'),
    );
  }

  if (rawBytes.length > MAX_PHOTO_UPLOAD_BYTES) {
    throw new ProblemError(
      payloadTooLargeProblem('A foto enviada excede o limite máximo de 5 MB.'),
    );
  }

  if (!hasSupportedImageMagicBytes(rawBytes)) {
    throw new ProblemError(
      unsupportedMediaTypeProblem(
        'Formato de imagem não suportado. Envie uma imagem WebP, JPEG ou PNG válida.',
      ),
    );
  }

  let webpBytes: Buffer;
  try {
    webpBytes = await sharp(rawBytes, { failOn: 'error' })
      .rotate()
      .resize({
        width: MAX_PHOTO_DIMENSION_PX,
        height: MAX_PHOTO_DIMENSION_PX,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
  } catch {
    throw new ProblemError(
      unsupportedMediaTypeProblem('Não foi possível decodificar a imagem enviada.'),
    );
  }

  if (!isWebpBuffer(webpBytes)) {
    throw new ProblemError(
      unsupportedMediaTypeProblem('Falha ao normalizar a imagem para o formato WebP.'),
    );
  }

  const hash = createHash('sha256').update(webpBytes).digest('hex');
  return { hash, webpBytes };
}
