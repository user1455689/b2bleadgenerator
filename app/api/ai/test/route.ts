import { NextRequest, NextResponse } from "next/server";
import { testAIConnection } from "@/lib/gemini";
import { AIProvider } from "@/types/lead";

export async function POST(req: NextRequest) {
  try {
    const { provider, apiKey, model } = await req.json();

    if (!provider) {
      return NextResponse.json({ error: "Provider is required" }, { status: 400 });
    }

    const effectiveKey =
      apiKey ||
      (provider === "gemini" ? process.env.GEMINI_API_KEY : undefined) ||
      (provider === "openai" ? process.env.OPENAI_API_KEY : undefined) ||
      (provider === "claude" ? process.env.ANTHROPIC_API_KEY : undefined) ||
      (provider === "groq" ? process.env.GROQ_API_KEY : undefined) ||
      "";

    if (!effectiveKey && provider !== "ollama") {
      return NextResponse.json(
        {
          error: `No API key provided for ${provider}. Please enter a valid API key or configure it in superadmin/.env.local`,
        },
        { status: 400 }
      );
    }

    const result = await testAIConnection(
      provider as AIProvider,
      effectiveKey,
      model
    );

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to connect to AI provider",
      },
      { status: 500 }
    );
  }
}

