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
			models - Model[] - the models currently in the scene
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
			this.models = [];
		}

		/*
			Adds the given model to the scene
			@param model - Model - the model to add
		*/
		add(model) {
			this.models.push(model);
		}

		/*
			Removes the given model from the scene
			@param model - Model - the model to remove
		*/
		remove(model) {
			let index = this.models.indexOf(model);
			if (index != -1) {
				this.models.splice(index, 1);
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
			@param c - {r: number, g: number, b: number} - the object for storing the results
			@param x - natural number - the x-coordinate of the pixel location to be rendered
			@param y - natural number - the y-coordinate of the pixel location to be rendered
		*/
		calculatePixelColor(c, x, y) {
			c.r = 255;
			c.g = 255;
			c.b = 0;
		}

		/*
			Renders the scene to the canvas
		*/
		render() {
			let c = {r: 0, g: 0, b: 0}; // the object for storing resulting color values (so a new color object doesn't have to be created for each pixel)
			for (let y = 0; y < this.height; y++) {
				for (let x = 0; x < this.width; x++) {
					let baseIndex = 4*(y*this.width + x);

					this.calculatePixelColor(c, x, y);

					this.imageData.data[baseIndex+0] = c.r;
					this.imageData.data[baseIndex+1] = c.g;
					this.imageData.data[baseIndex+2] = c.b;
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
			position - Vec3 - the position of this model
		*/

		/*
			Creates a model from the given sdf and optional position
			@param sdf - (Vec3) => number - a function that takes a point and returns the shortest distance to the surface of the model
			@param position - Vec3 (Optional) - the position of the object if specified, otherwise the origin (0, 0, 0)
		*/
		constructor(sdf, position) {
			this.sdf = sdf;
			this.position = position || new Vec3(0, 0, 0);
		}
	}

	return {
		Scene,
		Model
	};

})();
