import Link from 'next/link';
import Image from 'next/image';
import { FaMagic, FaMusic, FaHeart } from 'react-icons/fa';

export default function HomePage() {
    return (
      <main className="bg-[#1f1b2e] text-[#f3e7d6] min-h-screen font-serif">
        {/* Hero */}
        <header className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#2e293e] via-[#1f1b2e] to-[#2e293e] opacity-90"></div>
          <div className="relative px-6 py-32 text-center max-w-6xl mx-auto">
            <div className="flex items-center justify-center gap-4 mb-8">
              <Image
                src="/lamp.png"
                alt="Genie Lamp Icon"
                width={96}
                height={96}
                className="animate-float"
              />
              <h1 className="text-6xl font-bold tracking-tight bg-gradient-to-r from-[#e86f39] to-[#e85f20] bg-clip-text text-transparent">
                PlaylistGenie
              </h1>
            </div>
            <p className="text-2xl italic text-[#e0d2be] max-w-2xl mx-auto mb-12">
              Describe your vibe. We&apos;ll summon your soundtrack.
            </p>
            <div className="flex gap-4 justify-center">
              <Link 
                href="/create"
                className="inline-block bg-[#e86f39] hover:bg-[#e85f20] text-white font-medium px-8 py-4 rounded-full text-lg transition-all hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Get Started
              </Link>
              <Link 
                href="/examples"
                className="inline-block border-2 border-[#e86f39] text-[#e86f39] hover:bg-[#e86f39] hover:text-white font-medium px-8 py-4 rounded-full text-lg transition-all"
              >
                View Examples
              </Link>
            </div>
          </div>
        </header>

        {/* How it Works */}
        <section className="px-6 py-24 bg-[#2e293e]">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-semibold mb-16 text-center">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-[#1f1b2e] p-8 rounded-2xl text-center hover:transform hover:scale-105 transition-all">
                <div className="w-16 h-16 bg-[#e86f39] rounded-full flex items-center justify-center mx-auto mb-6">
                  <FaMagic className="text-2xl text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Describe Your Vibe</h3>
                <p className="text-[#c9bcb2]">Type anything—&ldquo;sunset rooftop wine night&rdquo; or &ldquo;underground club in 1992 Berlin.&rdquo;</p>
              </div>
              <div className="bg-[#1f1b2e] p-8 rounded-2xl text-center hover:transform hover:scale-105 transition-all">
                <div className="w-16 h-16 bg-[#e86f39] rounded-full flex items-center justify-center mx-auto mb-6">
                  <FaMusic className="text-2xl text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Magic Happens</h3>
                <p className="text-[#c9bcb2]">We use advanced AI to interpret the feeling, era, and energy of your request.</p>
              </div>
              <div className="bg-[#1f1b2e] p-8 rounded-2xl text-center hover:transform hover:scale-105 transition-all">
                <div className="w-16 h-16 bg-[#e86f39] rounded-full flex items-center justify-center mx-auto mb-6">
                  <FaHeart className="text-2xl text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Get Your Playlist</h3>
                <p className="text-[#c9bcb2]">Receive a curated mix of iconic and obscure songs that perfectly match your mood.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Example Playlist */}
        <section className="px-6 py-24">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-semibold mb-4 text-center">A Retro Night Out</h2>
            <p className="text-[#c9bcb2] mb-12 text-center max-w-2xl mx-auto text-lg">
              Here&apos;s what a night of neon lights and leather jackets might sound like.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "Don't You Want Me", artist: "The Human League", year: "1981" },
                { title: "Just Can't Get Enough", artist: "Depeche Mode", year: "1981" },
                { title: "Let's Hear It for the Boy", artist: "Deniece Williams", year: "1984" },
                { title: "Obsession", artist: "Animotion", year: "1984" },
                { title: "Electric Avenue", artist: "Eddy Grant", year: "1982" },
              ].map((song, index) => (
                <div key={index} className="bg-[#2e293e] p-6 rounded-xl hover:bg-[#3a3448] transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#e86f39] rounded-lg flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold">{song.title}</h3>
                      <p className="text-[#c9bcb2] text-sm">{song.artist} • {song.year}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="px-6 py-24 bg-[#2e293e]">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-semibold mb-16 text-center">What People Are Saying</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  quote: "PlaylistGenie created the perfect soundtrack for my beach wedding. It was like it read my mind!",
                  author: "Sarah M.",
                  role: "Newlywed"
                },
                {
                  quote: "I use it for my yoga classes. The playlists always match the energy I'm going for.",
                  author: "Michael T.",
                  role: "Yoga Instructor"
                },
                {
                  quote: "Finally, an AI that understands my obscure music taste. The recommendations are spot on!",
                  author: "Alex K.",
                  role: "Music Producer"
                }
              ].map((testimonial, index) => (
                <div key={index} className="bg-[#1f1b2e] p-8 rounded-2xl">
                  <p className="text-lg mb-6 italic">&ldquo;{testimonial.quote}&rdquo;</p>
                  <div>
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-[#c9bcb2] text-sm">{testimonial.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About */}
        <section className="px-6 py-24">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-4xl font-semibold mb-6">Not Just Another AI App</h2>
            <p className="text-[#c9bcb2] max-w-3xl mx-auto text-lg leading-relaxed">
              PlaylistGenie is built for the music nerds who still make playlists like they&apos;re burning a CD. 
              It&apos;s less about algorithms, more about feeling. Less generic recommendations, more weird gems 
              you didn&apos;t know you needed.
            </p>
            <div className="mt-12 flex justify-center gap-6">
              <Link 
                href="/about"
                className="text-[#e86f39] hover:text-[#e85f20] font-medium"
              >
                Learn More →
              </Link>
              <Link 
                href="/contact"
                className="text-[#e86f39] hover:text-[#e85f20] font-medium"
              >
                Contact Us →
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 py-16 bg-[#2e293e]">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 mb-12">
              <div>
                <h3 className="font-semibold mb-4">PlaylistGenie</h3>
                <p className="text-sm text-[#c9bcb2]">
                  Your AI-powered playlist companion for every mood and moment.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Quick Links</h4>
                <ul className="space-y-2 text-sm text-[#c9bcb2]">
                  <li><Link href="/create" className="hover:text-[#e86f39]">Create Playlist</Link></li>
                  <li><Link href="/examples" className="hover:text-[#e86f39]">Examples</Link></li>
                  <li><Link href="/about" className="hover:text-[#e86f39]">About</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Legal</h4>
                <ul className="space-y-2 text-sm text-[#c9bcb2]">
                  <li><Link href="/privacy" className="hover:text-[#e86f39]">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-[#e86f39]">Terms of Service</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Connect</h4>
                <ul className="space-y-2 text-sm text-[#c9bcb2]">
                  <li><Link href="https://twitter.com" className="hover:text-[#e86f39]">Twitter</Link></li>
                  <li><Link href="https://instagram.com" className="hover:text-[#e86f39]">Instagram</Link></li>
                </ul>
              </div>
            </div>
            <div className="pt-8 border-t border-[#3a3448] text-center text-sm text-[#c9bcb2]">
              &copy; {new Date().getFullYear()} Cherry Road — built with ❤️ in Brooklyn 
            </div>
          </div>
        </footer>
      </main>
    );
}
