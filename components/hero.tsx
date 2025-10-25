"use client"

import Image from "next/image"
import Link from "next/link"

export function Hero() {
  return (
    <section className="relative overflow-hidden" aria-labelledby="hero-heading">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 id="hero-heading" className="text-pretty text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            {"Future of On-Chain Payroll."}
          </h1>
          <p className="mt-4 text-balance text-base leading-relaxed text-muted-foreground md:text-lg">
            {
              "Instant payroll, easy team payments, and auto-investing — built for the new economy on Solana."
            }
          </p>
          <div className="mt-8 flex justify-center">
            <Link href="/auth" className="group relative px-6 py-2.5 text-sm font-semibold border-2 border-foreground rounded-full transition-all duration-300 hover:scale-105 active:scale-100">
              <span className="flex items-center gap-2 text-foreground group-hover:bg-gradient-to-r group-hover:from-[#0f44e1] group-hover:via-[#174ef0] group-hover:to-[#3b82f6] group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                {"Get Started"}
                <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:stroke-[#0f44e1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>
          </div>
        </div>
        {/* Visual mockup area */}
        <div className="relative mx-auto mt-12 w-full max-w-5xl">
          {/* Main landing image with dissolving border */}
          <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden">
            {/* Border dissolving effect only */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-background/20 via-transparent to-background/20 z-10 pointer-events-none"></div>
            <div className="absolute inset-[2px] rounded-xl bg-gradient-to-br from-transparent via-transparent to-background/10 z-10 pointer-events-none"></div>
            
            <Image
              src="/corridor-landing.png"
              alt="Corridor platform visualization showing global payment flows"
              fill
              className="rounded-xl object-cover"
              sizes="(max-width: 768px) 100vw, 80vw"
              priority
            />
            
            {/* Subtle bottom blending effect */}
            <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-background/60 via-background/20 to-transparent z-20 pointer-events-none rounded-b-xl"></div>
          </div>

        </div>
      </div>
    </section>
  )
}
