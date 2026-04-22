import { useState, useEffect } from 'react'

function App() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className={`relative max-w-4xl w-full text-center transition-all duration-1000 ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}>
        {/* Logo */}
        <div className="mb-12 flex justify-center">
          <div className="w-[480px] h-[480px] md:w-[576px] md:h-[576px]">
            <img 
              src="/logo.jpeg" 
              alt="Thiago Forman Logo" 
              className="w-full h-full object-contain"
            />
          </div>
        </div>

     

        {/* Coming soon message */}
        <div className="mb-12">
          <div className="inline-block bg-gradient-to-r from-amber-500/20 to-yellow-500/20 backdrop-blur-sm rounded-full px-8 py-4 border border-amber-500/30">
            <p className="text-lg md:text-xl text-amber-200 font-medium">
              🔜 Em breve, novidades incríveis!
            </p>
          </div>
        </div>

        {/* Social media */}
        <div className="flex justify-center items-center gap-4">
          <a
            href="https://instagram.com/thiagoforman"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-8 py-4 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl"
          >
            <svg 
              className="w-6 h-6 transition-transform group-hover:rotate-12" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            <span className="text-lg">@thiagoforman</span>
          </a>
        </div>

        {/* Footer text */}
        <p className="mt-16 text-gray-500 text-sm">
          Estamos preparando algo especial para você
        </p>
      </div>
    </div>
  )
}

export default App
