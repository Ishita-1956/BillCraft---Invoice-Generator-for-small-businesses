"use client"

import React, { useState, useEffect } from 'react';
import { ChevronRight, CheckCircle, FileText, Users, BarChart3, Zap, Shield, Clock, Menu, X, ArrowRight, Sparkles, Receipt, Mail, Phone, MapPin, Send, Globe, Layers, Target, Award } from 'lucide-react';
import Link from 'next/link';

// --- START: Imports and Logic from the second code block ---
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
// Assuming "@/components/billcraft-logo" and "@/components/ui/button" are not needed
// as your first component uses its own logo rendering and standard buttons.
// The core logic is the session check and router push.
// --- END: Imports and Logic from the second code block ---

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfService, setShowTermsOfService] = useState(false);

  // --- START: Session Check Logic Integration ---
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      // Ensure 'createClient' is correctly imported and available at this path
      // Note: This file relies on you having a 'supabase/client' utility.
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // Redirect authenticated users to the dashboard
        router.push("/dashboard")
      }
    }
    
    checkSession()
  }, [router])
  // --- END: Session Check Logic Integration ---


  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await fetch('https://formspree.io/f/xqawlaly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitMessage('Thank you for contacting us! We will get back to you soon.');
        setFormData({ name: '', email: '', message: '' });
      } else {
        setSubmitMessage('Something went wrong. Please try again.');
      }
    } catch (error) {
      setSubmitMessage('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    {
      icon: <FileText className="w-10 h-10" />,
      title: "Professional Invoicing",
      description: "Create stunning, customizable invoices in seconds with our intuitive drag-and-drop builder.",
      color: "from-blue-500 to-cyan-500",
      benefits: ["Multiple templates", "Custom branding", "Auto-numbering", "Tax calculations"]
    },
    {
      icon: <BarChart3 className="w-10 h-10" />,
      title: "Advanced Analytics",
      description: "Get deep insights into performance with real-time dashboards and predictive analytics.",
      color: "from-indigo-500 to-purple-500",
      benefits: ["Real-time reports", "Revenue forecasting", "Expense tracking", "Profit margins"]
    },
    {
      icon: <Users className="w-10 h-10" />,
      title: "Customer Management",
      description: "Manage your customers with a built-in CRM and automated payment tracking.",
      color: "from-purple-500 to-pink-500",
      benefits: ["Contact database", "Payment history", "Credit management", "Auto reminders"]
    },
  ];

  const stats = [
    { number: "50K+", label: "Active Businesses" },
    { number: "2M+", label: "Invoices Created" },
    { number: "99.9%", label: "Uptime SLA" },
    { number: "24/7", label: "Support" }
  ];

  const scrollToContact = () => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const PrivacyPolicyModal = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowPrivacyPolicy(false)}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-8 overflow-y-auto flex-1">
          <button onClick={() => setShowPrivacyPolicy(false)} className="absolute top-6 right-6 text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h2>
          <div className="prose prose-lg text-gray-600 space-y-4">
            <p className="text-sm text-gray-500">Last updated: November 2024</p>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6">1. Information We Collect</h3>
            <p>We collect information you provide directly to us, including name, email address, phone number, and any other information you choose to provide when using BillCraft services.</p>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6">2. How We Use Your Information</h3>
            <p>We use the information we collect to provide, maintain, and improve our services, process transactions, send you technical notices and support messages, and communicate with you about products, services, and events.</p>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6">3. Information Sharing</h3>
            <p>We do not share your personal information with third parties except as described in this policy. We may share information with service providers who perform services on our behalf, and when required by law.</p>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6">4. Data Security</h3>
            <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6">5. Your Rights</h3>
            <p>You have the right to access, update, or delete your personal information. You may also have the right to restrict or object to certain processing of your data.</p>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6">6. Cookies</h3>
            <p>We use cookies and similar tracking technologies to collect information about your browsing activities and to personalize your experience.</p>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6">7. Contact Us</h3>
            <p>If you have any questions about this Privacy Policy, please contact us at support@billcraft.com</p>
          </div>
        </div>
        <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-3xl">
          <button 
            onClick={() => setShowPrivacyPolicy(false)}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
          >
            I Accept
          </button>
        </div>
      </div>
    </div>
  );

  const TermsOfServiceModal = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowTermsOfService(false)}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-8 overflow-y-auto flex-1">
          <button onClick={() => setShowTermsOfService(false)} className="absolute top-6 right-6 text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h2>
          <div className="prose prose-lg text-gray-600 space-y-4">
            <p className="text-sm text-gray-500">Last updated: November 2024</p>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6">1. Acceptance of Terms</h3>
            <p>By accessing and using BillCraft services, you accept and agree to be bound by the terms and provision of this agreement.</p>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6">2. Use License</h3>
            <p>Permission is granted to temporarily use BillCraft for personal or commercial invoicing purposes. This is the grant of a license, not a transfer of title.</p>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6">3. User Accounts</h3>
            <p>You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.</p>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6">4. Service Availability</h3>
            <p>We strive to maintain 99.9% uptime but do not guarantee uninterrupted access to our services. We reserve the right to modify or discontinue services with or without notice.</p>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6">5. Payment Terms</h3>
            <p>Certain features require paid subscriptions. You agree to pay all fees according to the pricing and payment terms in effect at the time the fee becomes payable.</p>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6">6. Prohibited Uses</h3>
            <p>You may not use BillCraft for any illegal purposes, to transmit harmful code, or to violate any laws in your jurisdiction.</p>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6">7. Limitation of Liability</h3>
            <p>BillCraft shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.</p>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6">8. Termination</h3>
            <p>We may terminate or suspend your account and access to services immediately, without prior notice, for any breach of these Terms.</p>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6">9. Contact Information</h3>
            <p>For questions about these Terms, please contact us at support@billcraft.com</p>
          </div>
        </div>
        <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-3xl">
          <button 
            onClick={() => setShowTermsOfService(false)}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
          >
            I Accept
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          50% { transform: translateY(-100px) translateX(50px); opacity: 0.8; }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.4; }
        }
        @keyframes float-smooth {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-10px) translateX(-10px); }
          75% { transform: translateY(-30px) translateX(5px); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animate-float-particle { animation: float-particle 6s infinite; }
        .animation-delay-1000 { animation-delay: 1s; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-3000 { animation-delay: 3s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .animation-delay-500 { animation-delay: 0.5s; }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
        .animate-fade-in-down { animation: fade-in-down 1s ease-out; }
        .animate-fade-in-up { animation: fade-in-up 1s ease-out; }
        .animate-gradient-x { animation: gradient-x 3s ease infinite; }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
        .animate-float-smooth { animation: float-smooth 6s ease-in-out infinite; }
        .bg-300% { background-size: 300% 300%; }
        .bg-grid-pattern {
          background-image: linear-gradient(rgba(99, 102, 241, 0.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(99, 102, 241, 0.05) 1px, transparent 1px);
          background-size: 50px 50px;
        }
      `}</style>

      {showPrivacyPolicy && <PrivacyPolicyModal />}
      {showTermsOfService && <TermsOfServiceModal />}

      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full animate-float-particle"></div>
        <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-indigo-400 rounded-full animate-float-particle animation-delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-purple-400 rounded-full animate-float-particle animation-delay-2000"></div>
        <div className="absolute top-2/3 right-1/3 w-3 h-3 bg-cyan-400 rounded-full animate-float-particle animation-delay-3000"></div>
        
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      </div>

      {/* Mouse Follow Gradient */}
      <div 
        className="fixed inset-0 opacity-30 pointer-events-none transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.15), transparent 40%)`
        }}
      />

      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-xl shadow-lg' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg transform hover:rotate-12 transition-transform duration-300">
                <Receipt className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                BillCraft
              </span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Home</a>
              <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Features</a>
              <a href="#about" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">About</a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Contact</a>
              <Link href="/auth/login">
                <button className="px-6 py-2.5 text-blue-600 hover:text-blue-700 font-medium transition-colors">Sign In</button>
              </Link>
              <Link href="/auth/signup">
                <button className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-medium">Sign Up</button>
              </Link>
            </div>

            <button 
              className="md:hidden text-gray-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-lg">
            <div className="px-4 py-4 space-y-3">
              <a href="#home" className="block py-2 text-gray-700 hover:text-blue-600 transition-colors font-medium">Home</a>
              <a href="#features" className="block py-2 text-gray-700 hover:text-blue-600 transition-colors font-medium">Features</a>
              <a href="#about" className="block py-2 text-gray-700 hover:text-blue-600 transition-colors font-medium">About</a>
              <a href="#contact" className="block py-2 text-gray-700 hover:text-blue-600 transition-colors font-medium">Contact</a>
              <Link href="/auth/login">
                <button className="w-full py-2 text-blue-600 hover:text-blue-700 font-medium text-left transition-colors">Sign In</button>
              </Link>
              <Link href="/auth/signup">
                <button className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-xl transition-all duration-300 font-medium">Sign Up</button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="pt-32 sm:pt-40 pb-20 sm:pb-32 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 px-6 py-3 rounded-full text-sm font-medium mb-8 animate-bounce-slow shadow-lg">
            <Sparkles className="w-5 h-5 animate-spin-slow" />
            <span>Trusted by 50,000+ businesses worldwide</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-bold text-gray-900 leading-tight mb-8">
            <span className="block mb-4 animate-fade-in-down">Invoice</span>
            <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent animate-gradient-x bg-300% animate-float-smooth" style={{
              backgroundSize: '200% 200%',
              backgroundImage: 'linear-gradient(90deg, #2563eb, #4f46e5, #7c3aed, #2563eb)',
            }}>
              Smarter
            </span>
          </h1>

          <p className="text-xl sm:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-12 animate-fade-in-up">
            The intelligent invoicing platform designed for small businesses.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16 animate-fade-in-up animation-delay-500">
            <Link href="/auth/signup">
              <button className="group px-10 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:shadow-2xl hover:scale-105 transition-all duration-300 font-semibold text-lg flex items-center space-x-3 relative overflow-hidden">
                <span className="relative z-10">Get Started Now</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </Link>
            <a href="#features">
              <button className="px-10 py-5 bg-white text-gray-700 rounded-2xl border-2 border-gray-200 hover:border-blue-600 hover:text-blue-600 hover:shadow-xl transition-all duration-300 font-semibold text-lg">
                Explore Features
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center transform hover:scale-110 transition-transform duration-300">
                <div className="text-5xl lg:text-6xl font-bold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-lg text-blue-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Powerful Features for
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-2">
                Growing Businesses
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need in a single, streamlined platform.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-3xl`}></div>
                
                <div className={`relative w-20 h-20 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                  {feature.icon}
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">{feature.title}</h3>

                <p className="text-gray-600 leading-relaxed mb-6">
                  {feature.description}
                </p>

                <div className="space-y-2">
                  {feature.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-blue-50 relative z-10">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              About
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-2">
                BillCraft
              </span>
            </h2>

            <p className="text-lg text-gray-600 mb-6">
              BillCraft was created to make invoicing simple for everyone.
            </p>

            <p className="text-lg text-gray-600 mb-8">
              Our mission is to offer powerful tools without the complexity.
            </p>

            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <Award className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <div className="text-3xl font-bold">5+</div>
                <div className="text-sm text-gray-600">Years Experience</div>
              </div>

              <div className="text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <Users className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
                <div className="text-3xl font-bold">50K+</div>
                <div className="text-sm text-gray-600">Happy Customers</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-3xl blur-3xl opacity-20 animate-pulse-slow"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 hover:shadow-3xl transition-shadow duration-300">
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                    <Target className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Our Vision</h3>
                    <p className="text-gray-600">Simplify business finances</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Our Mission</h3>
                    <p className="text-gray-600">Enable business growth</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Our Values</h3>
                    <p className="text-gray-600">Trust & Excellence</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-blue-50 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Get In
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-2">
                Touch
              </span>
            </h2>
            <p className="text-xl text-gray-600">Send us a message anytime.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 lg:p-12">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Your Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none transition-colors"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none transition-colors"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={5}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none transition-colors resize-none"
                    placeholder="Tell us about your project..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 font-semibold text-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
                  {!isSubmitting && <Send className="w-5 h-5" />}
                </button>

                {submitMessage && (
                  <div className={`text-center p-4 rounded-xl ${submitMessage.includes('thank') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {submitMessage}
                  </div>
                )}
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-shadow duration-300">
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Email Us</h3>
                    <p className="text-gray-600">support@billcraft.com</p>
                    <p className="text-gray-600">ishita072004@gmail.com</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-shadow duration-300">
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Call Us</h3>
                    <p className="text-gray-600">+91 7015610516</p>
                    <p className="text-gray-600">Mon–Fri 9am to 6pm</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-shadow duration-300">
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Visit Us</h3>
                    <p className="text-gray-600">Chandigarh University, Punjab</p>
                    <p className="text-gray-600">India</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">

            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">BillCraft</span>
              </div>
              <p className="text-gray-400 mb-4">
                The intelligent invoicing platform for modern businesses.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#about" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><button onClick={scrollToContact} className="text-gray-400 hover:text-white transition-colors">Contact Us</button></li>
              </ul>
            </div>

          </div>

          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">© 2024 BillCraft. All rights reserved.</p>
            <div className="flex space-x-6 text-sm">
              <button onClick={() => setShowPrivacyPolicy(true)} className="text-gray-400 hover:text-white transition-colors">Privacy Policy</button>
              <button onClick={() => setShowTermsOfService(true)} className="text-gray-400 hover:text-white transition-colors">Terms of Service</button>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}