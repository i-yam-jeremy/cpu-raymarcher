# CPU Raymarcher
A CPU raymarcher that can render arbitrary SDFs

## Raymarching
Raymarching is a rendering technique similar to raytracing, in which rays are calculated from the camera through the pixels screen and onto objects on the scene. When the rays hit an object the ray stops and various lighting and rendering calculations are done (normal calculation, Phong lighting, reflection, refraction, etc.). Raytracing uses pre-solved equations to calculate intersection points based on the ray and objects in the scene. This limits raytracing to using a small variety of primitive objects such as spheres and tori. This is very limiting. Raymarching solves this by marching along the ray instead of finding the intersection point in one step. This has a performance impact but allows raymarching to render objects solely based on a signed-distance field.

## Signed-Distance Field
A signed-distance field, often abbreviated as SDF, is a way of defining a 3D object. The object is defined by a single function `f(x, y, z)` that outputs the shortest distance to the surface of the object from the point `(x, y, z)`. The output distance is negative if the point is inside the object (hence "signed"-distance field).

### Examples
Using JavaScript functions as syntax
```javascript
function sphere(x, y, z) {
  let radius = 0.1;
  return Math.sqrt(x*x + y*y + z*z) - radius;
}
```

## Why Raymarching?
At first raymarching may seem like adding arbitrary complexity for little reward. However, where it truly shines is object distortion and blending. With raymarching a simple function can blend two SDFs by a blend factor, allowing objects to morph together like putty. This would take significantly more work and added complexity if using rasterization or raytracing to get the same effect. Furthermore, you can distort and objects surface to make it bumpy with a simple distortion function. And I'm not talking about faking it using bump maps. This changes the object's definition so shadows, reflections, and everything else is affected as well. The distortion is not limited to small changes in height either. The distortion can change a flat plane into a fully-formed terrain with hills and valleys with just a simple distortion function. That is where raymarching truly shines.

## References
[Inigo Quilez](http://iquilezles.org/) - This was the main and best source of knowledge while learning raymarching over the past few years. I highly recommend you check out his website; he's done a lot of great work.
