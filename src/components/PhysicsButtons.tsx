import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface LinkButton {
  id: string;
  label: string;
  url: string;
  color: string;
}

export const PhysicsButtons: React.FC = () => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef(Matter.Engine.create());
  const [buttons, setButtons] = useState<{ id: string; body: Matter.Body; label: string; url: string; color: string }[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  const circleRadius = isMobile ? 40 : 55;

  const linkData: LinkButton[] = [
    { id: '1', label: 'FB', url: 'https://facebook.com', color: 'border-cyan-300/50 shadow-[0_0_20px_rgba(103,232,249,0.3)]' },
    { id: '2', label: 'YT', url: 'https://youtube.com', color: 'border-blue-300/50 shadow-[0_0_20px_rgba(147,197,253,0.3)]' },
    { id: '3', label: 'GH', url: 'https://github.com', color: 'border-emerald-300/50 shadow-[0_0_20px_rgba(110,231,183,0.3)]' },
    { id: '4', label: 'LI', url: 'https://linkedin.com', color: 'border-sky-300/50 shadow-[0_0_20px_rgba(125,211,252,0.3)]' },
    { id: '5', label: 'Port', url: '#', color: 'border-teal-300/50 shadow-[0_0_20px_rgba(94,234,212,0.3)]' },
    { id: '6', label: 'IG', url: 'https://instagram.com', color: 'border-lime-300/50 shadow-[0_0_20px_rgba(190,242,100,0.3)]' },
  ];

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const engine = engineRef.current;
    const world = engine.world;
    engine.gravity.y = 1.0;

    const render = Matter.Render.create({
      element: sceneRef.current!,
      engine: engine,
      options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false,
        background: 'transparent',
      },
    });

    render.canvas.className = "physics-canvas";

    // Boundaries - Very thick and wide to prevent escaping
    const wallThickness = 500;
    const ground = Matter.Bodies.rectangle(
      window.innerWidth / 2,
      window.innerHeight + wallThickness / 2,
      window.innerWidth * 10,
      wallThickness,
      { isStatic: true, friction: 0.5 }
    );
    // High ceiling to allow initial fall but prevent escaping when thrown
    const ceiling = Matter.Bodies.rectangle(
      window.innerWidth / 2,
      -2000, 
      window.innerWidth * 10,
      wallThickness,
      { isStatic: true }
    );
    const leftWall = Matter.Bodies.rectangle(
      -wallThickness / 2,
      window.innerHeight / 2,
      wallThickness,
      window.innerHeight * 20,
      { isStatic: true, friction: 0.5 }
    );
    const rightWall = Matter.Bodies.rectangle(
      window.innerWidth + wallThickness / 2,
      window.innerHeight / 2,
      wallThickness,
      window.innerHeight * 20,
      { isStatic: true, friction: 0.5 }
    );

    Matter.World.add(world, [ground, ceiling, leftWall, rightWall]);

    // Create circular bodies - Spawn in a vertical line above the screen
    const newButtons = linkData.map((link, i) => {
      const x = window.innerWidth / 2 + (Math.random() * 40 - 20); 
      const y = -200 - (i * (circleRadius * 2.5)); 
      const body = Matter.Bodies.circle(x, y, circleRadius, {
        restitution: 0.8,
        friction: 0.1,
        frictionAir: 0.01,
        density: 0.001,
        label: link.url // Store URL in label for easy access
      });
      return { ...link, body };
    });

    Matter.World.add(world, newButtons.map(b => b.body));

    const mouse = Matter.Mouse.create(render.canvas);
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false },
      },
    });

    // Cursor handling and Click handling
    let dragStartPos = { x: 0, y: 0 };
    let isDragging = false;

    Matter.Events.on(mouseConstraint, 'mousedown', (event) => {
      dragStartPos = { ...event.mouse.position };
      isDragging = false;
    });

    Matter.Events.on(mouseConstraint, 'mousemove', (event) => {
      const mousePos = event.mouse.position;
      const bodies = Matter.Composite.allBodies(world).filter(b => !b.isStatic);
      const hoveredBody = Matter.Query.point(bodies, mousePos)[0];
      
      if (hoveredBody) {
        render.canvas.style.cursor = 'pointer';
      } else {
        render.canvas.style.cursor = 'default';
      }

      if (Math.abs(mousePos.x - dragStartPos.x) > 5 || Math.abs(mousePos.y - dragStartPos.y) > 5) {
        isDragging = true;
      }
    });

    Matter.Events.on(mouseConstraint, 'mouseup', (event) => {
      if (!isDragging) {
        const mousePos = event.mouse.position;
        const bodies = Matter.Composite.allBodies(world).filter(b => !b.isStatic);
        const clickedBody = Matter.Query.point(bodies, mousePos)[0];
        
        if (clickedBody && clickedBody.label && clickedBody.label !== 'Circle Body') {
          window.open(clickedBody.label, '_blank');
        }
      }
    });

    Matter.World.add(world, mouseConstraint);
    render.mouse = mouse;

    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);

    setButtons(newButtons);

    const updatePositions = () => {
      setButtons(prev => prev.map(btn => {
        const speed = btn.body.speed;
        const maxSquish = 0.25; // Max 25% deformation
        const squishFactor = Math.min(speed * 0.015, maxSquish);
        
        // Determine direction of travel for stretching
        const angle = Math.atan2(btn.body.velocity.y, btn.body.velocity.x);
        
        return { 
          ...btn, 
          squish: squishFactor,
          renderAngle: angle
        };
      }));
      requestAnimationFrame(updatePositions);
    };
    const animId = requestAnimationFrame(updatePositions);

    const handleResize = () => {
      render.canvas.width = window.innerWidth;
      render.canvas.height = window.innerHeight;
      Matter.Body.setPosition(ground, { x: window.innerWidth / 2, y: window.innerHeight + wallThickness / 2 });
      Matter.Body.setPosition(ceiling, { x: window.innerWidth / 2, y: -wallThickness / 2 });
      Matter.Body.setPosition(leftWall, { x: -wallThickness / 2, y: window.innerHeight / 2 });
      Matter.Body.setPosition(rightWall, { x: window.innerWidth + wallThickness / 2, y: window.innerHeight / 2 });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engine);
      Matter.World.clear(world, false);
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return (
    <div ref={sceneRef} className="fixed inset-0 pointer-events-none overflow-hidden bg-transparent z-20">
      <style dangerouslySetInnerHTML={{ __html: `
        .physics-canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: auto;
          opacity: 0;
          z-index: 50;
          touch-action: none;
        }
      `}} />
      
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        {buttons.map((btn, i) => {
          const nextBtn = buttons[(i + 1) % buttons.length];
          return (
            <line
              key={`line-${btn.id}-${nextBtn.id}`}
              x1={btn.body.position.x}
              y1={btn.body.position.y}
              x2={nextBtn.body.position.x}
              y2={nextBtn.body.position.y}
              stroke="rgba(0, 180, 255, 0.2)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          );
        })}
      </svg>

      {buttons.map((btn) => {
        const squish = (btn as any).squish || 0;
        const renderAngle = (btn as any).renderAngle || 0;
        
        return (
          <div
            key={btn.id}
            className={cn(
              "absolute flex flex-col items-center justify-center rounded-full text-white font-bold transition-none z-10 pointer-events-none select-none overflow-visible",
              "bg-white/5 backdrop-blur-[1px] border-2",
              btn.color
            )}
            style={{
              width: circleRadius * 2,
              height: circleRadius * 2,
              left: btn.body.position.x - circleRadius,
              top: btn.body.position.y - circleRadius,
              // Apply squish: stretch in direction of travel, squash perpendicular
              transform: `rotate(${renderAngle}rad) scale(${1 + squish}, ${1 - squish}) rotate(${-renderAngle}rad) rotate(${btn.body.angle}rad)`,
            }}
          >
            {/* Main Specular Highlight (Top Left) */}
            <div className="absolute top-[10%] left-[15%] w-[45%] h-[35%] bg-gradient-to-br from-white/90 via-white/40 to-transparent rounded-[40%_50%_30%_40%] blur-[1px] rotate-[-15deg]" />
            
            {/* Secondary Highlight (Bottom Right) */}
            <div className="absolute bottom-[15%] right-[20%] w-[20%] h-[20%] bg-white/30 rounded-full blur-[2px]" />
            
            {/* Rim Light / Glow */}
            <div className="absolute inset-0 rounded-full shadow-[inset_0_0_15px_rgba(255,255,255,0.4)]" />

            <span className="uppercase tracking-widest relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] text-white/90">
              {btn.label}
            </span>
            <ExternalLink size={isMobile ? 10 : 12} className="mt-1 opacity-60 relative z-10" />
          </div>
        );
      })}
    </div>
  );
};
