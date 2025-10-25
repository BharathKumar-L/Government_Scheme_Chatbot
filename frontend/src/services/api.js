import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth-token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    console.error('API Error:', error)
    
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || error.response.data?.error || 'An error occurred'
      throw new Error(message)
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network error. Please check your connection.')
    } else {
      // Something else happened
      throw new Error('An unexpected error occurred')
    }
  }
)

// Chat API
export const chatAPI = {
  sendMessage: async (data) => {
    return await api.post('/chat', data)
  },
  
  getHistory: async (sessionId, limit = 20) => {
    return await api.get('/chat/history', {
      params: { sessionId, limit }
    })
  },
  
  submitFeedback: async (data) => {
    return await api.post('/chat/feedback', data)
  }
}

// Schemes API
export const schemesAPI = {
  getAllSchemes: async (params = {}) => {
    return await api.get('/schemes', { params })
  },
  
  getSchemeById: async (id, language = 'en') => {
    return await api.get(`/schemes/${id}`, {
      params: { language }
    })
  },
  
  getCategories: async (language = 'en') => {
    return await api.get('/schemes/categories/list', {
      params: { language }
    })
  },
  
  getSchemesByCategory: async (category, params = {}) => {
    return await api.get(`/schemes/categories/${category}`, { params })
  },
  
  searchSchemes: async (query, params = {}) => {
    return await api.get('/schemes/search/suggestions', {
      params: { q: query, ...params }
    })
  },
  
  getStats: async () => {
    return await api.get('/schemes/stats')
  }
}

// Translation API
export const translationAPI = {
  translate: async (text, sourceLang, targetLang) => {
    return await api.post('/translate', {
      text,
      sourceLang,
      targetLang
    })
  },
  
  detectLanguage: async (text) => {
    return await api.post('/translate/detect', { text })
  },
  
  getSupportedLanguages: async () => {
    return await api.get('/translate/languages')
  },
  
  translateBatch: async (texts, sourceLang, targetLang) => {
    return await api.post('/translate/batch', {
      texts,
      sourceLang,
      targetLang
    })
  }
}

// Health check
export const healthAPI = {
  check: async () => {
    return await api.get('/health')
  }
}

export default api
