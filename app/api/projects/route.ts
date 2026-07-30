import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import type { Meta, ProjectSummary, Slide } from "@/lib/types";

interface ProjectRow {
  id: string;
  title: string;
  meta: Meta;
  slides: Slide[];
  updated_at: string;
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin()
      .from("projects")
      .select("id,title,meta,slides,updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    const projects: ProjectSummary[] = (data as ProjectRow[]).map((row) => ({
      id: row.id,
      title: row.title,
      slideCount: row.slides?.length ?? 0,
      tone: row.meta?.tone ?? "",
      theme: row.meta?.theme,
      updatedAt: row.updated_at,
      coverSlide: row.slides?.[0] ?? null,
    }));
    return NextResponse.json({ projects });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      title?: string;
      meta?: Meta;
      slides?: Slide[];
    };
    const { data, error } = await supabaseAdmin()
      .from("projects")
      .insert({
        title: body.title || "Untitled carousel",
        meta: body.meta ?? {},
        slides: body.slides ?? [],
      })
      .select("id,title,meta,slides,updated_at")
      .single();
    if (error) throw new Error(error.message);
    const row = data as ProjectRow;
    return NextResponse.json({
      id: row.id,
      title: row.title,
      meta: row.meta,
      slides: row.slides,
      updatedAt: row.updated_at,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
