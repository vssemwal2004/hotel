import { useState } from 'react'

export default function useChatbot(){
  const [open, setOpen] = useState(false)
  return { open, setOpen }
}
