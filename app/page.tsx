// Home page - Landing page with animations
// Beautiful fade-in effects and interactive hover animations

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Home, TrendingUp, Shield, Sparkles, Users, Calendar, ArrowRight } from 'lucide-react';
import { getCurrentUser } from '@/lib/supabase';

/**
 * Animation variants for staggered fade-in effects
 */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut' as const,
    },
  },
};

const fadeInVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: 'easeOut',
    },
  },
};

/**
 * Feature tile component with hover animation
 */
function FeatureTile({ 
  icon: Icon, 
  title, 
  description, 
  delay = 0 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' as const }}
      whileHover={{ 
        y: -8, 
        scale: 1.02,
        transition: { duration: 0.3, ease: 'easeOut' }
      }}
      className="group relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 cursor-pointer overflow-hidden border border-gray-700/50"
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Icon with float animation on hover */}
      <motion.div 
        className="relative z-10 mb-6 inline-block"
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
      >
        <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
          <Icon className="h-8 w-8 text-white" strokeWidth={1.5} />
        </div>
      </motion.div>
      
      <h3 className="relative z-10 text-xl font-semibold text-white mb-3 group-hover:text-white transition-colors">
        {title}
      </h3>
      <p className="relative z-10 text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
        {description}
      </p>
    </motion.div>
  );
}

/**
 * Home page component
 * Landing page with fade-in animations and interactive tiles
 */
export default function HomePage() {
  const router = useRouter();
  
  // Check if user is already logged in and redirect to dashboard
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const { user } = await getCurrentUser();
      if (user) {
        // User is logged in, redirect to dashboard
        router.push('/dashboard');
      }
    };
    
    checkAuthAndRedirect();
  }, [router]);
  
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Navigation bar */}
      <motion.nav 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="relative z-50 border-b border-white/10 backdrop-blur-md bg-black/50"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            {/* Logo */}
            <motion.div 
              className="flex items-center"
              whileHover={{ scale: 1.02 }}
            >
              <Image
                src="/logo.png"
                alt="Realestic"
                width={140}
                height={40}
                priority
                className="h-8 w-auto"
              />
            </motion.div>
            
            {/* Navigation links */}
            <div className="flex items-center gap-4">
              <Link href="/auth/login">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  Sign In
                </motion.button>
              </Link>
              <Link href="/auth/signup">
                <motion.button 
                  whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(255,255,255,0.2)' }}
                  whileTap={{ scale: 0.98 }}
                  className="px-5 py-2.5 text-sm font-medium bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Get Started
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero section */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-20 pb-32 lg:px-8 lg:pt-32 lg:pb-40">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid lg:grid-cols-2 gap-16 items-center"
        >
          {/* Left content */}
          <div>
            <motion.div variants={itemVariants} className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm text-gray-300 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                AI-Powered Real Estate Platform
              </span>
            </motion.div>
            
            <motion.h1 
              variants={itemVariants}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]"
            >
              <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                Work Smarter
              </span>
              <br />
              <span className="text-white">Close Faster</span>
            </motion.h1>
            
            <motion.p 
              variants={itemVariants}
              className="mt-8 text-lg text-gray-400 leading-relaxed max-w-xl"
            >
              Transform your workflow as a real estate agent with intelligent tools designed for you. 
              Manage leads, schedule showings, and close more deals with our AI-powered platform.
            </motion.p>

            {/* Call-to-action buttons */}
            <motion.div variants={itemVariants} className="mt-10 flex flex-wrap items-center gap-4">
              <Link href="/auth/signup">
                <motion.button 
                  whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(255,255,255,0.3)' }}
                  whileTap={{ scale: 0.98 }}
                  className="group px-8 py-4 text-base font-semibold bg-white text-black rounded-xl hover:bg-gray-100 transition-all flex items-center gap-2"
                >
                  Get Started Free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
              <Link href="/auth/login">
                <motion.button 
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-4 text-base font-semibold text-white border border-white/30 rounded-xl backdrop-blur-sm transition-all"
                >
                  Sign In
                </motion.button>
              </Link>
            </motion.div>
          </div>

          {/* Right content - Floating cards preview */}
          <motion.div 
            variants={itemVariants}
            className="hidden lg:block relative"
          >
            <div className="relative w-full h-[500px]">
              {/* Floating card 1 */}
              <motion.div
                initial={{ opacity: 0, y: 50, rotate: -5 }}
                animate={{ opacity: 1, y: 0, rotate: -5 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                whileHover={{ 
                  y: -10, 
                  rotate: 0, 
                  scale: 1.02,
                  transition: { duration: 0.15, ease: 'easeOut' }
                }}
                className="absolute top-0 right-0 w-72 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 shadow-2xl border border-white/10"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-300">Monthly Growth</span>
                </div>
                <div className="text-3xl font-bold text-white">+24%</div>
                <div className="text-sm text-gray-500 mt-1">vs last month</div>
              </motion.div>

              {/* Floating card 2 */}
              <motion.div
                initial={{ opacity: 0, y: 50, rotate: 3 }}
                animate={{ opacity: 1, y: 0, rotate: 3 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                whileHover={{ 
                  y: -10, 
                  rotate: 0, 
                  scale: 1.02,
                  transition: { duration: 0.15, ease: 'easeOut' }
                }}
                className="absolute top-32 left-0 w-64 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 shadow-2xl border border-white/10"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Home className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-300">Active Listings</span>
                </div>
                <div className="text-3xl font-bold text-white">47</div>
                <div className="text-sm text-gray-500 mt-1">Properties</div>
              </motion.div>

              {/* Floating card 3 */}
              <motion.div
                initial={{ opacity: 0, y: 50, rotate: -2 }}
                animate={{ opacity: 1, y: 0, rotate: -2 }}
                transition={{ duration: 0.8, delay: 0.9 }}
                whileHover={{ 
                  y: -10, 
                  rotate: 0, 
                  scale: 1.02,
                  transition: { duration: 0.15, ease: 'easeOut' }
                }}
                className="absolute bottom-10 right-10 w-80 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 shadow-2xl border border-white/10"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-300">AI Generated</span>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  "Stunning 4BR home with panoramic views, chef's kitchen, and resort-style backyard..."
                </p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features section */}
      <section className="relative z-10 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Section header */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-white">
              Everything you need to{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                succeed
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Powerful features designed to streamline your workflow and help you close more deals
            </p>
          </motion.div>

          {/* Feature tiles grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FeatureTile
              icon={Home}
              title="Property Management"
              description="Streamline your listings with AI-powered descriptions, professional photos organization, and one-click publishing."
              delay={0}
            />
            <FeatureTile
              icon={Sparkles}
              title="AI Content Generation"
              description="Generate compelling listing descriptions, social media posts, and email templates in seconds with AI."
              delay={0.1}
            />
            <FeatureTile
              icon={Users}
              title="Client Management"
              description="Keep track of all your clients, their preferences, and communication history in one place."
              delay={0.2}
            />
            <FeatureTile
              icon={Calendar}
              title="Smart Scheduling"
              description="Sync with Google Calendar, manage showings, and never miss an important appointment."
              delay={0.3}
            />
            <FeatureTile
              icon={TrendingUp}
              title="Growth Analytics"
              description="Track performance metrics, monitor trends, and make data-driven decisions to grow your business."
              delay={0.4}
            />
            <FeatureTile
              icon={Shield}
              title="Secure & Reliable"
              description="Enterprise-grade security protecting your valuable client data with encrypted storage and backups."
              delay={0.5}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              © 2026 Realestic. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
