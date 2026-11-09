import { useEffect } from 'react'

// Título de pestaña por página ("La carta · Casa Tere · Playa Honda").
// Al salir de la página se restaura el de la portada (el de index.html).
export function useTitulo(titulo) {
  useEffect(() => {
    if (!titulo) return
    const previo = document.title
    document.title = `${titulo} · Casa Tere · Playa Honda`
    return () => { document.title = previo }
  }, [titulo])
}
