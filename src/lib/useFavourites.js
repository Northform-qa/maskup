import { useState, useEffect } from 'react'
import { supabase } from './supabase'

export function useFavourites(user) {
  const [favourites, setFavourites] = useState(new Set())

  // Load from DB whenever the logged-in user changes
  useEffect(() => {
    if (!user) return
    supabase
      .from('favourites')
      .select('field_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) setFavourites(new Set(data.map((r) => r.field_id)))
      })
  }, [user])

  async function toggleFavourite(e, fieldId) {
    e.stopPropagation()
    const isFav = favourites.has(fieldId)

    // Optimistic update — instant UI feedback
    setFavourites((prev) => {
      const next = new Set(prev)
      isFav ? next.delete(fieldId) : next.add(fieldId)
      return next
    })

    // Persist to DB if logged in; otherwise stays local for the session
    if (!user) return
    if (isFav) {
      await supabase.from('favourites').delete().eq('user_id', user.id).eq('field_id', fieldId)
    } else {
      await supabase.from('favourites').insert({ user_id: user.id, field_id: fieldId })
    }
  }

  return { favourites, toggleFavourite }
}
