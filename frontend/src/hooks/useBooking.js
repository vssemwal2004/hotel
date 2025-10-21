import { useState } from 'react'

export default function useBooking(){
  const [cart, setCart] = useState([])
  const add = item => setCart(s=>[...s,item])
  const remove = id => setCart(s=>s.filter(i=>i.id!==id))
  return { cart, add, remove }
}
