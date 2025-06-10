#version 300 es
precision mediump float;
uniform sampler2D uSampler;
in vec2 vUV;
out vec4 color;
uniform float uTime;
uniform float uClouds;
uniform vec2 uSunPosition;
uniform vec2 uResolution;
uniform vec3 uAmbient;

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

vec3 PBRNeutralToneMapping(vec3 color) {
    const float startCompression = 0.8f - 0.04f;
    const float desaturation = 0.15f;

    float x = min(color.r, min(color.g, color.b));
    float offset = x < 0.08f ? x - 6.25f * x * x : 0.04f;
    color -= offset;

    float peak = max(color.r, max(color.g, color.b));
    if(peak < startCompression)
        return color;

    const float d = 1.f - startCompression;
    float newPeak = 1.f - d * d / (peak + d - startCompression);
    color *= newPeak / peak;

    float g = 1.f - 1.f / (desaturation * (peak - newPeak) + 1.f);
    return mix(color, newPeak * vec3(1, 1, 1), g);
}

vec2 perspectiveTimeUV(vec2 uv, float speed) {
    uv.y *= 2.f;
    uv.x = 0.5f + (uv.x - .5f) * (1.f / (1.f - uv.y)) * .2f;
    uv.y *= uv.y * 3.f;
    uv *= 2.f;
    uv.x += uTime * .1f * speed;
    return uv;
}

void main() {
    vec2 uv = vUV;
    float ratio = uResolution.y / uResolution.x;
    uv.x /= ratio;
    vec2 sunPosition = uSunPosition;
    sunPosition.x /= ratio;
    vec2 originalUV = uv;
    uv = perspectiveTimeUV(originalUV, .2f);
    float noise1 = fractalNoise(uv, 5, 2.f, .8f * (1.f - originalUV.y * .5f));
    //vec2 puv = perspectiveUV(originalUV,.5f);
    //float noise2 = fractalNoise(puv, 8, 2.f);
    float noise = noise1;
    //if(noise1 < .5) noise = noise2*.5;
    noise *= smoothstep(.5f, .45f, originalUV.y);
    float originalNoise = noise;
    //noise = smoothstep(uClouds,uClouds+.1,noise);
    noise = step(uClouds, noise);
    vec3 skyColor = vec3(.8f, .5f, .3f);
    vec3 sunColor = vec3(1.f, .9f, .8f);
    vec3 sunShineColor = vec3(0.99f, 0.37f, 0.23f);
    vec3 altSkyColor = vec3(.3f, .5f, .5f);
    vec3 sky = skyColor * pow(originalUV.y * 2.f, 2.f) + vec3(.7f, .4f, .2f);
    sky *= uAmbient;
    float sun = 1.f - length(originalUV - sunPosition);
    vec3 sunShine = pow(smoothstep(.2f, .95f, sun), 4.f) * sunShineColor;
    vec3 sunDisk = pow(smoothstep(.97f, .98f, sun), 2.f) * sunColor;
    vec3 totalSun = sunDisk * 2.f + sunShine * 5.f;
    totalSun -= noise * 10.f;
    totalSun = clamp(totalSun, 0.f, 2.f);
    sky += totalSun;
    vec3 cloudColor = vec3(.5f, .2f, .1f) + vec3(.3f, .2f, .1f) * (floor(smoothstep(.9f, .2f, originalNoise) * 3.f) / 3.f);
    cloudColor *= uAmbient;
    cloudColor += sunShine * sunShine * (1.f - smoothstep(uClouds + .09f, uClouds + .12f, originalNoise)) * 4.f;
    cloudColor += sunShine * sunShine * .8 * uClouds;
    //if(noise1 < .5) cloudColor += .03;
    noise *= 1.f - originalUV.y * 1.5f;
    color = vec4(mix(sky, cloudColor, noise), 1.f);
    color.rgb = PBRNeutralToneMapping(color.rgb);
    //color = vec4(uClouds,uClouds,uClouds,1.);
}