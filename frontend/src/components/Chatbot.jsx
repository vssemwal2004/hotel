import React from 'react'
import { MessageCircle } from 'lucide-react'

// Chatbot floating action button (placeholder for Dialogflow integration)
export default function Chatbot(){
  return (
    <div className="fixed bottom-6 right-6">
      <button className="bg-primary text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center">
        <MessageCircle size={20} />
      </button>
    </div>
  )
}
