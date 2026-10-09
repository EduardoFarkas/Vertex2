const signatures: Record<string, (bytes: Buffer) => boolean> = {
  "image/jpeg": (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/png": (b) => b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  "image/webp": (b) => b.length >= 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP",
  "image/gif": (b) => b.length >= 6 && ["GIF87a", "GIF89a"].includes(b.toString("ascii", 0, 6)),
  "application/pdf": (b) => b.length >= 5 && b.toString("ascii", 0, 5) === "%PDF-",
};

export class UploadValidationError extends Error {
  constructor(message: string) { super(message); this.name = "UploadValidationError"; }
}

export function validateUploadedFile(bytes: Buffer, mimeType: string) {
  if (!bytes.length) throw new UploadValidationError("O arquivo enviado está vazio.");
  if (bytes.length > 20 * 1024 * 1024) throw new UploadValidationError("O arquivo excede o limite de 20 MB.");
  const check = signatures[mimeType];
  if (!check) throw new UploadValidationError("Formato não permitido. Envie JPG, PNG, WebP, GIF ou PDF.");
  if (!check(bytes)) throw new UploadValidationError("O conteúdo do arquivo não corresponde ao formato declarado. Verifique o arquivo e tente novamente.");
}
