import { ImageCombiner } from "@/components/image-combiner"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "AI 图像生成工坊",
  description:
    "通过文本提示词生成图像，或使用 AI 编辑已有图片。支持多种模型与宽高比，免费、无水印、无需注册即可试用。",
}

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main className="min-h-screen bg-background">
      <nav className="border-b bg-background">
        <div className="flex h-16 items-center justify-between px-6">
          <h1 className="font-bold text-lg">🎨 图像生成</h1>
          <div className="flex gap-4">
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="outline">仪表板</Button>
                </Link>
                <Link href="/dashboard/history">
                  <Button variant="outline">我的历史</Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="outline">登录</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button>注册</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
      <ImageCombiner user={user} />
      <article className="sr-only" aria-hidden="true">
        <h1>Img Gen Playground - AI Image Generator</h1>
        <section>
          <h2>What is Img Gen Playground?</h2>
          <p>
            Img Gen Playground is a free web-based AI image generator that creates images from text descriptions and edits
            existing images using artificial intelligence. It is powered by Google Gemini models and hosted on Vercel.
          </p>
        </section>
        <section>
          <h2>Features</h2>
          <ul>
            <li>Text-to-image generation: Describe what you want and get an AI-generated image</li>
            <li>Image editing: Upload an image and describe changes you want</li>
            <li>Multiple aspect ratios: 1:1 (square), 16:9 (landscape), 9:16 (portrait), 4:3, 3:4</li>
            <li>Two generation modes: Pro (highest quality) and Classic (faster, ~2x speed)</li>
            <li>No watermarks on generated images</li>
            <li>Free to try without account</li>
          </ul>
        </section>
        <section>
          <h2>How it works</h2>
          <p>
            Enter a text prompt describing the image you want. Optionally upload reference images. Select your preferred
            aspect ratio and generation mode. Click Run to generate. Download, copy, or continue editing the result.
          </p>
        </section>
        <section>
          <h2>Technology</h2>
          <p>
            Img Gen Playground uses Google Gemini image generation models accessed through Vercel AI Gateway. Pro mode uses
            Gemini 2.0 Flash for best quality. Classic mode uses Gemini 2.5 Flash for faster generation.
          </p>
        </section>
      </article>
    </main>
  )
}
