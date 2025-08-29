// const API_BASE_URL = 'http://localhost:3001'

// export const api = {
//   async request(endpoint: string, options: RequestInit = {}) {
//     const url = `${API_BASE_URL}${endpoint}`
    
//     const config: RequestInit = {
//       headers: {
//         'Content-Type': 'application/json',
//         'Accept': 'application/json',
//         ...options.headers,
//       },
//       mode: 'cors',
//       credentials: 'include',
//       ...options,
//     }

//     try {
//       const response = await fetch(url, config)
//       return response
//     } catch (error) {
//       console.error(`API request failed for ${endpoint}:`, error)
//       throw error
//     }
//   },

//   async get(endpoint: string, token?: string) {
//     const headers: Record<string, string> = {}
//     if (token) {
//       headers['Authorization'] = `Bearer ${token}`
//     }
    
//     return this.request(endpoint, {
//       method: 'GET',
//       headers,
//     })
//   },

//   async post(endpoint: string, data: any, token?: string) {
//     const headers: Record<string, string> = {}
//     if (token) {
//       headers['Authorization'] = `Bearer ${token}`
//     }
    
//     return this.request(endpoint, {
//       method: 'POST',
//       headers,
//       body: JSON.stringify(data),
//     })
//   },

//   async put(endpoint: string, data: any, token?: string) {
//     const headers: Record<string, string> = {}
//     if (token) {
//       headers['Authorization'] = `Bearer ${token}`
//     }
    
//     return this.request(endpoint, {
//       method: 'PUT',
//       headers,
//       body: JSON.stringify(data),
//     })
//   },

//   async delete(endpoint: string, token?: string) {
//     const headers: Record<string, string> = {}
//     if (token) {
//       headers['Authorization'] = `Bearer ${token}`
//     }
    
//     return this.request(endpoint, {
//       method: 'DELETE',
//       headers,
//     })
//   },
// }
