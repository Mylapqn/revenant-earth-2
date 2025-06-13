#version 300 es
precision mediump float;
uniform sampler2D uSampler;
in vec2 vUV;
//moisture, fertility, erosion
in vec3 vTerrainStats;
in vec2 vWorldUV;
uniform float uTime;

uniform vec3 uGroundFogColor;
in float vPollution;

uniform vec2 uRainDirection;
uniform float uRainAmount;

out vec4 color;

vec3 permute(vec3 x) {
    return mod(((x * 34.0f) + 1.0f) * x, 289.0f);
}

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187f, 0.366025403784439f, -0.577350269189626f, 0.024390243902439f);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0f, 0.0f) : vec2(0.0f, 1.0f);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0f);
    vec3 p = permute(permute(i.y + vec3(0.0f, i1.y, 1.0f)) + i.x + vec3(0.0f, i1.x, 1.0f));
    vec3 m = max(0.5f - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0f);
    m = m * m;
    m = m * m;
    vec3 x = 2.0f * fract(p * C.www) - 1.0f;
    vec3 h = abs(x) - 0.5f;
    vec3 ox = floor(x + 0.5f);
    vec3 a0 = x - ox;
    m *= 1.79284291400159f - 0.85373472095314f * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0f * dot(m, g);
}

float fractalNoise(vec2 uv, int octaves, float lacunarity, float roughness) {
    float base = 0.5f;
    float scale = 1.f;
    float contribution = 1.f;
    for(int i = 0; i < octaves; i++) {
        float result = snoise(uv * scale);
        result *= .3f * contribution;
        base += result;
        scale *= lacunarity;
        contribution *= roughness;
    }
    return base;
}

float posterise(float f, int steps) {
    float s = float(steps);
    return floor(s * clamp(f, 0.f, 1.f)) / s;
}

void main() {
    vec2 uv = vUV;
    //color = texture(uSampler, uv);
    vec2 windUV = vWorldUV + vec2(1.f, 0.2f) * uTime * .1f;
    vec2 windUV2 = vWorldUV + vec2(.5f, 0.5f) * uTime * .1f;
    vec2 rainUV = vWorldUV + uRainDirection * uTime * .6f;
    float rainNoise = fractalNoise(rainUV * 1.f, 4, 2.f, .7f);
    float noise1 = fractalNoise(windUV * 1.f, 4, 2.f, .8f);
    float noise2 = fractalNoise(windUV2 * 1.5f, 5, 2.f, .8f);
    float noise = (noise1 * 1.5f + noise2 * .5f) / 2.f;
    noise *= vTerrainStats.b;
    float rainRatio = clamp(uRainAmount * 2.f, 0.f, 1.f);
    noise = mix(noise, rainNoise * 1.f, rainRatio);
    float groundDist = 1.f - uv.y;
    noise *= groundDist * groundDist;

    vec3 noiseColor = noise * uGroundFogColor;
    vec3 nColor = vec3(1.f);
    nColor = mix(uGroundFogColor, vec3(1.f), rainRatio);

    color = vec4(nColor * noise, noise);
    //color = vec4(1.);
}