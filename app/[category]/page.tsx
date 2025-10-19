'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import ConverterComponent from '@/components/ConverterComponent'
import { categories } from '@/lib/categories'

export default function CategoryPage() {
  const params = useParams()
  const categoryId = params.category as string
  const category = categories.find(c => c.id === categoryId)

  if (!category) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-600 p-8 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">Категория не найдена</h1>
          <Link href="/" className="text-white/90 hover:text-white underline">
            ← Вернуться на главную
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className={`min-h-screen bg-gradient-to-br ${category.gradient} p-4 sm:p-8`}>
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 mb-6 text-white hover:text-white/80 transition-colors">
          <Image 
            src="/logo.png" 
            alt="FileConvertor" 
            width={32} 
            height={32}
            className="drop-shadow-lg"
          />
          <span className="font-semibold">FileConvertor</span>
        </Link>
        
        <div className="text-center mb-8">
          <div className="text-6xl sm:text-7xl mb-4">{category.icon}</div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2">
            {category.name}
          </h1>
          <p className="text-white/90">
            {category.description}
          </p>
        </div>

        <ConverterComponent 
          formats={category.formats}
          acceptTypes={category.acceptTypes || '*/*'}
          category={category.id}
          categoryIcon={category.icon}
        />
      </div>
    </main>
  )
}