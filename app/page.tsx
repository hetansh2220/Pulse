"use client"

import { useEffect, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  Zap,
  Shield,
  Globe,
  BarChart3,
  Wallet,
  Target,
  TrendingUp,
  MessageCircle,
  Play,
  Coins,
  ChevronRight
} from 'lucide-react'
import { getMarketDisplayStatus, getStatusStyles } from '@/lib/market-utils'
import MarketImage from '@/components/markets/MarketImage'

interface Market {
  id: string
  question: string
  category: string
  currentYesPrice: number
  currentNoPrice: number
  volume: string
  endTime: string
  resolved: boolean
  bufferPeriodActive: boolean
}

const stats = [
  { label: 'Total Volume', value: '$2.4M+' },
  { label: 'Active Markets', value: '580+' },
  { label: 'Traders', value: '12K+' },
  { label: 'Avg. Settlement', value: '<1s' },
]

const features = [
  {
    icon: Zap,
    title: 'Sub-Second Trades',
    description: 'Execute trades instantly on Solana. No waiting for confirmations.',
    color: 'lime'
  },
  {
    icon: Wallet,
    title: 'No Wallet Required',
    description: 'Sign up with email. We create your embedded wallet automatically.',
    color: 'cyan'
  },
  {
    icon: Shield,
    title: 'Fully On-Chain',
    description: 'All markets and trades live on Solana. Transparent and trustless.',
    color: 'lime'
  },
  {
    icon: BarChart3,
    title: 'Real-Time Prices',
    description: 'Watch odds shift live as the market reacts to new information.',
    color: 'cyan'
  },
  {
    icon: Target,
    title: 'Oracle Resolution',
    description: 'Automated resolution using trusted data feeds. No manipulation.',
    color: 'lime'
  },
  {
    icon: Globe,
    title: 'Global Access',
    description: 'Trade from anywhere. No KYC, no restrictions, just connect.',
    color: 'cyan'
  }
]

const categories = [
  {
    icon: MessageCircle,
    name: 'Twitter/X',
    description: 'Predict engagement, followers, viral moments',
    color: '#00f5ff',
    markets: 142
  },
  {
    icon: Play,
    name: 'YouTube',
    description: 'Bet on views, subscribers, creator milestones',
    color: '#ff4757',
    markets: 89
  },
  {
    icon: Coins,
    name: 'Crypto',
    description: 'Trade on prices, TVL, protocol metrics',
    color: '#c8ff00',
    markets: 234
  },
  {
    icon: Globe,
    name: 'General',
    description: 'Politics, sports, entertainment, anything',
    color: '#a855f7',
    markets: 115
  }
]

const steps = [
  { num: '01', title: 'Connect', desc: 'Sign up with just your email address' },
  { num: '02', title: 'Fund', desc: 'Deposit USDC to your wallet' },
  { num: '03', title: 'Trade', desc: 'Buy YES or NO on any prediction' },
  { num: '04', title: 'Win', desc: 'Collect winnings when resolved' },
]

export default function HomePage() {
  const { login, authenticated, ready } = usePrivy()
  const router = useRouter()
  const [featuredMarkets, setFeaturedMarkets] = useState<Market[]>([])
  const [isLoadingMarkets, setIsLoadingMarkets] = useState(true)

  useEffect(() => {
    if (ready && authenticated) {
      router.push('/markets')
    }
  }, [authenticated, ready, router])

  useEffect(() => {
    async function fetchMarkets() {
      try {
        const response = await fetch('/api/markets?limit=4')
        const data = await response.json()
        if (data.markets) {
          setFeaturedMarkets(data.markets.slice(0, 4))
        }
      } catch (error) {
        console.error('Error fetching markets:', error)
      } finally {
        setIsLoadingMarkets(false)
      }
    }
    fetchMarkets()
  }, [])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-2 border-[#c8ff00]/30 border-t-[#c8ff00] rounded-full animate-spin" />
          <p className="text-[#6b6b7b] font-mono text-sm">INITIALIZING...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] noise">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-[#c8ff00]/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="size-9 bg-[#c8ff00] flex items-center justify-center group-hover:glow-lime transition-all">
              <TrendingUp className="size-5 text-[#0a0a0f]" />
            </div>
            <span className="font-bold text-xl tracking-tight">PNP</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="#markets" className="text-sm text-[#6b6b7b] hover:text-[#c8ff00] transition-colors">
              Markets
            </Link>
            <Link href="#features" className="text-sm text-[#6b6b7b] hover:text-[#c8ff00] transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm text-[#6b6b7b] hover:text-[#c8ff00] transition-colors">
              How It Works
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="text-[#6b6b7b] hover:text-[#e8e8e8] hover:bg-transparent"
              onClick={() => router.push('/markets')}
            >
              Explore
            </Button>
            <button
              onClick={() => login()}
              className="btn-primary px-5 py-2.5 text-sm font-semibold"
            >
              Log In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden mesh-gradient grid-bg">
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="max-w-4xl">
            {/* Badge */}
            <div className="animate-fade-up inline-flex items-center gap-2 px-3 py-1.5 border border-[#c8ff00]/30 bg-[#c8ff00]/5 mb-8">
              <span className="size-2 bg-[#c8ff00] animate-pulse" />
              <span className="text-xs font-mono text-[#c8ff00] uppercase tracking-wider">
                Live on Solana Mainnet
              </span>
            </div>

            {/* Headline */}
            <h1 className="animate-fade-up delay-100 text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95]">
              <span className="block">Trade the</span>
              <span className="block text-[#c8ff00] glow-text">Future.</span>
            </h1>

            {/* Subheadline */}
            <p className="animate-fade-up delay-200 mt-8 text-lg md:text-xl text-[#6b6b7b] max-w-xl leading-relaxed">
              The prediction market protocol built for speed. Trade YES/NO outcomes on
              crypto, social metrics, and real-world events.
            </p>

            {/* CTA Buttons */}
            <div className="animate-fade-up delay-300 mt-10 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => login()}
                className="btn-primary px-8 py-4 text-base font-semibold flex items-center justify-center gap-2 group"
              >
                Start Trading
                <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => router.push('/markets')}
                className="px-8 py-4 text-base font-medium border border-[#c8ff00]/20 text-[#e8e8e8] hover:border-[#c8ff00]/50 hover:bg-[#c8ff00]/5 transition-all flex items-center justify-center gap-2"
              >
                View Markets
              </button>
            </div>

            {/* Stats */}
            <div className="animate-fade-up delay-400 mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <div key={i} className="border-l border-[#c8ff00]/20 pl-4">
                  <p className="text-2xl md:text-3xl font-bold text-[#e8e8e8]">{stat.value}</p>
                  <p className="text-xs font-mono text-[#6b6b7b] uppercase tracking-wider mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Floating graphic element */}
          <div className="hidden lg:block absolute top-20 right-0 w-[400px] h-[400px]">
            <div className="relative w-full h-full">
              <div className="absolute inset-0 border border-[#c8ff00]/20 rotate-45 animate-float" />
              <div className="absolute inset-8 border border-[#00f5ff]/20 rotate-45 animate-float" style={{ animationDelay: '0.5s' }} />
              <div className="absolute inset-16 border border-[#c8ff00]/10 rotate-45 animate-float" style={{ animationDelay: '1s' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-6xl font-bold text-[#c8ff00]/10">PNP</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Ticker */}
      <div className="border-y border-[#c8ff00]/10 bg-[#0d0d12] overflow-hidden py-4">
        <div className="animate-ticker flex gap-12 whitespace-nowrap">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-12">
              {featuredMarkets.map((market, j) => (
                <div key={`${i}-${j}`} className="flex items-center gap-4 px-4">
                  <span className="text-[#6b6b7b] font-mono text-sm truncate max-w-[300px]">
                    {market.question}
                  </span>
                  <span className="text-[#2ed573] font-mono font-bold">
                    ${market.currentYesPrice.toFixed(2)}
                  </span>
                  <span className="text-[#6b6b7b]">/</span>
                  <span className="text-[#ff4757] font-mono font-bold">
                    ${market.currentNoPrice.toFixed(2)}
                  </span>
                </div>
              ))}
              {featuredMarkets.length === 0 && (
                <>
                  <div className="flex items-center gap-4 px-4">
                    <span className="text-[#6b6b7b] font-mono text-sm">Loading markets...</span>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Live Markets */}
      <section id="markets" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-xs font-mono text-[#c8ff00] uppercase tracking-wider mb-2">// Live Markets</p>
              <h2 className="text-3xl md:text-4xl font-bold">Trending Now</h2>
            </div>
            <button
              onClick={() => router.push('/markets')}
              className="hidden md:flex items-center gap-2 text-sm text-[#6b6b7b] hover:text-[#c8ff00] transition-colors group"
            >
              View All
              <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {isLoadingMarkets ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="card-glow bg-[#12121a] p-6">
                  <div className="h-4 bg-[#1a1a24] w-3/4 mb-4 animate-pulse" />
                  <div className="h-3 bg-[#1a1a24] w-full mb-2 animate-pulse" />
                  <div className="flex gap-4 mt-6">
                    <div className="flex-1 h-16 bg-[#1a1a24] animate-pulse" />
                    <div className="flex-1 h-16 bg-[#1a1a24] animate-pulse" />
                  </div>
                </div>
              ))
            ) : featuredMarkets.length > 0 ? (
              featuredMarkets.map((market) => {
                const displayStatus = getMarketDisplayStatus(market)
                const statusStyles = getStatusStyles(displayStatus)
                const isEnded = displayStatus === 'ended' || displayStatus === 'resolved'

                return (
                  <div
                    key={market.id}
                    onClick={() => router.push(`/markets/${market.id}`)}
                    className={`card-glow bg-[#12121a] p-6 cursor-pointer group ${isEnded ? 'opacity-75' : ''}`}
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <MarketImage market={market} size="md" />
                      <div className="flex-1 flex items-start justify-between">
                        <span className={`px-2 py-1 text-xs font-mono uppercase tracking-wider border ${statusStyles.textClass} ${statusStyles.borderClass}`}>
                          {displayStatus}
                        </span>
                        <ArrowRight className="size-4 text-[#6b6b7b] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg leading-tight mb-6 line-clamp-2 group-hover:text-[#c8ff00] transition-colors">
                      {market.question}
                    </h3>
                    <div className="flex gap-3">
                      <div className="flex-1 bg-[#2ed573]/10 border border-[#2ed573]/20 p-4">
                        <p className="text-xs font-mono text-[#6b6b7b] mb-1">YES</p>
                        <p className="text-2xl font-bold text-[#2ed573] tabular-nums">
                          ${market.currentYesPrice.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex-1 bg-[#ff4757]/10 border border-[#ff4757]/20 p-4">
                        <p className="text-xs font-mono text-[#6b6b7b] mb-1">NO</p>
                        <p className="text-2xl font-bold text-[#ff4757] tabular-nums">
                          ${market.currentNoPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="col-span-2 text-center py-16 text-[#6b6b7b]">
                <BarChart3 className="size-12 mx-auto mb-4 opacity-30" />
                <p className="font-mono text-sm">No markets available</p>
              </div>
            )}
          </div>

          <div className="mt-8 md:hidden">
            <button
              onClick={() => router.push('/markets')}
              className="w-full py-3 border border-[#c8ff00]/20 text-[#c8ff00] font-medium hover:bg-[#c8ff00]/5 transition-colors"
            >
              View All Markets
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-[#0d0d12]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-mono text-[#c8ff00] uppercase tracking-wider mb-2">// Features</p>
            <h2 className="text-3xl md:text-4xl font-bold">Built Different</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, i) => (
              <div
                key={i}
                className="card-glow bg-[#12121a] p-6 group"
              >
                <div className={`size-12 flex items-center justify-center mb-4 ${
                  feature.color === 'lime'
                    ? 'bg-[#c8ff00]/10 border border-[#c8ff00]/20'
                    : 'bg-[#00f5ff]/10 border border-[#00f5ff]/20'
                }`}>
                  <feature.icon className={`size-6 ${
                    feature.color === 'lime' ? 'text-[#c8ff00]' : 'text-[#00f5ff]'
                  }`} />
                </div>
                <h3 className="text-lg font-semibold mb-2 group-hover:text-[#c8ff00] transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-[#6b6b7b] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-mono text-[#c8ff00] uppercase tracking-wider mb-2">// Process</p>
            <h2 className="text-3xl md:text-4xl font-bold">How It Works</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="relative">
                {i < 3 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-full h-px bg-gradient-to-r from-[#c8ff00]/30 to-transparent" />
                )}
                <div className="relative">
                  <span className="text-5xl font-bold text-[#c8ff00]/10">{step.num}</span>
                  <h3 className="text-xl font-semibold mt-2 mb-2">{step.title}</h3>
                  <p className="text-sm text-[#6b6b7b]">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-24 px-6 bg-[#0d0d12]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-mono text-[#c8ff00] uppercase tracking-wider mb-2">// Categories</p>
            <h2 className="text-3xl md:text-4xl font-bold">Trade Everything</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((cat, i) => (
              <div
                key={i}
                className="card-glow bg-[#12121a] p-6 group cursor-pointer"
                onClick={() => router.push('/markets')}
              >
                <div
                  className="size-14 flex items-center justify-center mb-4 transition-all group-hover:scale-110"
                  style={{
                    backgroundColor: `${cat.color}10`,
                    border: `1px solid ${cat.color}30`
                  }}
                >
                  <cat.icon className="size-7" style={{ color: cat.color }} />
                </div>
                <h3 className="text-lg font-semibold mb-1">{cat.name}</h3>
                <p className="text-sm text-[#6b6b7b] mb-4">{cat.description}</p>
                <p className="text-xs font-mono" style={{ color: cat.color }}>
                  {cat.markets} markets
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg" />
        <div className="max-w-3xl mx-auto text-center relative">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to <span className="text-[#c8ff00]">trade</span>?
          </h2>
          <p className="text-lg text-[#6b6b7b] mb-10 max-w-xl mx-auto">
            Join thousands of traders making predictions on real-world outcomes.
            No wallet needed - start in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => login()}
              className="btn-primary px-10 py-4 text-base font-semibold flex items-center justify-center gap-2 animate-glow-pulse"
            >
              Create Free Account
              <ArrowRight className="size-4" />
            </button>
            <button
              onClick={() => router.push('/markets')}
              className="px-10 py-4 text-base font-medium border border-[#c8ff00]/20 text-[#e8e8e8] hover:border-[#c8ff00]/50 transition-all"
            >
              Explore First
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-[#c8ff00]/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="size-8 bg-[#c8ff00] flex items-center justify-center">
              <TrendingUp className="size-4 text-[#0a0a0f]" />
            </div>
            <span className="font-bold text-lg">PNP Markets</span>
          </div>

          <div className="flex items-center gap-8 text-sm text-[#6b6b7b]">
            <Link href="#markets" className="hover:text-[#c8ff00] transition-colors">Markets</Link>
            <Link href="#features" className="hover:text-[#c8ff00] transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-[#c8ff00] transition-colors">How It Works</Link>
          </div>

          <p className="text-xs font-mono text-[#6b6b7b]">
            Built on Solana
          </p>
        </div>
      </footer>
    </div>
  )
}
