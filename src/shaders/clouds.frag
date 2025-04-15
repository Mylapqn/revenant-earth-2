#version 300 es
precision mediump float;
uniform sampler2D uSampler;
in vec2 vUV;
out vec4 color;
uniform float uTime;
uniform float uClouds;

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

float fractalNoise(vec2 uv, int octaves, float lacunarity) {
    float base = 0.5f;
    float scale = 1.;
    for(int i = 0; i < octaves; i++) {
        float result = snoise(uv * scale) - .0f;
        scale *= lacunarity;
        result *=.2;
        base += result * (float(octaves - i) / float(octaves));
    }
    return base;
}

void main() {
    vec2 uv = vUV;
    vec2 originalUV = vUV;
    color = texture(uSampler, uv);
    color = vec4(1.f);
    color = vec4(uv, snoise(uv), 1.f);
    uv.y *= 2.;
    uv.x = 0.5 + (uv.x-.5)*(1./(1.-uv.y))*.2;
    uv.y*=uv.y*3.;
    uv*=2.;
    uv.x+=uTime*.1;
    float noise = fractalNoise(uv, 8, 2.f);
    noise *= smoothstep(.5,.45,originalUV.y);
    float originalNoise = noise;
    //noise = smoothstep(uClouds,uClouds+.1,noise);
    noise = step(uClouds,noise);
    noise *= 1.-originalUV.y*1.5;
    vec3 sky = vec3(.3,.5,.5)*pow(originalUV.y*2.,2.)+vec3(.7,.4,.2);
    vec3 cloudColor = vec3(.5,.2,.1) + vec3(.3,.2,.1) * (floor(smoothstep(.9,.2,originalNoise)*3.)/3.);
    color = vec4(mix(sky,cloudColor,noise), 1.f);
    //color = vec4(uClouds,uClouds,uClouds,1.);
}