/*
	A library for CPU raymarching
*/
const Raymarcher = (() => {

	/* A 3-dimensional vector */
	class Vec3 {

		/*
			Fields:
	
			x - number - the x component of the vector
			y - number - the y component of the vector
			z - number - the z component of the vector
		*/

		/*
			Creates a vector from the given x, y, z values
			@param x - number - the x component of the vector
			@param y - number - the y component of the vector
			@param z - number - the z component of the vector
		*/
		constructor(x, y, z) {
			this.x = x;
			this.y = y;
			this.z = z;
		}

		/*
			Adds the given value to the current vector and returns the result
			@param value - number|Vec3 - if number, the scalar to add to each component, if Vec3, the vector to add
			@return Vec3 - the resultant vector
		*/
		add(value) {
			if (typeof value == "number") { // scalar
				return new Vec3(this.x+value, this.y+value, this.z+value);
			}
			else { // vector
				return new Vec3(this.x+value.x, this.y+value.y, this.z+value.z);
			}	
		}
		
		/*
			Subtracts the given value to the current vector and returns the result
			@param value - number|Vec3 - if number, the scalar to subtract from each component, if Vec3, the vector to subtract
			@return Vec3 - the resultant vector
		*/
		sub(value) {
			if (typeof value == "number") { // scalar
				return new Vec3(this.x-value, this.y-value, this.z-value);
			}
			else { // vector
				return new Vec3(this.x-value.x, this.y-value.y, this.z-value.z);
			}	
		}
	
		/*
			Scales the given value to the current vector and returns the result (if argument is Vec3, then component-wise multiplication)
			@param value - number|Vec3 - if number, the scalar to scale each component by, if Vec3, the vector that represents scales to each component
			@return Vec3 - the resultant vector
		*/
		scale(value) {
			if (typeof value == "number") { // scalar
				return new Vec3(this.x*value, this.y*value, this.z*value);
			}
			else { // vector
				return new Vec3(this.x*value.x, this.y*value.y, this.z*value.z);
			}	
		}			
	
		/*
			Returns the length of this vector
			@return number - the length of the vector
		*/
		length() {
			return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
		}

		/*
			Returns this vector scaled to a length of 1
			@return Vec3 - the normalized vector
		*/
		normalize() {
			return this.scale(1/this.length());
		}

		/*
			Returns the dot product of the two vectors
			@param v - Vec3 - the other vector
			@return number - the dot product of the vectors
		*/
		dot(v) {
			return this.x*v.x + this.y*v.y + this.z*v.z;
		}

		/*
			Applies a scalar function to each component of this vector and returns the result
			@param f - (number) => number - a scalar function
			@return Vec3 - the resultant vector
		*/
		apply(f) {
			return new Vec3(f(this.x), f(this.y), f(this.z));
		}
	}

	/*
		A 3D scene that is rendered to HTML5 canvas
	*/
	class Scene {

		/*
			Fields:

			width - number - the width in pixels of the scene
			height - number - the height in pixels of the scene
			canvas - HTMLCanvasElement - the canvas on which to render
			ctx - CanvasRenderingContext2D - the 2D rendering context
			imageData - ImageData - the pixel data for storing pixel calculations and rendering
			cameraPos - Vec3 - the position of the camera for this scene
			models - Model[] - the models currently in the scene
			lights - Light[] - the lights currently in the scene
		*/

		/*
			Creates a scene with the given width and height
			@param width - number - the width in pixels of the scene
			@param height - number - the height in pixels of the scene
		*/
		constructor(width, height) {
			this.width = width;
			this.height = height;
			this.canvas = document.createElement("canvas");
			this.canvas.width = width;
			this.canvas.height = height;
			this.ctx = this.canvas.getContext('2d');
			this.imageData = this.ctx.createImageData(width, height);
			this.cameraPos = new Vec3(0, 0, -4);
			this.models = [];
			this.lights = [];
		}

		/*
			Adds the given model or light to the scene
			@param obj - Model|Light - the model or light to add
		*/
		add(obj) {
			if (obj instanceof Model) {
				this.models.push(obj);
			}
			else if (obj instanceof Light) {
				this.lights.push(obj);
			}
			else {
				throw "Object is not a Model or a Light";
			}
		}

		/*
			Removes the given model or light from the scene
			@param obj - Model|Light - the model or light to remove
		*/
		remove(obj) {
			let array;
			if (obj instanceof Model) {
				array = this.models;
			}
			else if (obj instanceof Light) {
				array = this.lights;
			}
			else {
				throw "Object is not a Model or a Light";
			}
			
			let index = array.indexOf(obj);
			if (index != -1) {
				array.splice(index, 1);
			}
		}

		/*
			Removes all models from the scene
		*/
		clear() {
			this.models = [];
		}

		/*
			Calculates the pixel color at the specified x,y position and stores the result in the given color object
			@param x - natural number - the x-coordinate of the pixel location to be rendered
			@param y - natural number - the y-coordinate of the pixel location to be rendered
			@return Vec3 - the color of the shaded pixel (RGB values from 0 to 1)
		*/
		calculatePixelColor(x, y) {
			let p = this.cameraPos;
			let pointOnScreen = new Vec3(x, y, 0);
			/* 
				Scale factor for normalizing UV coordinates to interval [-1, 1] 
				(in y-axis and proportionallly scaled in x-axis so stretching doesn't occur with different aspect ratio)
			*/
			let scaleFactor = -1*2*(1/this.height);
			let uv = pointOnScreen.sub(new Vec3(1/2*this.width, 1/2*this.height, 0)).scale(scaleFactor);
			let rayDir = uv.sub(this.cameraPos).normalize();
			const maxSteps = 64;
			const epsilon = 0.01;
			for (let step = 0; step < maxSteps; step++) {
				let modelDistances = this.models.map((m) => {
					return {model: m, distance: m.distanceTo(p)};
				});
				let modelDistance = modelDistances.reduce((a, b) => {
					if (a.distance < b.distance) {
						return a;
					}
					else {
						return b;
					}
				});

				if (modelDistance.distance < epsilon) {
					let h = 0.001; // approximate gradient with limit as h goes to zero (sufficiently small h)
					let d = modelDistance.distance; // the base distance
					let m = modelDistance.model; // the model
					let normal = new Vec3(
						(m.distanceTo(p.add(new Vec3(h, 0, 0))) - d) / h,
						(m.distanceTo(p.add(new Vec3(0, h, 0))) - d) / h,
						(m.distanceTo(p.add(new Vec3(0, 0, h))) - d) / h
					).normalize();

					let c = new Vec3(0, 0, 0);
					for (let light of this.lights) {
						let lightingColor = m.shade(light, normal, p);
						c = c.add(lightingColor);
					}
					return c;
				}

				p = p.add(rayDir.scale(modelDistance.distance));
			}

			return new Vec3(0, 0, 0); // background color
		}

		/*
			Renders the scene to the canvas
		*/
		render() {
			for (let y = 0; y < this.height; y++) {
				for (let x = 0; x < this.width; x++) {
					let baseIndex = 4*(y*this.width + x);

					let c = this.calculatePixelColor(x, y);
					
					this.imageData.data[baseIndex+0] = c.x*255;
					this.imageData.data[baseIndex+1] = c.y*255;
					this.imageData.data[baseIndex+2] = c.z*255;
					this.imageData.data[baseIndex+3] = 255; // alpha 
				}
			}

			this.ctx.putImageData(this.imageData, 0, 0);

			window.requestAnimationFrame(this.render.bind(this));	
		}

		/*
			Starts the render loop
		*/
		start() {
			window.requestAnimationFrame(this.render.bind(this));
		}
	}

	/*
		A 3D model defined by a signed-distance function (SDF)
	*/
	class Model {

		/*
			Fields:

			sdf - (Vec3) => number - a function that takes a point and returns the shortest distance to the surface of the model
			shader - (Vec3) => Vec3 - a function that takes a point on the surface of the model and returns the shaded color value
			position - Vec3 - the position of this model
		*/

		/*
			Creates a model from the given sdf and optional position
			@param sdf - (Vec3) => number - a function that takes a point and returns the shortest distance to the surface of the model
			@param shader - (Vec3) => Vec3 - a function that takes a point on the surface of the model and returns the shaded color value
			@param position - Vec3 (Optional) - the position of the object if specified, otherwise the origin (0, 0, 0)
		*/
		constructor(sdf, shader, position) {
			this.sdf = sdf;
			this.shader = shader;
			this.position = position || new Vec3(0, 0, 0);
		}

		/*
			Returns the shortest distance to the surface of this model from the given point
			@param p - Vec3 - the point
			@return number - the distance
		*/
		distanceTo(p) {
			return this.sdf(p.sub(this.position));
		}

		/*
			Calculates the shaded color value from the given light on this model at the given point on the surface of the model
			@param light - Light - the light
			@param normal - Vec3 - the normal vector of the surface of the model
			@param p - Vec3 - the point to be shaded
			@return Vec3 - the shaded color (RGB values from 0 to 1)
		*/
		shade(light, normal, p) {
			return this.shader(light, normal, p.sub(this.position));
		}
		
	}

	/*
		A point light
	*/
	class Light {

		/*
			Fields:

			color - Vec3 - the color of the light (RGB values from 0 to 1)
			intensity - number - the intensity of the light (from 0 to 1), 1 being the brightest possible, and 0 being completely dark
			position - Vec3 - the position of this light
			
		*/

		/*
			Creates a light from the given data
			@param color - Vec3 - the color of the light (RGB values from 0 to 1)
			@param intensity - number - the intensity of the light (from 0 to 1), 1 being the brightest possible, and 0 being completely dark
			@param position - Vec3 - the position of this light	
		*/
		constructor(color, intensity, position) {
			this.color = color;
			this.intensity = intensity;
			this.position = position || new Vec3(0, 0, 0);
		}
	}

	/*
		A collection of primitive model SDFs for ease of use
	*/
	const Primitives = (() => {

		/*
			The SDF for a sphere with the given radius
			@param p - Vec3 - the point to calculate the distance from
			@param radius - number - the radius of the sphere
			@return number - the shortest distance from the given point to the surface of the sphere
		*/
		function Sphere(p, radius) {
			return p.length() - radius;
		}

		return {
			Sphere
		};

	})();

	/*
		A collection of commonly used shaders for ease of use
	*/
	const Shaders = (() => {

		/*
			A shader with the lambertian reflectance model
			@param color - Vec3 - the color of the object to be shaded
			@param diffuseWeight - number (default=0.8) - the amount of diffuse lighting to add
			@param ambientWeight - number (default=0.2) - the amount of ambient lighting to add
			Note: for best results ensure diffuseWeight+ambientWeight=1.0
			@return (Vec3, Vec3, Vec3) => Vec3 - a shader function with the specified parameters
		*/
		function Lambert(color, diffuseWeight, ambientWeight) {
			diffuseWeight = diffuseWeight || 0.8;
			ambientWeight = ambientWeight || 0.2;
			return (light, normal, p) => {
				let ambient = color;
				let lightDir = light.position.sub(p).scale(-1).normalize();
				let brightness = lightDir.dot(normal)*light.intensity;
				let lightShadingColor = light.color.scale(brightness);
				let diffuse = color.scale(lightShadingColor).apply(c => Math.max(c, 0));
				return diffuse.scale(diffuseWeight).add(ambient.scale(ambientWeight));
			};
		}

		return {
			Lambert
		};

	})();

	return {
		Vec3,
		Scene,
		Model,
		Light,
		Primitives,
		Shaders
	};

})();
