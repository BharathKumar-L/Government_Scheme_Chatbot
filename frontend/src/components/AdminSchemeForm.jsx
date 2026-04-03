import React, { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card } from './ui/card'

function AdminSchemeForm({ scheme, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    details: '',
    category: '',
    level: 'central',
    benefits: '',
    eligibility: '',
    applicationProcedure: '',
    documentsRequired: '',
    tags: []
  })

  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (scheme) {
      setFormData({
        name: scheme.name || '',
        details: scheme.details || '',
        category: scheme.category || '',
        level: scheme.level || 'central',
        benefits: scheme.benefits || '',
        eligibility: scheme.eligibility || '',
        applicationProcedure: scheme.applicationProcedure || '',
        documentsRequired: scheme.documentsRequired || '',
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
      const cleanedData = {
        name: formData.name,
        details: formData.details,
        category: formData.category,
        level: formData.level,
        benefits: formData.benefits,
        eligibility: formData.eligibility,
        applicationProcedure: formData.applicationProcedure,
        documentsRequired: formData.documentsRequired,
        tags: formData.tags.filter(tag => tag.trim())
      }

      const savedScheme = await onSubmit(cleanedData)

      try {
        window.dispatchEvent(new CustomEvent('scheme:added', {
          detail: savedScheme || cleanedData
        }))
      } catch (err) {
        // ignore event dispatch errors in older browsers
      }

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
                  <select
                    className="w-full h-10 px-3 border rounded-md bg-white"
                    value={formData.level}
                    onChange={(e) => handleInputChange('level', e.target.value)}
                    required
                  >
                    <option value="central">Central</option>
                    <option value="state">State</option>
                    <option value="district">District</option>
                  </select>
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
                  value={formData.applicationProcedure}
                  onChange={(e) => handleInputChange('applicationProcedure', e.target.value)}
                  placeholder="Enter application process"
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Required Documents</h3>
              <textarea
                className="w-full min-h-[100px] p-2 border rounded-md"
                value={formData.documentsRequired}
                onChange={(e) => handleInputChange('documentsRequired', e.target.value)}
                placeholder="Enter required documents"
              />
            </div>

            {/* Documents
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Required Documents <span className="text-red-500">*</span></h3>
              
              <div className="space-y-2">
                {formData.documents.length === 0 && (
                  <p className="text-sm text-red-500">Please add at least one required document.</p>
                )}
                {formData.documents.map((doc, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      value={doc}
                      onChange={(e) => handleArrayInputChange('documents', index, e.target.value)}
                      placeholder={`Document ${index + 1}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeArrayItem('documents', index)}
                      aria-label="Remove document"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addArrayItem('documents')}
                  className="mt-2"
                >
                  Add Document
                </Button>
                {docError && (
                  <p className="text-sm text-red-500">{docError}</p>
                )}
              </div>
            </div> */}

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