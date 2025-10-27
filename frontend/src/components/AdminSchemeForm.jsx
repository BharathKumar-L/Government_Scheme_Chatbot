import React, { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card } from './ui/card'
import { Select } from './ui/select'

function AdminSchemeForm({ scheme, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    details: '',
    category: '',
    level: 'Central',
    benefits: '',
    eligibility: '',
    application: '',
    documents: [],
    tags: []
  })

  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (scheme) {
      setFormData({
        ...scheme,
        documents: scheme.documents || [],
        tags: scheme.tags || []
      })
    }
  }, [scheme])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleArrayInputChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }))
  }

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }))
  }

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const handleTagsChange = (value) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag)
    setFormData(prev => ({
      ...prev,
      tags
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      // Clean up empty array items
      const cleanedData = {
        ...formData,
        documents: formData.documents.filter(item => item.trim()),
        tags: formData.tags.filter(tag => tag.trim())
      }

      await onSubmit(cleanedData)
      onClose()
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white p-6 rounded-lg shadow-xl">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {scheme ? 'Edit Scheme' : 'Add New Scheme'}
              </h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scheme Name *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter scheme name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug
                  </label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    placeholder="scheme-name-slug (auto-generated if empty)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <Input
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    placeholder="e.g., Agriculture, Employment"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Level *
                  </label>
                  <Select
                    value={formData.level}
                    onChange={(e) => handleInputChange('level', e.target.value)}
                    required
                  >
                    <option value="Central">Central</option>
                    <option value="State">State</option>
                    <option value="Local">Local</option>
                  </Select>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Scheme Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Details *
                </label>
                <textarea
                  className="w-full min-h-[100px] p-2 border rounded-md"
                  value={formData.details}
                  onChange={(e) => handleInputChange('details', e.target.value)}
                  placeholder="Enter scheme details"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Benefits *
                </label>
                <textarea
                  className="w-full min-h-[100px] p-2 border rounded-md"
                  value={formData.benefits}
                  onChange={(e) => handleInputChange('benefits', e.target.value)}
                  placeholder="Enter scheme benefits"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Eligibility *
                </label>
                <textarea
                  className="w-full min-h-[100px] p-2 border rounded-md"
                  value={formData.eligibility}
                  onChange={(e) => handleInputChange('eligibility', e.target.value)}
                  placeholder="Enter eligibility criteria"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Application Process *
                </label>
                <textarea
                  className="w-full min-h-[100px] p-2 border rounded-md"
                  value={formData.application}
                  onChange={(e) => handleInputChange('application', e.target.value)}
                  placeholder="Enter application process"
                  required
                />
              </div>
            </div>

            {/* Documents */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Required Documents</h3>
              
              {formData.documents.map((doc, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={doc}
                    onChange={(e) => handleArrayInputChange('documents', index, e.target.value)}
                    placeholder="Enter required document"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeArrayItem('documents', index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={() => addArrayItem('documents')}
              >
                Add Document
              </Button>
            </div>

            {/* Tags */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Tags</h3>
              
              <div>
                <Input
                  value={formData.tags.join(', ')}
                  onChange={(e) => handleTagsChange(e.target.value)}
                  placeholder="Enter tags (comma-separated)"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Separate tags with commas
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Scheme
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default AdminSchemeForm