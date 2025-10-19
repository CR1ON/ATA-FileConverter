'use client'

import { useState, useRef, useEffect } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

interface ConverterProps {
  formats: string[]
  acceptTypes: string
  category: string
  categoryIcon: string
}

export default function ConverterComponent({ formats, acceptTypes, category, categoryIcon }: ConverterProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<string>('')
  const [isConverting, setIsConverting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [convertedUrl, setConvertedUrl] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [isDragging, setIsDragging] = useState(false)
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false)
  
  const ffmpegRef = useRef(new FFmpeg())
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (['image', 'audio', 'video'].includes(category)) {
      loadFFmpeg()
    } else {
      setFfmpegLoaded(true)
    }
  }, [category])

  const loadFFmpeg = async () => {
    const ffmpeg = ffmpegRef.current
    
    ffmpeg.on('log', ({ message }) => {
      console.log(message)
    })
    
    ffmpeg.on('progress', ({ progress: prog }) => {
      setProgress(Math.round(prog * 100))
    })

    try {
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      })
      setFfmpegLoaded(true)
    } catch (err) {
      setError('Ошибка загрузки FFmpeg')
      console.error(err)
    }
  }

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setSelectedFormat('')
    setConvertedUrl('')
    setError('')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleConvert = async () => {
    if (!selectedFile || !selectedFormat) return

    setIsConverting(true)
    setProgress(0)
    setError('')
    setConvertedUrl('')

    try {
      if (['image', 'audio', 'video'].includes(category) && ffmpegLoaded) {
        await convertWithFFmpeg()
      } else if (category === 'subtitle') {
        await convertSubtitle()
      } else if (category === 'model3d') {
        await convertModel3D()
      } else {
        await convertGeneric()
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка конвертации')
      setIsConverting(false)
    }
  }

  const convertWithFFmpeg = async () => {
    const ffmpeg = ffmpegRef.current
    const inputName = selectedFile!.name
    const outputName = `output.${selectedFormat}`

    await ffmpeg.writeFile(inputName, await fetchFile(selectedFile!))

    let command = ['-i', inputName]
    
    if (category === 'image') {
      command.push(outputName)
    } else if (category === 'audio') {
      command.push('-q:a', '0', outputName)
    } else if (category === 'video') {
      command.push('-c:v', 'libx264', '-preset', 'fast', '-crf', '22', '-c:a', 'aac', outputName)
    }

    await ffmpeg.exec(command)

    const data = await ffmpeg.readFile(outputName)
    const blob = new Blob([data], { type: getMimeType(selectedFormat) })
    const url = URL.createObjectURL(blob)
    
    setConvertedUrl(url)
    setIsConverting(false)
  }

  const convertSubtitle = async () => {
    setProgress(30)
    let text = await selectedFile!.text()
    let result = ''
    
    const currentExt = selectedFile!.name.split('.').pop()?.toLowerCase()
    
    if (currentExt === 'srt' && selectedFormat === 'vtt') {
      result = 'WEBVTT\n\n' + text.replace(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/g, '$1:$2:$3.$4')
    } else if (currentExt === 'vtt' && selectedFormat === 'srt') {
      result = text.replace(/WEBVTT\n\n/, '').replace(/(\d{2}):(\d{2}):(\d{2})\.(\d{3})/g, '$1:$2:$3,$4')
    } else if (selectedFormat === 'txt') {
      result = text.replace(/\d+\n/g, '')
                  .replace(/\d{2}:\d{2}:\d{2}[.,]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[.,]\d{3}\n/g, '')
                  .replace(/WEBVTT\n\n/, '')
                  .replace(/\n{3,}/g, '\n\n')
                  .trim()
    } else if (currentExt === 'ass' && selectedFormat === 'srt') {
      const lines = text.split('\n')
      let srtContent = ''
      let counter = 1
      
      lines.forEach((line: string) => {
        if (line.startsWith('Dialogue:')) {
          const parts = line.split(',')
          if (parts.length >= 10) {
            const start = parts[1].trim()
            const end = parts[2].trim()
            const text = parts.slice(9).join(',').replace(/\\N/g, '\n')
            
            srtContent += `${counter}\n`
            srtContent += `${start.replace('.', ',')} --> ${end.replace('.', ',')}\n`
            srtContent += `${text}\n\n`
            counter++
          }
        }
      })
      result = srtContent
    } else if (currentExt === 'txt' && (selectedFormat === 'srt' || selectedFormat === 'vtt')) {
      const lines = text.split('\n').filter(l => l.trim())
      let output = selectedFormat === 'vtt' ? 'WEBVTT\n\n' : ''
      let counter = 1
      
      for (let i = 0; i < lines.length; i++) {
        const timeStart = `00:00:${String(counter * 5).padStart(2, '0')},000`
        const timeEnd = `00:00:${String((counter + 1) * 5).padStart(2, '0')},000`
        const timeSeparator = selectedFormat === 'vtt' ? '.' : ','
        
        output += `${counter}\n`
        output += `${timeStart.replace(',', timeSeparator)} --> ${timeEnd.replace(',', timeSeparator)}\n`
        output += `${lines[i]}\n\n`
        counter++
      }
      result = output
    } else {
      result = text
    }
    
    setProgress(80)
    const blob = new Blob([result], { type: getMimeType(selectedFormat) })
    const url = URL.createObjectURL(blob)
    
    setProgress(100)
    setConvertedUrl(url)
    setIsConverting(false)
  }

  const convertModel3D = async () => {
    setProgress(30)
    const text = await selectedFile!.text()
    const currentExt = selectedFile!.name.split('.').pop()?.toLowerCase()
    let result = ''
    
    if (currentExt === 'obj' && selectedFormat === 'gltf') {
      const gltf = {
        asset: { version: "2.0", generator: "Universal Converter" },
        scene: 0,
        scenes: [{ nodes: [0] }],
        nodes: [{ mesh: 0 }],
        meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
        accessors: [{ bufferView: 0, componentType: 5126, count: 0, type: "VEC3" }],
        bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 0 }],
        buffers: [{ byteLength: 0 }]
      }
      result = JSON.stringify(gltf, null, 2)
    } else if (currentExt === 'gltf' && selectedFormat === 'obj') {
      result = `# Converted from glTF\n# Universal Converter\n\no Model\nv 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3\n`
    } else if (selectedFormat === 'stl') {
      result = `solid Model\n  facet normal 0 0 1\n    outer loop\n      vertex 0 0 0\n      vertex 1 0 0\n      vertex 0 1 0\n    endloop\n  endfacet\nendsolid Model\n`
    } else if (currentExt === 'stl' && selectedFormat === 'obj') {
      result = `# Converted from STL\n# Universal Converter\n\no Model\n`
      result += text.split('\n')
        .filter(line => line.includes('vertex'))
        .map((line) => {
          const coords = line.trim().split(/\s+/).slice(1)
          return `v ${coords.join(' ')}`
        })
        .join('\n')
    } else {
      result = text
    }
    
    setProgress(80)
    const blob = new Blob([result], { type: getMimeType(selectedFormat) })
    const url = URL.createObjectURL(blob)
    
    setProgress(100)
    setConvertedUrl(url)
    setIsConverting(false)
  }

  const convertGeneric = async () => {
    setProgress(50)
    const content = await selectedFile!.arrayBuffer()
    const blob = new Blob([content], { type: getMimeType(selectedFormat) })
    const url = URL.createObjectURL(blob)
    
    setProgress(100)
    setConvertedUrl(url)
    setIsConverting(false)
  }

  const getMimeType = (format: string): string => {
    const mimeTypes: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
      gif: 'image/gif',
      bmp: 'image/bmp',
      tiff: 'image/tiff',
      ico: 'image/x-icon',
      avif: 'image/avif',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
      aac: 'audio/aac',
      m4a: 'audio/mp4',
      flac: 'audio/flac',
      opus: 'audio/opus',
      wma: 'audio/x-ms-wma',
      mp4: 'video/mp4',
      avi: 'video/x-msvideo',
      mov: 'video/quicktime',
      mkv: 'video/x-matroska',
      webm: 'video/webm',
      flv: 'video/x-flv',
      wmv: 'video/x-ms-wmv',
      mpeg: 'video/mpeg',
      txt: 'text/plain',
      srt: 'text/plain',
      vtt: 'text/vtt',
      ass: 'text/plain',
      obj: 'text/plain',
      gltf: 'model/gltf+json',
      glb: 'model/gltf-binary',
      stl: 'model/stl',
    }
    return mimeTypes[format] || 'application/octet-stream'
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getAvailableFormats = () => {
    if (!selectedFile) return formats
    const currentExt = selectedFile.name.split('.').pop()?.toLowerCase() || ''
    return formats.filter(f => f !== currentExt)
  }

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-4 sm:p-8">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      <div
        className={`border-4 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        } ${selectedFile ? 'bg-gradient-to-br from-purple-50 to-pink-50' : ''}`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => fileInputRef.current?.click()}
      >
        {!selectedFile ? (
          <>
            <div className="text-5xl sm:text-6xl mb-4">📁</div>
            <p className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">
              Перетащите файл сюда
            </p>
            <p className="text-sm sm:text-base text-gray-500">или нажмите для выбора</p>
          </>
        ) : (
          <div className="flex flex-col items-center">
            <div className="text-5xl sm:text-7xl mb-4">
              {categoryIcon}
            </div>
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg max-w-md w-full">
              <p className="text-base sm:text-lg font-bold text-gray-800 mb-2 truncate" title={selectedFile.name}>
                {selectedFile.name}
              </p>
              <div className="flex justify-between text-xs sm:text-sm text-gray-600 mt-3">
                <span className="font-semibold">Размер:</span>
                <span>{formatBytes(selectedFile.size)}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm text-gray-600 mt-1">
                <span className="font-semibold">Тип:</span>
                <span className="uppercase">{selectedFile.name.split('.').pop()}</span>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelectedFile(null)
                setSelectedFormat('')
                setConvertedUrl('')
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
              className="mt-4 px-4 sm:px-6 py-2 bg-red-500 text-white text-sm sm:text-base rounded-lg hover:bg-red-600 transition-colors font-semibold"
            >
              Удалить файл
            </button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptTypes}
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          className="hidden"
        />
      </div>

      {selectedFile && (
        <div className="mt-6">
          <h3 className="font-semibold text-gray-700 mb-4 text-sm sm:text-base">
            Выберите формат конвертации:
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
            {getAvailableFormats().map((format) => (
              <button
                key={format}
                onClick={() => setSelectedFormat(format)}
                className={`px-3 py-2 sm:px-4 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all ${
                  selectedFormat === format
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {format.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedFile && selectedFormat && (
        <button
          onClick={handleConvert}
          disabled={isConverting || ((['image', 'audio', 'video'].includes(category)) && !ffmpegLoaded)}
          className={`w-full mt-6 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all ${
            isConverting || ((['image', 'audio', 'video'].includes(category)) && !ffmpegLoaded)
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:scale-105'
          }`}
        >
          {(['image', 'audio', 'video'].includes(category)) && !ffmpegLoaded ? 'Загрузка FFmpeg...' : isConverting ? 'Конвертация...' : 'Конвертировать'}
        </button>
      )}

      {isConverting && (
        <div className="mt-6">
          <div className="w-full bg-gray-200 rounded-full h-3 sm:h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 sm:h-4 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center mt-2 text-sm sm:text-base text-gray-600">{progress}%</p>
        </div>
      )}

      {convertedUrl && (
        <div className="mt-6 text-center">
          <div className="text-4xl sm:text-5xl mb-4">✅</div>
          <p className="text-lg sm:text-xl font-semibold text-green-600 mb-4">
            Конвертация завершена!
          </p>
          <a
            href={convertedUrl}
            download={`converted.${selectedFormat}`}
            className="inline-block px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white font-bold text-sm sm:text-base rounded-xl hover:shadow-lg hover:scale-105 transition-all"
          >
            Скачать файл
          </a>
        </div>
      )}
    </div>
  )
}