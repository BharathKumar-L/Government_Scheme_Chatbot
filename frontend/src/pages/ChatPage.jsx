import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Send, Mic, MicOff, Volume2, VolumeX, Bot, User } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent } from '../components/ui/card'
import LoadingSpinner from '../components/LoadingSpinner'
import { chatAPI } from '../services/api'
import toast from 'react-hot-toast'

const ChatPage = () => {
  const { t } = useTranslation()
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  
  const messagesEndRef = useRef(null)
  const recognitionRef = useRef(null)
  const synthesisRef = useRef(null)

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setInputMessage(transcript)
        setIsRecording(false)
      }

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsRecording(false)
        toast.error('Speech recognition failed. Please try again.')
      }

      recognitionRef.current.onend = () => {
        setIsRecording(false)
      }
    }

    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      synthesisRef.current = window.speechSynthesis
    }

    // Add welcome message
    setMessages([{
      id: Date.now(),
      type: 'bot',
      content: t('chat.welcome'),
      timestamp: new Date().toISOString()
    }])

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (synthesisRef.current) {
        synthesisRef.current.cancel()
      }
    }
  }, [t])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await chatAPI.sendMessage({
        message: inputMessage,
        sessionId,
        language: 'en' // Will be updated based on user's language preference
      })

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: response.response,
        relevantSchemes: response.relevantSchemes,
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, botMessage])
      
      // Speak the response
      speakText(response.response)
      
    } catch (error) {
      console.error('Chat error:', error)
      toast.error('Failed to get response. Please try again.')
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: t('chat.error'),
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const startRecording = () => {
    if (recognitionRef.current && !isRecording) {
      setIsRecording(true)
      recognitionRef.current.start()
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
    }
  }

  const speakText = (text) => {
    if (synthesisRef.current && !isSpeaking) {
      synthesisRef.current.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 0.8

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      synthesisRef.current.speak(utterance)
    }
  }

  const stopSpeaking = () => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel()
      setIsSpeaking(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {t('chat.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('chat.subtitle')}
        </p>
      </div>

      {/* Chat Messages */}
      <Card className="h-[600px] flex flex-col">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} message-enter`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.type === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.type === 'bot' && (
                    <Bot className="h-4 w-4 mt-1 flex-shrink-0" />
                  )}
                  {message.type === 'user' && (
                    <User className="h-4 w-4 mt-1 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.relevantSchemes && message.relevantSchemes.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/20">
                        <p className="text-xs font-medium mb-1">Related Schemes:</p>
                        <div className="space-y-1">
                          {message.relevantSchemes.map((scheme, index) => (
                            <div key={index} className="text-xs opacity-80">
                              • {scheme.name} ({scheme.category})
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted text-muted-foreground rounded-lg px-4 py-2 flex items-center space-x-2">
                <Bot className="h-4 w-4" />
                <LoadingSpinner size="sm" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Chat Input */}
        <div className="border-t p-4">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('chat.inputPlaceholder')}
                disabled={isLoading}
                className="pr-20"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                {isRecording ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={stopRecording}
                    className="h-6 w-6 p-0"
                  >
                    <MicOff className="h-3 w-3" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={startRecording}
                    disabled={!recognitionRef.current}
                    className="h-6 w-6 p-0"
                  >
                    <Mic className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-6"
            >
              <Send className="h-4 w-4" />
            </Button>
            
            {isSpeaking ? (
              <Button
                variant="outline"
                onClick={stopSpeaking}
                className="px-3"
              >
                <VolumeX className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  const lastBotMessage = messages.filter(m => m.type === 'bot').pop()
                  if (lastBotMessage) {
                    speakText(lastBotMessage.content)
                  }
                }}
                disabled={!messages.some(m => m.type === 'bot')}
                className="px-3"
              >
                <Volume2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span>{t('chat.voiceInput')}</span>
              <span>{t('chat.voiceOutput')}</span>
            </div>
            <span>{t('chat.sessionId')}: {sessionId.slice(-8)}</span>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default ChatPage
