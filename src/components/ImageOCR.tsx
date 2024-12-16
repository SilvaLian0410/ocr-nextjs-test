'use client'

import { useState, useEffect, useRef } from 'react'
import { createWorker } from 'tesseract.js'
import { Button } from "@/components/ui/button"

interface ImageOCRProps {
  image: File
}

interface DetectedWord {
  text: string
  bbox: {
    x0: number
    y0: number
    x1: number
    y1: number
  }
}

export default function ImageOCR({ image }: ImageOCRProps) {
  const [ocrResult, setOcrResult] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const processImage = async () => {
    setIsProcessing(true)
    const worker = await createWorker('eng')

    try {
      const { data } = await worker.recognize(image)
      setOcrResult(data.text)
      drawDetectedWords(data.words)
    } catch (error) {
      console.error('OCR Error:', error)
      setOcrResult('Error processing image')
    } finally {
      setIsProcessing(false)
      await worker.terminate()
    }
  }

  const drawDetectedWords = (words: DetectedWord[]) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0, img.width, img.height)

      ctx.strokeStyle = 'red'
      ctx.lineWidth = 2

      words.forEach((word) => {
        const { x0, y0, x1, y1 } = word.bbox
        ctx.strokeRect(x0, y0, x1 - x0, y1 - y0)
      })
    }
    img.src = URL.createObjectURL(image)
  }

  useEffect(() => {
    return () => {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d')
        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
    }
  }, [image])

  return (
    <div className="space-y-4">
      <Button onClick={processImage} disabled={isProcessing}>
        {isProcessing ? 'Processing...' : 'Detect Text'}
      </Button>
      {ocrResult && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Detected Text:</h3>
          <p className="whitespace-pre-wrap">{ocrResult}</p>
        </div>
      )}
      <canvas ref={canvasRef} className="max-w-full h-auto border border-gray-300" />
    </div>
  )
}

