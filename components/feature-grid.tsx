"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { ShieldCheck, TrendingUp, Network, Rows3 } from "lucide-react"

const features = [
  {
    title: "Atomic Bulk Payments",
    description: "Pay 1 or 1,000 people in a single, secure transaction for a fraction of a penny.",
    Icon: Rows3,
    imageSrc: "/transfer.jpg",
  },
  {
    title: "Non-Custodial Security",
    description:
      "You are always in control. Corridor is built on self-custody principles, giving you full ownership of your funds.",
    Icon: ShieldCheck,
    imageSrc: "/secure.png",
  },
  {
    title: "Fiat-to-Crypto Ramps",
    description: "Seamlessly move between USDC and local currencies with our integrated on/off-ramp partners.",
    Icon: Network,
    imageSrc: "/usdc.png",
  },
  {
    title: "Auto-Invest Savings",
    description: "Automatically invest a portion of every paycheck into high-yield DeFi protocols. You set the percentage, and Corridor handles the rest. Put your savings to work the moment you get paid.",
    Icon: TrendingUp,
    imageSrc: "/investment.png",
  },
]

export function FeatureGrid() {
  const [activeIndex, setActiveIndex] = useState(0)
  const sectionRef = useRef<HTMLElement | null>(null)

  // Calculate scroll progress and update active feature
  useEffect(() => {
    const sectionEl = sectionRef.current
    if (!sectionEl) return

    const handleScroll = () => {
      const rect = sectionEl.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const sectionHeight = sectionEl.offsetHeight
      
      // Calculate scroll progress through the section
      // When rect.top is negative (section is above viewport), progress starts
      // When rect.bottom is positive (section is below viewport), we're still in progress
      const scrollableDistance = sectionHeight - viewportHeight
      
      if (scrollableDistance <= 0) {
        // Section is smaller than viewport, just show first feature
        setActiveIndex(0)
        return
      }
      
      // Calculate how much we've scrolled through the section
      // We want progress to go from 0 (at top) to 1 (at bottom)
      const scrollProgress = Math.max(0, Math.min(1, 
        -rect.top / scrollableDistance
      ))
      
      // Determine active index based on scroll progress
      const newActiveIndex = Math.min(
        features.length - 1,
        Math.floor(scrollProgress * features.length)
      )
      
      setActiveIndex(newActiveIndex)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial calculation
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      {/* Desktop: Sticky scroll-driven layout */}
      <section 
        ref={sectionRef}
        aria-labelledby="features-heading" 
        className="hidden md:block pt-0.50 pb-20"
        style={{ minHeight: `${features.length * 100}vh` }}
      >
        {/* Sticky wrapper that pins content in viewport */}
        <div className="sticky top-20 h-[calc(100vh-5rem)]">
          <div className="h-full w-full max-w-7xl mx-auto px-6 md:px-8">
            {/* Features container with absolutely positioned items */}
            <div className="relative w-full h-full">
              {/* Sticky Title */}
              <div className="absolute top-0 left-0 right-0 z-50 text-center pointer-events-none mb-8">
                <h2 id="features-heading" className="text-3xl font-semibold md:text-4xl">
                  Key Features
                </h2>
                <p className="mt-2 text-sm md:text-base text-muted-foreground">
                  What makes Corridor fast, secure, and user-friendly.
                </p>
              </div>
              {features.map(({ title, description, imageSrc }, i) => {
                const isOdd = i % 2 === 0
                const isActive = activeIndex === i
                
                return (
                  <div
                    key={`feature-${i}`}
                    className="absolute inset-0 transition-opacity duration-700 ease-out"
                    style={{
                      opacity: isActive ? 1 : 0,
                      pointerEvents: isActive ? 'auto' : 'none'
                    }}
                  >
                    <div className="h-full grid grid-cols-2 gap-8 md:gap-12 items-center pt-24">
                      {isOdd ? (
                        <>
                          {/* Text on left */}
                          <div className="flex items-center justify-end">
                            <div 
                              className="max-w-md transition-all duration-700 ease-out"
                              style={{
                                transform: isActive ? 'translateX(0) scale(1)' : 'translateX(-20px) scale(0.96)'
                              }}
                            >
                              <h3 className="text-3xl md:text-4xl font-semibold mb-6">{title}</h3>
                              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                                {description}
                              </p>
                            </div>
                          </div>
                          
                          {/* Image on right */}
                          <div className="flex items-center justify-center">
                            <div 
                              className="relative w-full h-[70vh] transition-all duration-700 ease-out"
                              style={{
                                transform: isActive ? 'scale(1)' : 'scale(0.92)'
                              }}
                            >
                              <Image
                                src={imageSrc}
                                alt={`${title} illustration`}
                                fill
                                className="object-contain drop-shadow-2xl"
                                sizes="45vw"
                                priority={i === 0}
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Image on left */}
                          <div className="flex items-center justify-center">
                            <div 
                              className="relative w-full h-[70vh] transition-all duration-700 ease-out"
                              style={{
                                transform: isActive ? 'scale(1)' : 'scale(0.92)'
                              }}
                            >
                              <Image
                                src={imageSrc}
                                alt={`${title} illustration`}
                                fill
                                className="object-contain drop-shadow-2xl"
                                sizes="45vw"
                              />
                            </div>
                          </div>
                          
                          {/* Text on right */}
                          <div className="flex items-center justify-start">
                            <div 
                              className="max-w-md transition-all duration-700 ease-out"
                              style={{
                                transform: isActive ? 'translateX(0) scale(1)' : 'translateX(20px) scale(0.96)'
                              }}
                            >
                              <h3 className="text-3xl md:text-4xl font-semibold mb-6">{title}</h3>
                              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                                {description}
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile: Stacked layout */}
      <section className="md:hidden relative py-12">
        <div className="container mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold mb-3">Key Features</h2>
            <p className="text-sm text-muted-foreground">
              What makes Corridor fast, secure, and user-friendly.
            </p>
          </div>
          
          {/* Features Grid */}
          <div className="space-y-16">
            {features.map(({ title, description, imageSrc }, i) => (
              <div key={`mobile-${i}`} className="flex flex-col items-center">
                <div className="relative w-full max-w-md aspect-square mb-6">
                  <Image
                    src={imageSrc}
                    alt={`${title} illustration`}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                </div>
                <div className="text-center max-w-md">
                  <h3 className="text-2xl font-semibold mb-3">{title}</h3>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}