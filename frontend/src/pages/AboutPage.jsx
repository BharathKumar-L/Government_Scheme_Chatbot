import React from 'react'
import { useTranslation } from 'react-i18next'
import { MessageCircle, Globe, Mic, Wifi, Shield, Heart } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

const AboutPage = () => {
  const { t } = useTranslation()

  const features = [
    {
      icon: MessageCircle,
      title: t('about.features.chatbot.title'),
      description: t('about.features.chatbot.description')
    },
    {
      icon: Globe,
      title: t('about.features.multilingual.title'),
      description: t('about.features.multilingual.description')
    },
    {
      icon: Mic,
      title: t('about.features.voice.title'),
      description: t('about.features.voice.description')
    },
    {
      icon: Wifi,
      title: t('about.features.offline.title'),
      description: t('about.features.offline.description')
    },
    {
      icon: Shield,
      title: t('about.features.secure.title'),
      description: t('about.features.secure.description')
    },
    {
      icon: Heart,
      title: t('about.features.accessibility.title'),
      description: t('about.features.accessibility.description')
    }
  ]

  const stats = [
    { label: t('about.stats.schemes'), value: '1000+' },
    { label: t('about.stats.languages'), value: '3' },
    { label: t('about.stats.categories'), value: '15+' },
    { label: t('about.stats.users'), value: '10K+' }
  ]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          {t('about.title')}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t('about.subtitle')}
        </p>
      </div>

      {/* Mission Statement */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t('about.mission.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            {t('about.mission.description')}
          </p>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
          {t('about.features.title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Statistics */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-center">{t('about.stats.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t('about.howItWorks.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold mb-1">{t('about.howItWorks.step1.title')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('about.howItWorks.step1.description')}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold mb-1">{t('about.howItWorks.step2.title')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('about.howItWorks.step2.description')}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold mb-1">{t('about.howItWorks.step3.title')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('about.howItWorks.step3.description')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technology Stack */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t('about.technology.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">{t('about.technology.frontend')}</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• React 18 with Vite</li>
                <li>• Progressive Web App (PWA)</li>
                <li>• Tailwind CSS + ShadCN/UI</li>
                <li>• Web Speech API</li>
                <li>• i18next for internationalization</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">{t('about.technology.backend')}</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Node.js + Express.js</li>
                <li>• OpenAI GPT-4 for RAG</li>
                <li>• ChromaDB for vector storage</li>
                <li>• Google Translate API</li>
                <li>• Redis for caching</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t('about.contact.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            {t('about.contact.description')}
          </p>
          <div className="space-y-2 text-sm">
            <div>
              <strong>{t('about.contact.email')}:</strong> support@ruralconnect.gov.in
            </div>
            <div>
              <strong>{t('about.contact.helpline')}:</strong> 1800-XXX-XXXX
            </div>
            <div>
              <strong>{t('about.contact.website')}:</strong> https://ruralconnect.gov.in
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AboutPage
