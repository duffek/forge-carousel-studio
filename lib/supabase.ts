import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Server-only Supabase client (service role). Never import from client code —
// all browser access goes through the API routes.
let client: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set. Run `supabase start` and add them to .env.local.",
    );
  }
  if (!client) {
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export const SLIDES_BUCKET = "slides";

// Upload a data: URL to the slides bucket, return its public URL.
export async function uploadDataUrl(
  projectId: string,
  slideId: string,
  dataUrl: string,
): Promise<string> {
  const m = /^data:([^;,]+);base64,([\s\S]+)$/.exec(dataUrl);
  if (!m) throw new Error("Expected a base64 data URL");
  const [, mime, b64] = m;
  const ext = mime.includes("svg")
    ? "svg"
    : mime.includes("jpeg") || mime.includes("jpg")
      ? "jpg"
      : mime.includes("webp")
        ? "webp"
        : "png";
  const path = `${projectId}/${slideId}-${Date.now()}.${ext}`;
  const sb = supabaseAdmin();
  const { error } = await sb.storage
    .from(SLIDES_BUCKET)
    .upload(path, Buffer.from(b64, "base64"), {
      contentType: mime,
      upsert: true,
    });
  if (error) throw new Error(`Image upload failed: ${error.message}`);
  return sb.storage.from(SLIDES_BUCKET).getPublicUrl(path).data.publicUrl;
}

// Best-effort removal of every stored image under a project's folder.
export async function removeProjectImages(projectId: string): Promise<void> {
  try {
    const sb = supabaseAdmin();
    const { data } = await sb.storage.from(SLIDES_BUCKET).list(projectId, {
      limit: 1000,
    });
    if (data?.length) {
      await sb.storage
        .from(SLIDES_BUCKET)
        .remove(data.map((f) => `${projectId}/${f.name}`));
    }
  } catch {
    /* best effort */
  }
}
