import { NeuronBackground } from './components/NeuronBackground';
import { PhysicsButtons } from './components/PhysicsButtons';
import { motion } from 'motion/react';

export default function App() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden text-white selection:bg-blue-500/30">
      <NeuronBackground />
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="flex flex-col items-center text-center mb-12"
        >
          <img 
            src="https://i.imgur.com/Q5eADHM.png" 
            alt="Omi Buzz Logo" 
            className="h-24 md:h-32 w-auto mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
            referrerPolicy="no-referrer"
          />
          <h1 className="text-7xl md:text-9xl font-protest tracking-wider bg-clip-text text-transparent bg-gradient-to-b from-white to-white/20 mb-4">
            Omi Buzz
          </h1>
          <p className="text-blue-400/60 font-mono text-sm tracking-widest uppercase">
            Interactive Digital Nexus
          </p>
        </motion.div>

        <div className="max-w-2xl text-center mb-24">
          <p className="text-zinc-400 text-lg leading-relaxed">
            Drag the nodes to interact with the ecosystem. 
            Experience the fluid motion of connectivity.
          </p>
        </div>
      </div>

      <PhysicsButtons />

      <footer className="fixed bottom-6 left-6 z-30 pointer-events-none">
        <p className="text-xs font-mono text-zinc-600 uppercase tracking-tighter">
          © 2026 Omi Buzz • Built with Physics
        </p>
      </footer>
    </main>
  );
}
