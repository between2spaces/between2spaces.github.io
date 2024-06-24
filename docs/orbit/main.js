// Constants
const G = 6.67430e-11; // Universal gravitational constant (m^3 kg^-1 s^-2)
const M = 5.972e24; // Earth's mass (kg)
const R = 6371e3; // Earth's radius (m)

// Initial conditions
let satellite = {
	rx: R + 500e3, // Initial x position (m)
	ry: 0, // Initial y position (m)
	vx: 0, // Initial x velocity (m/s)
	vy: 7660 // Initial y velocity (m/s)
};

// Canvas setup
const canvas = document.getElementById('orbitCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Scale factor for drawing
const scaleFactor = 0.00001; // Adjust as needed

// Simulation parameters
const dt = 60; // Time step (seconds)

// Function to calculate gravitational force
function gravitationalForce(x, y) {
	const r = Math.sqrt(x * x + y * y);
	const F = (-G * M) / (r * r);
	return { fx: F * (x / r), fy: F * (y / r) };
}

// Function to update satellite position and velocity
function updateSatellite() {
	// Calculate forces
	const { fx, fy } = gravitationalForce(satellite.rx, satellite.ry);

	// Update velocities
	satellite.vx += fx * dt;
	satellite.vy += fy * dt;

	// Update positions
	satellite.rx += satellite.vx * dt;
	satellite.ry += satellite.vy * dt;
}

// Function to draw satellite orbit
function draw() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// Earth
	const earthX = canvas.width / 2;
	const earthY = canvas.height / 2;
	const earthRadius = R * scaleFactor * canvas.width;

	ctx.beginPath();
	ctx.arc(earthX, earthY, earthRadius, 0, 2 * Math.PI);
	ctx.stroke();

	// Satellite
	const satelliteX = earthX + satellite.rx * scaleFactor * canvas.width;
	const satelliteY = earthY - satellite.ry * scaleFactor * canvas.width; // Invert y for canvas

	ctx.beginPath();
	ctx.arc(satelliteX, satelliteY, 5, 0, 2 * Math.PI);
	ctx.fillStyle = 'red';
	ctx.fill();

	requestAnimationFrame(draw);
}

// Simulation loop
function simulate() {
	updateSatellite();
	draw();
	setTimeout(simulate, dt * 1000); // Run at approximately 1 second intervals
}

simulate();
