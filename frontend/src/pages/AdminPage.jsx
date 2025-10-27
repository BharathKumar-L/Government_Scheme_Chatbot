import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  Plus, 
  Upload, 
  Settings, 
  LogOut, 
  BarChart3, 
  FileText, 
  Users, 
  Search,
  Edit,
  Trash2,
  Eye,
  Shield
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card } from '../components/ui/card'
import { adminAPI } from '../services/api'
import toast from 'react-hot-toast'
import AdminSchemeForm from '../components/AdminSchemeForm'
import AdminStats from '../components/AdminStats'

function AdminPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [schemes, setSchemes] = useState([])
  const [stats, setStats] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingScheme, setEditingScheme] = useState(null)
  const [showStats, setShowStats] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      await adminAPI.verifySession()
      setIsAuthenticated(true)
      loadData()
    } catch (error) {
      navigate('/admin/login')
    } finally {
      setIsLoading(false)
    }
  }

  const loadData = async () => {
    try {
      const [schemesResponse, statsResponse] = await Promise.all([
        adminAPI.getSchemes(),
        adminAPI.getStats()
      ])
      
      setSchemes(schemesResponse.data.schemes || [])
      setStats(statsResponse.data)
    } catch (error) {
      toast.error('Failed to load data')
    }
  }

  const handleLogout = async () => {
    try {
      await adminAPI.logout()
      localStorage.removeItem('admin-session')
      navigate('/admin/login')
    } catch (error) {
      toast.error('Logout failed')
    }
  }

  const handleDeleteScheme = async (id) => {
    if (!window.confirm('Are you sure you want to delete this scheme?')) {
      return
    }

    try {
      await adminAPI.deleteScheme(id)
      toast.success('Scheme deleted successfully')
      loadData()
    } catch (error) {
      toast.error('Failed to delete scheme')
    }
  }

  const handleAddScheme = async (schemeData) => {
    try {
      await adminAPI.addScheme(schemeData)
      toast.success('Scheme added successfully')
      setShowAddForm(false)
      loadData()
    } catch (error) {
      toast.error('Failed to add scheme')
    }
  }

  const handleUpdateScheme = async (id, schemeData) => {
    try {
      await adminAPI.updateScheme(id, schemeData)
      toast.success('Scheme updated successfully')
      setEditingScheme(null)
      loadData()
    } catch (error) {
      toast.error('Failed to update scheme')
    }
  }

  const filteredSchemes = schemes.filter(scheme =>
    scheme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    scheme.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setShowStats(!showStats)}
                className="flex items-center"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Stats
              </Button>
              
              <Button
                variant="outline"
                onClick={handleLogout}
                className="flex items-center"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Schemes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalSchemes}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Queries</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalQueries}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center">
                <BarChart3 className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Categories</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.categories?.length || 0}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center">
                <Search className="w-8 h-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Recent Activity</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.recentActivity?.length || 0}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search schemes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button
              onClick={() => setShowAddForm(true)}
              className="flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Scheme
            </Button>
            
            <Button
              variant="outline"
              onClick={() => document.getElementById('file-upload').click()}
              className="flex items-center"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Dataset
            </Button>
            
            <input
              id="file-upload"
              type="file"
              accept=".json,.csv"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files[0]
                if (file) {
                  try {
                    const response = await adminAPI.uploadDataset(file)
                    toast.success(`Dataset uploaded successfully! Added ${response.data.records} schemes.`)
                    loadData() // Refresh the data to show new schemes
                  } catch (error) {
                    toast.error(error.message || 'Failed to upload dataset')
                  }
                }
                // Reset file input
                e.target.value = ''
              }}
            />
          </div>
        </div>

        {/* Schemes Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSchemes.map((scheme) => (
                  <tr key={scheme.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {scheme.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {scheme.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {scheme.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(scheme.lastUpdated).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingScheme(scheme)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteScheme(scheme.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredSchemes.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? 'No schemes found matching your search.' : 'No schemes available.'}
              </div>
            )}
          </div>
        </Card>

        {/* Modals */}
        {showAddForm && (
          <AdminSchemeForm
            onClose={() => setShowAddForm(false)}
            onSubmit={handleAddScheme}
          />
        )}

        {editingScheme && (
          <AdminSchemeForm
            scheme={editingScheme}
            onClose={() => setEditingScheme(null)}
            onSubmit={(data) => handleUpdateScheme(editingScheme.id, data)}
          />
        )}

        {showStats && (
          <AdminStats
            stats={stats}
            onClose={() => setShowStats(false)}
          />
        )}
      </div>
    </div>
  )
}

export default AdminPage
