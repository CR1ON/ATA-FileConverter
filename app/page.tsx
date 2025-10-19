import Link from 'next/link'
import Image from 'next/image'
import { categories } from '@/lib/categories'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 mt-8">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Image 
              src="/logo.png" 
              alt="ATA FileConvertor Logo" 
              width={80} 
              height={80}
              className="drop-shadow-2xl"
            />
            <h1 className="text-4xl sm:text-6xl font-bold text-white drop-shadow-lg">
            FileConvertor
            </h1>
          </div>
          <p className="text-lg sm:text-xl text-white/90 drop-shadow">
            Конвертируйте файлы между форматами быстро и безопасно
          </p>
          <p className="text-sm text-white/80 mt-2">
            Все операции выполняются локально в вашем браузере
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 max-w-5xl mx-auto">
          {categories.map((category) => (
            <Link key={category.id} href={`/${category.id}`}>
              <div className="group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:-translate-y-2">
                <div className="bg-white rounded-2xl p-6 shadow-2xl h-full">
                  <div className="text-5xl mb-4 text-center group-hover:scale-110 transition-transform">
                    {category.icon}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-3 text-center">
                    {category.name}
                  </h2>
                  <p className="text-gray-600 text-center text-sm mb-4 min-h-[40px]">
                    {category.description}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center mb-4">
                    {category.formats.slice(0, 4).map((format) => (
                      <span
                        key={format}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
                      >
                        {format.toUpperCase()}
                      </span>
                    ))}
                    {category.formats.length > 4 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                        +{category.formats.length - 4}
                      </span>
                    )}
                  </div>
                  <div className="text-center">
                    <span className={`inline-block px-4 py-2 bg-gradient-to-r ${category.gradient} text-white font-semibold text-sm rounded-xl group-hover:shadow-lg transition-shadow`}>
                      Конвертировать →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl max-w-5xl mx-auto">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">
            ✨ Почему наш конвертер?
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-white">
            <div className="text-center">
              <div className="text-4xl mb-3">🔒</div>
              <h4 className="font-semibold mb-2">Безопасность</h4>
              <p className="text-sm text-white/80">
                Файлы не покидают ваш браузер
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">⚡</div>
              <h4 className="font-semibold mb-2">Быстро</h4>
              <p className="text-sm text-white/80">
                Конвертация за секунды
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">💰</div>
              <h4 className="font-semibold mb-2">Бесплатно</h4>
              <p className="text-sm text-white/80">
                Без ограничений и платежей
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">🌐</div>
              <h4 className="font-semibold mb-2">Оффлайн</h4>
              <p className="text-sm text-white/80">
                Работает без интернета
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}