export interface Category {
  id: string
  name: string
  icon: string
  gradient: string
  formats: string[]
  description: string
  acceptTypes?: string
}

export const categories: Category[] = [
  {
    id: 'image',
    name: 'Изображения',
    icon: '🖼️',
    gradient: 'from-purple-600 to-pink-600',
    formats: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tiff', 'ico', 'avif'],
    description: 'Конвертируйте изображения в любой формат',
    acceptTypes: 'image/*'
  },
  {
    id: 'audio',
    name: 'Аудио',
    icon: '🎵',
    gradient: 'from-pink-600 to-rose-600',
    formats: ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac', 'opus', 'wma'],
    description: 'Конвертируйте аудио в любой формат',
    acceptTypes: 'audio/*'
  },
  {
    id: 'video',
    name: 'Видео',
    icon: '🎬',
    gradient: 'from-blue-600 to-cyan-600',
    formats: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv', 'mpeg'],
    description: 'Конвертируйте видео в любой формат',
    acceptTypes: 'video/*'
  },
  {
    id: 'model3d',
    name: '3D-модели',
    icon: '🎲',
    gradient: 'from-indigo-600 to-violet-600',
    formats: ['obj', 'gltf', 'glb', 'stl'],
    description: 'Конвертируйте 3D модели в любой формат',
    acceptTypes: '.obj,.gltf,.glb,.stl'
  },
  {
    id: 'subtitle',
    name: 'Субтитры',
    icon: '💬',
    gradient: 'from-sky-600 to-blue-600',
    formats: ['srt', 'vtt', 'ass', 'txt'],
    description: 'Конвертируйте субтитры в любой формат',
    acceptTypes: '.srt,.vtt,.ass,.txt'
  }
]