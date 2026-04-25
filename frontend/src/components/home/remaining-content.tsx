"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Award, ShieldCheck, Truck, Headphones, Phone, 
  CheckCircle2, MessageCircle, Send, Star, MapPin 
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export function RemainingContent() {
  return (
    <>
      {/* ============ TRUST BAR ============ */}
      {/* <section className="bg-white py-4 border-b">
        <div className="container">
          <div className="flex items-center justify-center gap-6 md:gap-12 overflow-x-auto whitespace-nowrap text-xs md:text-sm text-muted-foreground">
            {[
              { icon: Award, text: "15+ Years in the Market", highlight: true },
              { icon: ShieldCheck, text: "ISO Certified", highlight: false },
              { icon: Truck, text: "Free Delivery ₹5K+", highlight: false },
              { icon: Headphones, text: "Expert Support", highlight: false },
              { icon: Phone, text: "Call: +91 98765 43210", highlight: false },
            ].map(item => (
              <div key={item.text} className={`flex items-center gap-1.5 shrink-0 ${item.highlight ? 'text-amber-600 font-bold' : ''}`}>
                <item.icon className={`h-4 w-4 ${item.highlight ? 'text-amber-500' : 'text-[#1877F2]'}`} />
                <span className={item.highlight ? '' : 'font-medium'}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* ============ WHY CHOOSE US ============ */}
      <section className="py-12 md:py-20 bg-gradient-to-br from-[#f0f7ff] to-[#e7f3ff]">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" variants={fadeUp} viewport={{ once: true }} className="text-center mb-10 md:mb-14">
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight">Why Builders & Homeowners Choose Us</h2>
            <p className="text-muted-foreground mt-2 text-sm md:text-lg">Quality you can trust, support you can rely on</p>
          </motion.div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {[
              { icon: ShieldCheck, title: "Quality Assured", desc: "Every product undergoes rigorous quality testing. ISO certified.", color: "from-blue-500 to-blue-600" },
              { icon: Truck, title: "Free Delivery", desc: "Free shipping on orders above ₹5,000. Pan-India delivery.", color: "from-emerald-500 to-green-600" },
              { icon: Headphones, title: "Expert Support", desc: "Call anytime for product guidance, installation help, and sizing.", color: "from-purple-500 to-violet-600" },
              { icon: Award, title: "25 Yr Warranty", desc: "Up to 25 years warranty on products. Free replacement for defects.", color: "from-amber-500 to-orange-600" },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial="hidden" whileInView="visible" variants={fadeUp} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-5 md:p-8 shadow-sm hover:shadow-lg transition-all duration-300 group text-center"
              >
                <div className={`inline-flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <item.icon className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <h3 className="font-semibold text-sm md:text-lg mb-1.5">{item.title}</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CONTACT CTA FOR BUILDERS ============ */}
      <section className="py-12 md:py-16 bg-[#0a0a0a] text-white">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#1877F2] font-semibold">For Builders & Contractors</span>
              <h2 className="text-2xl md:text-4xl font-bold mt-2">Need Bulk Pricing?</h2>
              <p className="text-gray-400 mt-3 text-sm md:text-base leading-relaxed">
                We offer exclusive pricing for builders, contractors, architects, and construction companies. Get up to <span className="text-white font-semibold">15% off</span> on bulk orders with free site visit consultation.
              </p>
              <ul className="mt-4 space-y-2">
                {["Special project pricing", "Free site visit & measurement", "Dedicated account manager", "Priority delivery & installation support"].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h3 className="font-semibold text-lg mb-4">Get In Touch</h3>
              <div className="space-y-3">
                <a href="tel:+919876543210" className="flex items-center gap-3 bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-[#1877F2] flex items-center justify-center shrink-0">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Call Us</p>
                    <p className="text-xs text-gray-400">+919995552252</p>
                  </div>
                </a>
                <a href={`https://wa.me/919876543210?text=${encodeURIComponent("Hi! I need bulk pricing for my project.")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-[#25D366] flex items-center justify-center shrink-0">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">WhatsApp</p>
                    <p className="text-xs text-gray-400">Quick response guaranteed</p>
                  </div>
                </a>
                <Link href="/contact" className="flex items-center gap-3 bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
                    <Send className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Send Inquiry</p>
                    <p className="text-xs text-gray-400">We respond within 2 hours</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" variants={fadeUp} viewport={{ once: true }} className="text-center mb-10 md:mb-14">
            <h2 className="text-2xl md:text-4xl font-bold">What Customers Say</h2>
            <p className="text-muted-foreground mt-2 text-sm md:text-lg">Real reviews from builders, contractors & homeowners</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            {[
              { name: "Rajesh Kumar", role: "Builder", location: "Delhi", rating: 5, text: "The stainless steel sink quality is absolutely premium. Have ordered 50+ units for my project. Great bulk pricing and delivery!", avatar: "RK" },
              { name: "Priya Sharma", role: "Homeowner", location: "Mumbai", rating: 5, text: "Mitti Magic elevation panels transformed my home exterior. Everyone compliments the traditional terracotta look. 25 year warranty gives peace of mind.", avatar: "PS" },
              { name: "Amit Patel", role: "Contractor", location: "Ahmedabad", rating: 5, text: "We use Elements tiles for all our projects. Consistent quality, excellent bulk rates, and the support team helps with measurements. Highly recommended for contractors!", avatar: "AP" },
            ].map((review, i) => (
              <motion.div
                key={review.name}
                initial="hidden" whileInView="visible" variants={fadeUp} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-gray-50 rounded-2xl p-6 md:p-8 border"
              >
                <div className="flex items-center gap-1 mb-3">
                  {Array(review.rating).fill(0).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">&ldquo;{review.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#1877F2] to-[#0d47a1] flex items-center justify-center text-white font-semibold text-sm">
                    {review.avatar}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{review.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {review.location} • {review.role}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ NEWSLETTER ============ */}
      {/* <section className="py-12 md:py-20 bg-gradient-to-r from-[#1877F2] to-[#0d47a1]">
        <div className="container">
          {/* <motion.div initial="hidden" whileInView="visible" variants={fadeUp} viewport={{ once: true }} className="max-w-2xl mx-auto text-center text-white">
            <h2 className="text-2xl md:text-4xl font-bold mb-3">Stay Updated</h2>
            <p className="text-white/80 mb-6 text-sm md:text-lg">Get exclusive deals, new products, and builder tips.</p>
            {subscribed ? (
              <div className="bg-white/20 rounded-2xl p-6 backdrop-blur-sm">
                <p className="text-xl font-semibold">🎉 Thank you for subscribing!</p>
                <p className="text-white/80 mt-2">You&apos;ll receive our latest updates and offers.</p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 h-12 rounded-full px-5 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white shadow-xl"
                />
                <Button onClick={handleSubscribe} size="lg" className="bg-white text-[#1877F2] hover:bg-gray-100 rounded-full h-12 px-6 font-semibold shadow-xl">
                  <Send className="h-4 w-4 mr-2" /> Subscribe
                </Button>
              </div>
            )}
          </motion.div> */}
        {/* </div>
      </section>  */}
      
    </>
  );
}
