import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-900 text-gray-200 flex flex-col items-center justify-center p-6 selection:bg-indigo-500 selection:text-white">
      <main className="max-w-2xl w-full text-center space-y-8">
        <header>
          <h1 className="text-5xl font-bold text-indigo-400 mb-3">
            🎶 PlaylistGenie
          </h1>
          <p className="text-2xl text-gray-300">
            Your Vibe, Pressed to Tape
          </p>
        </header>

        <section className="text-lg text-gray-300">
          <p>
            PlaylistGenie is a retro-inspired music tool that turns your mood into a mixtape—instantly.
            No more endless scrolling or decision fatigue. Just pure, personalized vibes ready for your ears.
          </p>
        </section>

        <section className="bg-slate-800 p-6 rounded-lg shadow-xl">
          <h2 className="text-3xl font-semibold text-indigo-300 mb-4">
            ✨ What Makes It Different?
          </h2>
          <ul className="space-y-3 text-left text-gray-300 list-disc list-inside pl-4">
            <li>
              <span className="font-semibold text-indigo-400">Mood-Powered Playlists:</span> Simply describe your desired atmosphere, and let our AI curate the perfect soundtrack.
            </li>
            <li>
              <span className="font-semibold text-indigo-400">Nostalgic Charm:</span> We embrace the golden era of mixtapes with a fun, retro-inspired interface.
            </li>
            <li>
              <span className="font-semibold text-indigo-400">Instant Gratification:</span> Get your playlist generated in seconds, not hours.
            </li>
            <li>
              <span className="font-semibold text-indigo-400">Spotify Integration:</span> Seamlessly create and save your new favorite playlists directly to your Spotify account.
            </li>
          </ul>
        </section>

        <section>
          <p className="text-xl italic text-indigo-300 mb-6">
            Describe your vibe. We’ll summon your soundtrack.
          </p>
          <Link href="/create" passHref>
            <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-8 rounded-lg text-xl shadow-lg hover:shadow-xl transition-all duration-200 ease-in-out transform hover:scale-105">
              Create Your Mixtape
            </button>
          </Link>
        </section>
      </main>

      <footer className="mt-12 text-center text-gray-500">
        <p>&copy; {new Date().getFullYear()} PlaylistGenie. All rights reserved.</p>
      </footer>
    </div>
  );
}
