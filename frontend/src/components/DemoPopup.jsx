import { useState, useEffect } from 'react';

export default function DemoPopup() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // 6 minutes = 6 * 60 * 1000 = 360000 ms
    const timer = setTimeout(() => {
      setShow(true);
    }, 360000);

    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-slide-up relative border border-pf-border">
        <button 
          onClick={() => setShow(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          ✕
        </button>
        
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-5 mx-auto">
          <span className="text-2xl">👋</span>
        </div>
        
        <h2 className="text-xl font-bold text-center text-pf-text mb-3">Prototype Notice</h2>
        
        <div className="text-sm text-slate-600 space-y-4 text-center leading-relaxed">
          <p>
            This system was designed and developed by <strong>Himanshu Matta (Intern)</strong>.
          </p>
          <p>
            This is a completely functional prototype. Please note that the visual graphs, layout, and overall design are subject to iterative improvements and could be changed later on.
          </p>
        </div>
        
        <button 
          onClick={() => setShow(false)}
          className="mt-8 w-full pf-btn-primary justify-center py-2.5 rounded-lg font-bold text-white bg-pf-accent hover:bg-pf-accent/90"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
