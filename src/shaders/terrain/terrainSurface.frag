#version 300 es
precision mediump float;
uniform sampler2D uSampler;
uniform int uInspectMode;
in vec2 vUV;
//moisture, fertility, erosion
in vec3 vTerrainStats;
in float vTerrainInspect;
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

vec2 hash2(vec2 p) {
    return fract(sin(vec2(dot(p, vec2(127.1f, 311.7f)), dot(p, vec2(269.5f, 183.3f)))) * 43758.5453f);
}

vec3 voronoi(in vec2 x) {
    vec2 ip = floor(x);
    vec2 fp = fract(x);

    //----------------------------------
    // first pass: regular voronoi
    //----------------------------------
    vec2 mg, mr;

    float md = 8.0f;
    for(int j = -1; j <= 1; j++) for(int i = -1; i <= 1; i++) {
            vec2 g = vec2(float(i), float(j));
            vec2 o = hash2(ip + g);
		#ifdef ANIMATE
            o = 0.5f + 0.5f * sin(iTime + 6.2831f * o);
        #endif	
            vec2 r = g + o - fp;
            float d = dot(r, r);

            if(d < md) {
                md = d;
                mr = r;
                mg = g;
            }
        }

    //----------------------------------
    // second pass: distance to borders
    //----------------------------------
    md = 8.0f;
    for(int j = -2; j <= 2; j++) for(int i = -2; i <= 2; i++) {
            vec2 g = mg + vec2(float(i), float(j));
            vec2 o = hash2(ip + g);
		#ifdef ANIMATE
            o = 0.5f + 0.5f * sin(iTime + 6.2831f * o);
        #endif	
            vec2 r = g + o - fp;

            if(dot(mr - r, mr - r) > 0.00001f)
                md = min(md, dot(0.5f * (mr + r), normalize(r - mr)));
        }

    return vec3(md, mr);
}

float posterise(float f, int steps) {
    float s = float(steps);
    return floor(s * clamp(f, 0.f, 1.f)) / s;
}

void main() {
    vec2 uv = vUV;
    color = texture(uSampler, uv);
    float voronoi = voronoi(uv * 5.f).r;
    float cracks = clamp(step(voronoi, max(.03f, vTerrainStats.b * (1.f - uv.y) * .3f - .1f)) * (1.f - uv.y) * vTerrainStats.b, 0.f, 1.f);
    float noise = fractalNoise(uv * 1.f, 4, 2.f, .8f);
    float HFnoise = fractalNoise(uv * 1.f, 5, 2.f, .9f);
    float baseMask = (2.f - uv.y * 3.f) * (noise + .2f);
    baseMask = posterise(baseMask * 1.5f + .5f, 6);
    float surfaceLight = step(uv.y * 8.f - .2f, HFnoise);
    float wetness = (1.f - uv.y) * noise * 1.f * vTerrainStats.x + vTerrainStats.x * .9f;
    wetness = clamp(wetness - voronoi * vTerrainStats.b * 2.f, 0.f, 1.f);
    wetness = posterise(wetness, 2);
    float fertility = clamp((1.5f - uv.y) * mix(1.f, noise, .6f) * vTerrainStats.y * 3.f, 0.f, 1.f);
    fertility = posterise(fertility,2);
    vec3 baseColor = vec3(0.34f, 0.22f, 0.17f);
    vec3 wetColor = vec3(0.61f, 0.44f, 0.41f);
    vec3 dryColor = vec3(0.51f, 0.44f, 0.42f);
    vec3 fertColor = vec3(0.23f, 0.05f, 0.04f);
    vec3 crackColor = vec3(0.07f, 0.06f, 0.06f);
    vec3 inspectLowColor = vec3(0.56f, 0.09f, 0.01f);
    vec3 inspectHighColor = vec3(0.07f, 0.93f, 0.17f);
    float inspect = posterise(vTerrainInspect*1.1, 5);
    vec3 inspectColor = normalize(vec3(1.f - inspect, inspect, 0.1f)) * .8f;
    //inspectColor = mix(inspectLowColor, inspectHighColor, inspect);
    vec3 mixedColor = baseColor;
    mixedColor = mix(mixedColor, fertColor, fertility);
    mixedColor *= mix(vec3(1.f), wetColor, wetness);
    //mixedColor = mix(mixedColor, baseColor*1.4f, cracks);
    mixedColor = mix(mixedColor, crackColor, cracks);
    mixedColor = mix(mixedColor, baseColor * 1.4f, surfaceLight);
    color = vec4(mixedColor, 1.f);
    color.rgb = mix(color.rgb, inspectColor, float(uInspectMode));
    baseMask = mix(baseMask, step(.5f, (1.f - uv.y) * .7f + HFnoise * .5f * clamp(.2f + inspect * .2f, 0.f, 1.f)), float(uInspectMode));
    //color = vec4(1.);
    color *= baseMask;
    //color = vec4(fertility);
    //color = vec4(1.);
}