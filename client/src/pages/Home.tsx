import React from 'react';
import { Helmet } from 'react-helmet';
import HeroSection from '@/components/home/HeroSection';
import StatsSection from '@/components/home/StatsSection';
import FeaturedTenders from '@/components/home/FeaturedTenders';
import FeaturedMarketplace from '@/components/home/FeaturedMarketplace';
import HowItWorks from '@/components/home/HowItWorks';
import Testimonials from '@/components/home/Testimonials';
import CallToAction from '@/components/home/CallToAction';

export default function Home() {
  return (
    <>
      <Helmet>
        <title>СтройТендер — тендеры и маркетплейс строительных материалов</title>
        <meta name="description" content="СтройТендер — платформа для проведения тендеров в строительной сфере и маркетплейс строительных материалов. Размещайте заказы на строительные работы, продавайте и арендуйте оборудование." />
        <meta property="og:title" content="СтройТендер — тендеры и маркетплейс строительных материалов" />
        <meta property="og:description" content="Размещайте заказы на строительные работы, продавайте и арендуйте оборудование и материалы на единой безопасной платформе." />
        <meta property="og:type" content="website" />
      </Helmet>
      
      <div className="bg-gray-100">
        <HeroSection />
        <StatsSection />
        
        <main className="container mx-auto px-4 py-8">
          <FeaturedTenders />
          <FeaturedMarketplace />
          <HowItWorks />
          <Testimonials />
          <CallToAction />
        </main>
      </div>
    </>
  );
}
