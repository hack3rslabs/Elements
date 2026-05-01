import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, Facebook, Instagram, Twitter, Youtube, Award } from "lucide-react";

export function Footer() {
    return (
        <footer className="bg-[#0a0a0a] text-gray-300">
            {/* Main Footer */}
            <div className="container py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Brand */}
                    <div className="space-y-4">
                        <Link href="/" className="inline-block">
                            <Image
                                src="/images/brand/elements-logo.png"
                                alt="Elements - World Class Elements"
                                width={160}
                                height={48}
                                className="h-12 w-auto object-contain "
                            />
                        </Link>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            <strong className="text-white">Sree Kameswari Hindustan Elements</strong> — Premium home construction and décor products. Elevating living spaces with quality kitchen sinks, flooring, tiles, and elevation solutions.
                        </p>
                        {/* 15 Years Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/20">
                            <Award className="h-5 w-5 text-amber-400" />
                            <div>
                                <span className="text-amber-300 font-bold text-sm">15+ Years</span>
                                <span className="block text-[10px] text-amber-400/70 -mt-0.5">in the Market</span>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-1">
                            {[
                                { icon: Facebook, href: "#", label: "Facebook" },
                                { icon: Instagram, href: "#", label: "Instagram" },
                                { icon: Twitter, href: "#", label: "Twitter" },
                                { icon: Youtube, href: "#", label: "YouTube" },
                            ].map(({ icon: Icon, href, label }) => (
                                <a key={label} href={href} aria-label={label} className="h-9 w-9 rounded-lg bg-white/5 hover:bg-[#1877F2] flex items-center justify-center transition-all duration-300 hover:scale-110">
                                    <Icon className="h-4 w-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Quick Links</h4>
                        <ul className="space-y-2.5">
                            {[
                                { name: "About Us", href: "/about" },
                                { name: "Contact Us", href: "/contact" },
                                { name: "Blog", href: "/blog" },
                                { name: "FAQs", href: "/faq" },
                                { name: "Track Order", href: "/track-order" },
                                { name: "Bulk Inquiry", href: "/bulk-inquiry" },
                            ].map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-sm text-gray-400 hover:text-[#1877F2] transition-colors">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Categories
                    <div>
                        <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Categories</h4>
                        <ul className="space-y-2.5">
                            {[
                                { name: "Kitchen Sinks", href: "/category/kitchen" },
                                { name: "Artificial Grass", href: "/category/artificial-grass" },
                                { name: "Aluminium Insulation", href: "/category/aluminium-insulation" },
                                { name: "Manhole Covers", href: "/category/manhole-covers" },
                                { name: "Terracota Products", href: "/category/terracota-products" },
                                { name: "Tile Adhesive & Epoxy", href: "/category/tile-adhesive-epoxy" },
                                { name: "PVD Profiles & Sheets", href: "/category/pvd-profiles-sheets" },
                                { name: "Floor Protection", href: "/category/floor-protection" },
                            ].map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-sm text-gray-400 hover:text-[#1877F2] transition-colors">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    // </div> */}

                    {/* Branches */}
                    <div>
                        <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Our Branches</h4>
                        <ul className="space-y-4">
                            {[
                                { city: "Visakhapatnam", addr: "Near krishna college , Maddilapalem", href: "https://www.google.com/maps/place/Sree+Kameswari+Ceramics/@17.7417647,83.3245967,17z/data=!3m1!4b1!4m6!3m5!1s0x3a39432f1a682a31:0x23f216d34951248a!8m2!3d17.7417647!4d83.3245967!16s%2Fg%2F11fwhctm7z" },
                                { city: "Bangalore", addr: "Industrial Suburb, Yeswanthapur", href: "https://www.google.com/maps/search/Hindustan+Elements+Yeswanthapur" },
        
                            ].map((branch) => (
                                <li key={branch.city}>
                                    <a href={branch.href} target="_blank" rel="noopener noreferrer" className="block group">
                                        <span className="text-md font-semibold text-gray-300 group-hover:text-[#1877F2] transition-colors block">{branch.city}</span>
                                        <span className="text-sm text-gray-500 group-hover:text-gray-400 transition-colors leading-tight">{branch.addr}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Contact Us</h4>
                        <ul className="space-y-4">
                            <li>
                                <a href="tel:+919866753070" className="flex items-center gap-3 text-sm text-gray-400 hover:text-[#1877F2] transition-colors">
                                    <Phone className="h-4 w-4 shrink-0 text-[#1877F2]" />
                                    +91 98667 53070
                                </a>
                            </li>
                            <li>
                                <a href="mailto:support@hindusthanelements.com" className="flex items-center gap-3 text-sm text-gray-400 hover:text-[#1877F2] transition-colors">
                                    <Mail className="h-4 w-4 shrink-0 text-[#1877F2]" />
                                    support@hindusthanelements.com
                                </a>
                            </li>
                            <li className="pt-2 border-t border-white/5">
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Social Proof</p>
                                <div className="flex bg-white/5 rounded-lg p-2 items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-[#1877F2] flex items-center justify-center text-[10px] font-bold">10K+</div>
                                    <p className="text-[10px] leading-tight text-gray-400">Happy customers served across South India</p>
                                </div>
                            </li>
                            <li className="pt-4">
                                <h5 className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">We Accept</h5>
                                <div className="flex gap-2 flex-wrap">
                                    {["UPI", "Cards", "Net Banking", "EMI", "COD"].map((method) => (
                                        <span key={method} className="px-2 py-1 rounded bg-white/5 text-[10px] font-medium text-gray-400">
                                            {method}
                                        </span>
                                    ))}
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-white/5">
                <div className="container py-5 flex flex-col md:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-gray-500">
                        © 2026 Sree Kameswari Hindustan Elements. All rights reserved. | GST: XXXXXXXXXXXX
                    </p>
                    <div className="flex gap-4 text-xs text-gray-500">

                        <Link href="/https://twiis.in/" className="hover:text-gray-300 transition-colors">Developed by TWIIS INNOVATIONS </Link>
                        
                    </div>
                </div>
            </div>
        </footer>
    );
}


