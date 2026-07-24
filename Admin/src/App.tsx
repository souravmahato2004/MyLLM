function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <header className="border-b border-slate-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold text-cyan-400">
            Admin Dashboard
          </h1>

          <nav className="flex gap-6 text-sm text-slate-300">
            <a href="#" className="hover:text-cyan-400 transition">
              Home
            </a>
            <a href="#" className="hover:text-cyan-400 transition">
              Features
            </a>
            <a href="#" className="hover:text-cyan-400 transition">
              Contact
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="mx-auto flex max-w-7xl flex-col items-center justify-center px-6 py-24 text-center">
        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1 text-sm text-cyan-400">
          React + TypeScript + Tailwind
        </span>

        <h2 className="mt-6 text-5xl font-bold leading-tight">
          Build Modern Web Apps Faster
        </h2>

        <p className="mt-4 max-w-2xl text-lg text-slate-400">
          A simple starter template with React, TypeScript, and Tailwind CSS.
          Customize it to fit your project.
        </p>

        <div className="mt-8 flex gap-4">
          <button className="rounded-lg bg-cyan-500 px-6 py-3 font-medium text-slate-950 transition hover:bg-cyan-400">
            Get Started
          </button>

          <button className="rounded-lg border border-slate-700 px-6 py-3 font-medium transition hover:border-cyan-400 hover:text-cyan-400">
            Learn More
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} MyApp. All rights reserved.
      </footer>
    </div>
  );
}

export default App;