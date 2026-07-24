import { NextResponse } from "next/server";
import { removeProjectImages, supabaseAdmin } from "@/lib/supabase";
import type { Meta, Slide } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const { data, error } = await supabaseAdmin()
      .from("projects")
      .select("id,title,meta,slides,updated_at")
      .eq("id", id)
      .single();
    if (error) throw new Error(error.message);
    return NextResponse.json({
      id: data.id,
      title: data.title,
      meta: data.meta,
      slides: data.slides,
      updatedAt: data.updated_at,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const body = (await req.json()) as {
      title?: string;
      meta?: Meta;
      slides?: Slide[];
    };
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.title !== undefined) patch.title = body.title;
    if (body.meta !== undefined) patch.meta = body.meta;
    if (body.slides !== undefined) patch.slides = body.slides;
    const { error } = await supabaseAdmin().from("projects").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const { error } = await supabaseAdmin().from("projects").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await removeProjectImages(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
