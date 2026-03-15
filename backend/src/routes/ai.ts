import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { env } from "../env";
import OpenAI from "openai";
import { streamSSE } from "hono/streaming";

const aiRouter = new Hono();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

/**
 * POST /api/ai/chat
 * OpenAI text generation with gpt-5.2
 * Supports streaming and non-streaming responses
 */
aiRouter.post(
  "/chat",
  zValidator(
    "json",
    z.object({
      prompt: z.string().min(1, "Prompt is required"),
      stream: z.boolean().optional().default(false),
      model: z.string().optional().default("gpt-5.2"),
      temperature: z.number().min(0).max(2).optional(),
      maxTokens: z.number().positive().optional(),
    })
  ),
  async (c) => {
    const { prompt, stream, model, temperature, maxTokens } = c.req.valid("json");

    try {
      if (stream) {
        // Streaming response with SSE
        return streamSSE(c, async (stream) => {
          try {
            const completion = await openai.chat.completions.create({
              model,
              messages: [{ role: "user", content: prompt }],
              stream: true,
              temperature,
              max_tokens: maxTokens,
            });

            for await (const chunk of completion) {
              const content = chunk.choices[0]?.delta?.content || "";
              if (content) {
                await stream.writeSSE({
                  data: JSON.stringify({ text: content }),
                  event: "message",
                });
              }
            }

            await stream.writeSSE({
              data: JSON.stringify({ done: true }),
              event: "done",
            });
          } catch (error) {
            const message = error instanceof Error ? error.message : "Stream error";
            await stream.writeSSE({
              data: JSON.stringify({ error: message }),
              event: "error",
            });
          }
        });
      } else {
        // Non-streaming response
        const completion = await openai.chat.completions.create({
          model,
          messages: [{ role: "user", content: prompt }],
          stream: false,
          temperature,
          max_tokens: maxTokens,
        });

        const text = completion.choices[0]?.message?.content || "";
        return c.json({ data: { text } });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate text";
      return c.json(
        { error: { message, code: "AI_GENERATION_FAILED" } },
        500
      );
    }
  }
);

/**
 * POST /api/ai/image/generate
 * OpenAI image generation with gpt-image-1
 */
aiRouter.post(
  "/image/generate",
  zValidator(
    "json",
    z.object({
      prompt: z.string().min(1, "Prompt is required"),
      size: z.enum(["256x256", "512x512", "1024x1024", "1792x1024", "1024x1792"]).optional().default("1024x1024"),
      n: z.number().min(1).max(10).optional().default(1),
      quality: z.enum(["low", "medium", "high", "auto"]).optional().default("auto"),
    })
  ),
  async (c) => {
    const { prompt, size, n, quality } = c.req.valid("json");

    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt,
        n: 1, // dall-e-3 only supports n=1
        size,
      });

      if (!response.data || response.data.length === 0) {
        return c.json(
          { error: { message: "No image generated", code: "NO_IMAGE_GENERATED" } },
          500
        );
      }

      const url = response.data[0]?.url;
      if (!url) {
        return c.json(
          { error: { message: "No image URL returned", code: "NO_IMAGE_URL" } },
          500
        );
      }

      return c.json({ data: { url, images: response.data.map(img => img.url).filter(Boolean) as string[] } });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate image";
      return c.json(
        { error: { message, code: "IMAGE_GENERATION_FAILED" } },
        500
      );
    }
  }
);

/**
 * POST /api/ai/image/analyze
 * OpenAI vision analysis with gpt-5.2
 */
aiRouter.post(
  "/image/analyze",
  zValidator(
    "json",
    z.object({
      image: z.string().min(1, "Image data URL is required"),
      prompt: z.string().min(1, "Prompt is required"),
      model: z.string().optional().default("gpt-5.2"),
      maxTokens: z.number().positive().optional().default(300),
    })
  ),
  async (c) => {
    const { image, prompt, model, maxTokens } = c.req.valid("json");

    try {
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: image,
                },
              },
            ],
          },
        ],
        max_tokens: maxTokens,
      });

      const text = completion.choices[0]?.message?.content || "";
      return c.json({ data: { text } });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to analyze image";
      return c.json(
        { error: { message, code: "IMAGE_ANALYSIS_FAILED" } },
        500
      );
    }
  }
);

/**
 * POST /api/ai/audio/transcribe
 * OpenAI audio transcription with gpt-4o-transcribe
 */
aiRouter.post("/audio/transcribe", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return c.json(
        { error: { message: "No audio file provided", code: "MISSING_FILE" } },
        400
      );
    }

    // Validate file type
    const validTypes = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/m4a", "audio/webm"];
    if (!validTypes.includes(file.type)) {
      return c.json(
        { error: { message: "Invalid audio file type. Supported: mp3, wav, m4a, webm", code: "INVALID_FILE_TYPE" } },
        400
      );
    }

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: "gpt-4o-transcribe",
    });

    return c.json({ data: { text: transcription.text } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to transcribe audio";
    return c.json(
      { error: { message, code: "TRANSCRIPTION_FAILED" } },
      500
    );
  }
});

/**
 * POST /api/ai/audio/speech
 * OpenAI text-to-speech with tts-1
 */
aiRouter.post(
  "/audio/speech",
  zValidator(
    "json",
    z.object({
      text: z.string().min(1, "Text is required"),
      voice: z.enum(["alloy", "echo", "fable", "onyx", "nova", "shimmer"]).optional().default("alloy"),
      model: z.enum(["tts-1", "tts-1-hd"]).optional().default("tts-1"),
      speed: z.number().min(0.25).max(4.0).optional().default(1.0),
      format: z.enum(["mp3", "opus", "aac", "flac"]).optional().default("mp3"),
    })
  ),
  async (c) => {
    const { text, voice, model, speed, format } = c.req.valid("json");

    try {
      const mp3 = await openai.audio.speech.create({
        model,
        voice,
        input: text,
        speed,
        response_format: format,
      });

      const arrayBuffer = await mp3.arrayBuffer();

      // Set appropriate content type based on format
      const contentTypes: Record<string, string> = {
        mp3: "audio/mpeg",
        opus: "audio/opus",
        aac: "audio/aac",
        flac: "audio/flac",
      };

      return new Response(arrayBuffer, {
        headers: {
          "Content-Type": contentTypes[format] || "audio/mpeg",
          "Content-Length": arrayBuffer.byteLength.toString(),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate speech";
      return c.json(
        { error: { message, code: "SPEECH_GENERATION_FAILED" } },
        500
      );
    }
  }
);

export { aiRouter };
