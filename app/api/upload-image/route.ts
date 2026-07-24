import { NextResponse } from "next/server";
import { uploadDataUrl } from "@/lib/supabase";

export const maxDuration = 60;

// Store a user-supplied (or migrated) data: URL in the slides bucket.
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      projectId?: string;
      slideId?: string;
      dataUrl?: string;
    };
    if (!body.projectId || !body.slideId || !body.dataUrl) {
      return NextResponse.json(
        { error: "projectId, slideId and dataUrl are required" },
        { status: 400 },
      );
    }
    const url = await uploadDataUrl(body.projectId, body.slideId, body.dataUrl);
    return NextResponse.json({ url });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
