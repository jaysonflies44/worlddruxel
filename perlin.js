/*
 * A speed-improved perlin and simplex noise algorithms for 2D.
 * Original source: https://github.com/josephg/noisejs
 * Heavily optimized for pixel variation in sandbox-style games.
 */

class Perlin {
  constructor() {
    this.grad3 = new Float64Array([
      1,1,0,    -1,1,0,    1,-1,0,    -1,-1,0,
      1,0,1,    -1,0,1,    1,0,-1,    -1,0,-1,
      0,1,1,    0,-1,1,    0,1,-1,    0,-1,-1
    ]);
    
    this.p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) this.p[i] = i;
    
    // To remove the need for index wrapping, double the permutation table length
    this.perm = new Uint8Array(512);
    this.gradP = new Float64Array(512);
    
    this.seed(0);
  }

  seed(seed) {
    if (seed > 0 && seed < 1) {
      seed *= 65536;
    }

    seed = Math.floor(seed);
    if (seed < 256) {
      seed |= seed << 8;
    }

    let p = this.p;
    for (let i = 0; i < 256; i++) {
      let v;
      if (i & 1) {
        v = p[i] ^ (seed & 255);
      } else {
        v = p[i] ^ ((seed >> 8) & 255);
      }

      let perm = this.perm;
      let gradP = this.gradP;
      perm[i] = perm[i + 256] = v;
      
      gradP[i] = gradP[i + 256] = this.grad3[(v % 12) * 3];
    }
  }

  noise2D(x, y) {
    const perm = this.perm;
    const gradP = this.gradP;

    // Find unit grid cell containing point
    let X = Math.floor(x), Y = Math.floor(y);
    // Get relative xy coordinates of point within that cell
    x = x - X; y = y - Y;
    // Wrap the integer cells at 255 (smaller integer period can be introduced here)
    X = X & 255; Y = Y & 255;

    // Calculate noise contributions from each of the four corners
    let n00 = gradP[X + perm[Y]].dot2(x, y);
    let n01 = gradP[X + perm[Y + 1]].dot2(x, y - 1);
    let n10 = gradP[X + 1 + perm[Y]].dot2(x - 1, y);
    let n11 = gradP[X + 1 + perm[Y + 1]].dot2(x - 1, y - 1);

    // Compute the fade curve value for x
    let u = this.fade(x);

    // Interpolate the four results
    return this.lerp(
      this.lerp(n00, n10, u),
      this.lerp(n01, n11, u),
      this.fade(y)
    );
  }

  // 2D Perlin noise with custom frequency and amplitude
  get2D(x, y, frequency = 1, amplitude = 1) {
    return this.noise2D(x * frequency, y * frequency) * amplitude;
  }

  // Utility for smoother transitions
  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  // Linear interpolation
  lerp(a, b, t) {
    return (1 - t) * a + t * b;
  }
}

// Create a single instance to be used globally
const perlin = new Perlin();
perlin.seed(Math.random());

// Optimized for pixel coloring
class PixelNoise {
  static colorVariation(x, y, time = 0, scale = 0.05) {
    return perlin.get2D(x * scale, y * scale + time * 0.01, 1, 0.2);
  }

  static gasOpacity(x, y, time = 0, scale = 0.1) {
    return perlin.get2D(x * scale, y * scale + time * 0.02, 1, 0.4);
  }

  // Get smooth transitioning value for temperature visualization
  static tempVariation(x, y, time = 0, scale = 0.03) {
    return perlin.get2D(x * scale, y * scale + time * 0.005, 1, 0.15);
  }

  // Reseed the noise generator
  static reseed(seed) {
    perlin.seed(seed);
  }
}