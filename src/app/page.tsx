import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
    return (
      <main className="bg-[#1f1b2e] text-[#f3e7d6] min-h-screen font-serif">
        {/* Hero */}
        <header className="px-6 py-20 text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Image
              src="/lamp.png"
              alt="Genie Lamp Icon"
              width={72}
              height={72}
            />
            <h1 className="text-5xl font-bold tracking-tight">PlaylistGenie</h1>
          </div>
          <p className="text-xl italic text-[#e0d2be] max-w-2xl mx-auto">
            Describe your vibe. We&apos;ll summon your soundtrack.
          </p>
          <div className="mt-8">
            <Link 
              href="/create"
              className="inline-block bg-[#e86f39] hover:bg-[#e85f20] text-white font-medium px-6 py-3 rounded-md text-lg"
            >
              Get Started
            </Link>
          </div>
        </header>
  
        {/* How it Works */}
        <section className="px-6 py-16 bg-[#2e293e]">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-semibold mb-6">How It Works</h2>
            <ol className="space-y-4 text-left text-lg list-decimal list-inside">
              <li><strong>Describe your vibe:</strong> Type anything—&ldquo;sunset rooftop wine night&rdquo; or &ldquo;underground club in 1992 Berlin.&rdquo;</li>
              <li><strong>Let us work the magic:</strong> We use language models to interpret the feeling, era, and energy.</li>
              <li><strong>Get a curated playlist:</strong> You&apos;ll get a mix of iconic and obscure songs that match your mood.</li>
            </ol>
          </div>
        </section>
  
        {/* Example Playlist */}
        <section className="px-6 py-16 text-center">
          <h2 className="text-3xl font-semibold mb-4">A Retro Night Out</h2>
          <p className="text-[#c9bcb2] mb-6 max-w-md mx-auto">
            Here&apos;s what a night of neon lights and leather jackets might sound like.
          </p>
          <ul className="text-lg space-y-1">
            <li>Don&apos;t You Want Me – The Human League</li>
            <li>Just Can&apos;t Get Enough – Depeche Mode</li>
            <li>Let&apos;s Hear It for the Boy – Deniece Williams</li>
            <li>Obsession – Animotion</li>
            <li>Electric Avenue – Eddy Grant</li>
          </ul>
        </section>
  
        {/* About */}
        <section className="px-6 py-16 bg-[#2e293e] text-center">
          <h2 className="text-3xl font-semibold mb-4">Not Just Another AI App</h2>
          <p className="text-[#c9bcb2] max-w-2xl mx-auto text-lg">
            PlaylistGenie is built for the music nerds who still make playlists like they&apos;re burning a CD. It&apos;s less about algorithms, more about feeling. Less generic recommendations, more weird gems you didn&apos;t know you needed.
          </p>
        </section>
  
        {/* Footer */}
        <footer className="px-6 py-10 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} PlaylistGenie — built with vibes.
        </footer>
      </main>
    );
}
