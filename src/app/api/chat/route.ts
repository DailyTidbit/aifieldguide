import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

// DEBUG: log the key presence (for dev only — remove in prod!)
const apiKey = process.env.OPENAI_API_KEY;

// Check that we have the API key
if (!apiKey) {
  throw new Error("❌ OPENAI_API_KEY is not set in environment variables");
}

const openai = new OpenAI({ apiKey });

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
    });

    const assistant = chatResponse.choices[0]?.message?.content;

    return NextResponse.json({ assistant });
  } catch (error) {
    console.error("❌ Chat API Error:", error);
    return NextResponse.json(
      { error: "Something went wrong with OpenAI request." },
      { status: 500 }
    );
  }
}

