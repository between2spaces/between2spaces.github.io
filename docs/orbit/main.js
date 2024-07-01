const object_scale = 1 / 1e29;
const distance_scale = 1 / 1e9;

class Body {
	constructor(name, colour, x, y, vx, vy, mass) {
		this.name = name;
		this.x = x;
		this.y = y;
		this.vx = vx;
		this.vy = vy;
		this.mass = mass;
		this.renderSize = Math.max(mass * object_scale, 3);
		this.renderDom = document.createElement("div");
		this.renderDom.style.position = "absolute";
		this.renderDom.style.width = `${this.renderSize}px`;
		this.renderDom.style.height = `${this.renderSize}px`;
		this.renderDom.style.borderRadius = `${this.renderSize * 0.5}px`;
		this.renderDom.style.background = colour;
		document.body.append(this.renderDom);
	}
}

class Simulation {
	constructor(G = 6.67430e-11) {
		this.bodies = [];
		this.G = G;
		this.firstUpdate = true;
	}

	addBody(body) {
		this.bodies.push(body);
	}

	update(dt) {
		for (let i = 0; i < this.bodies.length; i++) {
			let body1 = this.bodies[i];

			if (body1.destroyed) continue;

			let fx = 0, fy = 0;

			for (let j = 0; j < this.bodies.length; j++) {
				if (i === j) continue;

				let body2 = this.bodies[j];

				if (body2.destroyed) continue;

				let dx = body2.x - body1.x;
				let dy = body2.y - body1.y;
				let distSq = dx * dx + dy * dy;
				let dist = Math.sqrt(distSq);

				if (!this.firstUpdate && body1.mass >= body2.mass && dist < 1280721870) {
					console.log(`${body2.name} absorbed into ${body1.name}`);
					body1.mass += body2.mass;
					body1.renderSize = Math.max(body1.mass * object_scale, 3);
					body1.renderDom.style.width = `${this.renderSize}px`;
					body1.renderDom.style.height = `${this.renderSize}px`;
					body2.destroyed = true;
					body2.renderDom.remove();
				}

				let force = this.G * body1.mass * body2.mass / distSq;
				fx += force * dx / dist;
				fy += force * dy / dist;
			}

			body1.vx += fx / body1.mass * dt;
			body1.vy += fy / body1.mass * dt;
			body1.x += body1.vx * dt;
			body1.y += body1.vy * dt;

			body1.renderDom.style.transform = `translate(${body1.x * distance_scale}px, ${body1.y * distance_scale}px)`;
		}
		this.firstUpdate = false;
	}
}

// Example usage:
let sim = new Simulation();

// Add a "sun" at the center
sim.addBody(new Body("sun", "yellow", 0, 0, 0, 0, 1.989e30));

// Add an "earth" orbiting the sun
sim.addBody(new Body("earth", "blue", 149.6e9, 0, 0, 29.78e3, 5.972e24));

for (let i = 0; i < 500; i++) {
	sim.addBody(new Body("obj", "white", Math.random() * 149.6e9, 0, 0, 29.78e3 + (Math.random() * 50000 - 25000), Math.random() * 7.972e24));
}
// Simulation loop
function run() {
	sim.update(3600); // Update every hour
	requestAnimationFrame(run);
}

run();
