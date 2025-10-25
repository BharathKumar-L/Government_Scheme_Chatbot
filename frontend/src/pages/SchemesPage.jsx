import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Filter, ExternalLink, Phone, Calendar, FileText } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import LoadingSpinner from '../components/LoadingSpinner'
import { schemesAPI } from '../services/api'
import toast from 'react-hot-toast'

const SchemesPage = () => {
  const { t } = useTranslation()
  const [schemes, setSchemes] = useState([])
  const [filteredSchemes, setFilteredSchemes] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedScheme, setSelectedScheme] = useState(null)

  useEffect(() => {
    loadSchemes()
    loadCategories()
  }, [])

  useEffect(() => {
    filterSchemes()
  }, [schemes, searchQuery, selectedCategory])

  const loadSchemes = async () => {
    try {
      setIsLoading(true)
      const response = await schemesAPI.getAllSchemes()
      setSchemes(response.data)
    } catch (error) {
      console.error('Failed to load schemes:', error)
      toast.error('Failed to load schemes. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await schemesAPI.getCategories()
      setCategories(response.data)
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  const filterSchemes = () => {
    let filtered = [...schemes]

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(scheme =>
        scheme.name.toLowerCase().includes(query) ||
        scheme.objective.toLowerCase().includes(query) ||
        scheme.category.toLowerCase().includes(query) ||
        (scheme.tags && scheme.tags.some(tag => tag.toLowerCase().includes(query)))
      )
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(scheme => scheme.category === selectedCategory)
    }

    setFilteredSchemes(filtered)
  }

  const handleSearch = (e) => {
    setSearchQuery(e.target.value)
  }

  const handleCategoryChange = (category) => {
    setSelectedCategory(category)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t('schemes.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('schemes.subtitle')}
          </p>
        </div>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {t('schemes.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('schemes.subtitle')}
        </p>
      </div>

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('schemes.searchPlaceholder')}
                value={searchQuery}
                onChange={handleSearch}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={t('schemes.selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('schemes.allCategories')}</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schemes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSchemes.map((scheme) => (
          <Card key={scheme.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2">{scheme.name}</CardTitle>
                  <CardDescription className="mt-1">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                      {scheme.category}
                    </span>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                {scheme.objective}
              </p>
              
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-3 w-3" />
                  <span>Deadline: {scheme.deadline}</span>
                </div>
                {scheme.contactInfo && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-3 w-3" />
                    <span className="truncate">{scheme.contactInfo}</span>
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => setSelectedScheme(scheme)}
                  className="flex-1"
                >
                  <FileText className="h-3 w-3 mr-1" />
                  {t('schemes.viewDetails')}
                </Button>
                {scheme.website && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(scheme.website, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSchemes.length === 0 && !isLoading && (
        <Card className="text-center py-12">
          <CardContent>
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('schemes.noResults')}</h3>
            <p className="text-muted-foreground">
              {t('schemes.noResultsDescription')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Scheme Details Modal */}
      {selectedScheme && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{selectedScheme.name}</CardTitle>
                  <CardDescription className="mt-1">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                      {selectedScheme.category}
                    </span>
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedScheme(null)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">{t('schemes.objective')}</h4>
                <p className="text-sm text-muted-foreground">{selectedScheme.objective}</p>
              </div>

              {selectedScheme.eligibility && selectedScheme.eligibility.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">{t('schemes.eligibility')}</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {selectedScheme.eligibility.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedScheme.benefits && (
                <div>
                  <h4 className="font-semibold mb-2">{t('schemes.benefits')}</h4>
                  <p className="text-sm text-muted-foreground">{selectedScheme.benefits}</p>
                </div>
              )}

              {selectedScheme.documentsRequired && selectedScheme.documentsRequired.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">{t('schemes.documentsRequired')}</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {selectedScheme.documentsRequired.map((doc, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{doc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedScheme.applicationProcedure && selectedScheme.applicationProcedure.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">{t('schemes.applicationProcedure')}</h4>
                  <ol className="text-sm text-muted-foreground space-y-1">
                    {selectedScheme.applicationProcedure.map((step, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2 font-medium">{index + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <h4 className="font-semibold mb-2">{t('schemes.deadline')}</h4>
                  <p className="text-sm text-muted-foreground">{selectedScheme.deadline}</p>
                </div>
                {selectedScheme.contactInfo && (
                  <div>
                    <h4 className="font-semibold mb-2">{t('schemes.contactInfo')}</h4>
                    <p className="text-sm text-muted-foreground">{selectedScheme.contactInfo}</p>
                  </div>
                )}
              </div>

              {selectedScheme.website && (
                <div className="pt-4 border-t">
                  <Button
                    onClick={() => window.open(selectedScheme.website, '_blank')}
                    className="w-full"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {t('schemes.visitWebsite')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default SchemesPage
