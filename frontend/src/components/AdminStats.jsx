import React from 'react'
import { X, BarChart3, Users, FileText, TrendingUp } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'

function AdminStats({ stats, onClose }) {
  if (!stats) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">System Statistics</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                  <TrendingUp className="w-8 h-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Recent Activity</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.recentActivity?.length || 0}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Categories */}
            {stats.categories && stats.categories.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {stats.categories.map((category, index) => (
                    <div
                      key={index}
                      className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center"
                    >
                      <span className="text-sm font-medium text-blue-800">{category}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            {stats.recentActivity && stats.recentActivity.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent User Queries</h3>
                <div className="space-y-3">
                  {stats.recentActivity.map((activity, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 font-medium">
                            {activity.query}
                          </p>
                          <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                            <span>Language: {activity.language}</span>
                            <span>
                              {new Date(activity.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* System Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
              <Card className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Database Status:</span>
                    <span className="ml-2 text-green-600">Active</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Last Updated:</span>
                    <span className="ml-2">{new Date().toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Version:</span>
                    <span className="ml-2">1.0.0</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Environment:</span>
                    <span className="ml-2">{import.meta.env.MODE || 'development'}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t mt-6">
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default AdminStats
