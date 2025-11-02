"use client"

import { useEffect, useRef, useState } from "react"
import { Building2, Wallet, Users, TrendingUp, Shield } from "lucide-react"

const steps = [
  {
    title: "Organization Setup & KYC",
    description:
      "Seamless organization setup with KYC. Establish compliant on-chain business identity.",
    icon: Building2,
    milestone: "$10K",
  },
  {
    title: "Treasury & Virtual Accounts",
    description:
      "Institutional-grade treasury with dedicated USDC accounts. Sovereign control over organizational capital.",
    icon: Wallet,
    milestone: "$25K",
  },
  {
    title: "Payroll Configuration",
    description:
      "Seamless payroll streams with customizable cadences. Automated compensation for global workforce.",
    icon: Users,
    milestone: "$50K",
  },
  {
    title: "Auto-Invest Setup",
    description:
      "Automated wealth accumulation via premium DeFi protocols. Sustainable, compounding payroll growth.",
    icon: TrendingUp,
    milestone: "$100K",
  },
  {
    title: "Compliance & Multi-sig Security",
    description:
      "Regulatory compliance with transfer monitoring. Institutional multi-signature transaction security.",
    icon: Shield,
    milestone: "$250K",
  },
]

export default function HowItWorks() {
  const [visible, setVisible] = useState<boolean[]>(Array(steps.length).fill(false))
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const itemsRef = useRef<(HTMLDivElement | null)[]>([])
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      "matchMedia" in window &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (reduce) {
      setVisible(Array(steps.length).fill(true))
      return
    }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = Number(entry.target.getAttribute("data-step-index"))
          if (entry.isIntersecting) {
            setVisible((prev) => {
              if (prev[idx]) return prev
              const next = [...prev]
              next[idx] = true
              return next
            })
          }
        })
      },
      { rootMargin: "0px 0px -20% 0px", threshold: 0.2 },
    )

    itemsRef.current.forEach((el) => el && obs.observe(el))
    return () => obs.disconnect()
  }, [])

  return (
    <section 
      ref={sectionRef}
      aria-labelledby="how-heading" 
      className="relative py-20 md:py-28 bg-white"
    >
      <div className="container mx-auto px-6 md:px-8 relative z-10">
        {/* Header */}
        <div className="mx-auto max-w-4xl text-center mb-16 md:mb-20">
          <h2 id="how-heading" className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How Corridor Works
          </h2>
          <p className="text-base md:text-lg text-gray-600">
            Five simple steps to revolutionize your global payments
          </p>
        </div>

        {/* Staircase Container */}
        <div className="relative max-w-[1400px] mx-auto min-h-[900px] md:min-h-[600px]">
          
          {/* Staircase Steps */}
          {steps.map((step, i) => {
            const isHovered = hoveredIndex === i
            
            return (
              <div
                key={step.title}
                ref={(el) => { itemsRef.current[i] = el }}
                data-step-index={i}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={[
                  "absolute cursor-pointer",
                  visible[i] ? "opacity-100" : "opacity-0 translate-y-8",
                ].join(" ")}
                style={{
                  left: `${i * 17}%`,
                  bottom: `${i * 15}%`,
                  transitionDelay: visible[i] ? `${i * 100}ms` : '0ms',
                  width: 'clamp(280px, 26vw, 360px)',
                  zIndex: isHovered ? 50 : i + 1,
                  transition: 'opacity 0.7s ease-out, transform 0.7s ease-out, z-index 0s',
                }}
              >
                {/* Connecting line to next step */}
                {i < steps.length - 1 && visible[i + 1] && (
                  <div className="hidden md:block absolute left-[calc(100%-15px)] bottom-[calc(100%-15px)] w-[100px] h-[100px] pointer-events-none">
                    <svg 
                      className="w-full h-full" 
                      viewBox="0 0 100 100"
                    >
                      <path
                        d="M 15 85 Q 50 50, 85 15"
                        fill="none"
                        stroke="#0f44e1"
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="transition-all duration-700"
                        style={{
                          strokeDasharray: "200",
                          strokeDashoffset: visible[i + 1] ? 0 : 200,
                        }}
                      />
                    </svg>
                  </div>
                )}

                {/* Minimal Card */}
                <div 
                  className={[
                    "relative bg-white rounded-lg p-6 md:p-7 border border-gray-200",
                  ].join(" ")}
                  style={{
                    transform: isHovered ? 'translateY(-12px) scale(1.02)' : 'translateY(0) scale(1)',
                    boxShadow: isHovered 
                      ? '0 24px 48px rgba(0,0,0,0.08), 0 0 0 1px rgba(15,68,225,0.15)' 
                      : '0 2px 12px rgba(0,0,0,0.04)',
                    transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease-out, border-color 0.4s ease-out',
                    zIndex: isHovered ? 51 : 'auto',
                    borderColor: isHovered ? 'rgba(15,68,225,0.2)' : 'rgb(229, 231, 235)',
                  }}
                >
                  {/* Subtle primary glow on hover */}
                  <div 
                    className="absolute -inset-0.5 bg-[#0f44e1]/10 rounded-lg blur-sm -z-10 transition-opacity duration-400"
                    style={{ opacity: isHovered ? 1 : 0 }}
                  />

                  {/* Step number - minimal */}
                  <div className="mb-5 flex items-center gap-3">
                    <div 
                      className="w-9 h-9 rounded-lg bg-gray-300 flex items-center justify-center text-blue-600 font-bold text-base flex-shrink-0 transition-transform duration-400 ease-out"
                      style={{
                        transform: isHovered ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)'
                      }}
                    >
                      {i + 1}
                    </div>
                    <div 
                      className="h-px bg-gray-200 transition-all duration-400"
                      style={{
                        width: '100%',
                        backgroundColor: isHovered ? 'rgba(15,68,225,0.3)' : 'rgb(229, 231, 235)'
                      }}
                    />
                  </div>

                  {/* Content */}
                  <h3 
                    className="text-lg md:text-xl font-semibold text-gray-900 mb-2.5 leading-snug transition-colors duration-300"
                    style={{
                      color: isHovered ? 'rgb(17, 24, 39)' : 'rgb(17, 24, 39)'
                    }}
                  >
                    {step.title}
                  </h3>
                  <p 
                    className="text-sm md:text-base leading-relaxed transition-colors duration-300"
                    style={{
                      color: isHovered ? 'rgb(55, 65, 81)' : 'rgb(75, 85, 99)'
                    }}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom progress */}
        <div className="mt-16 flex items-center justify-center gap-2">
          {steps.map((_, i) => (
            <div 
              key={i}
              className={[
                "h-1 rounded-full transition-all duration-700",
                visible[i] ? "w-10 bg-[#0f44e1]" : "w-1 bg-gray-300"
              ].join(" ")}
              style={{ transitionDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}