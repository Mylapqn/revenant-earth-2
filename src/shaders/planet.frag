#version 300 es
precision mediump float;
uniform sampler2D uSampler;
uniform float uTime;
uniform vec3 uLightPosition;
in vec2 vUV;
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

float lengthSquared(vec2 x) {
    return x.x * x.x + x.y * x.y;
}

mat3 rotationMatrix(float angle, vec3 axis) {
    float c = cos(angle);
    float s = sin(angle);
    float oneMinusC = 1.0f - c;

    vec3 a = normalize(axis);
    return mat3(c + a.x * a.x * oneMinusC, a.x * a.y * oneMinusC - a.z * s, a.x * a.z * oneMinusC + a.y * s, a.y * a.x * oneMinusC + a.z * s, c + a.y * a.y * oneMinusC, a.y * a.z * oneMinusC - a.x * s, a.z * a.x * oneMinusC - a.y * s, a.z * a.y * oneMinusC + a.x * s, c + a.z * a.z * oneMinusC);
}

float posterise(float f, int steps) {
    float s = float(steps);
    return floor(s * clamp(f, 0.f, 1.f)) / s;
}

void main() {
    vec3 white = vec3(1.f);
    vec2 uv = vUV;
    vec2 centeredUV = (uv - .5f) * 2.f;
    color = vec4(1.f);
    float distSquared = lengthSquared(centeredUV);
    float sphereHeight = sqrt(1.f - distSquared);
    float sphereMask = step(sphereHeight, 1.f);
    vec3 norm = vec3(centeredUV, sphereHeight) * sphereMask;

    float r2 = dot(centeredUV, centeredUV);
    if(r2 > 1.0f) {
        discard; // Outside the hemisphere projection
    }

    // Project onto hemisphere
    float zz = sqrt(1.0f - r2); // hemisphere Z (positive hemisphere only)

    // Normalized hemisphere vector
    vec3 hemiNormal = normalize(vec3(centeredUV, zz));

    mat3 rotX = rotationMatrix(uTime * .1f, vec3(0.0f, 1.0f, 0.0f));
    mat3 rotY = rotationMatrix(0.f, vec3(1.0f, 0.0f, 0.0f));
    vec3 rotatedNormal = rotX * rotY * hemiNormal;

    // Spherical coordinates from normal
    float theta = acos(rotatedNormal.y); // polar angle
    float phi = atan(rotatedNormal.x, rotatedNormal.z); // azimuthal angle

    //phi+= uLightPosition.x;

    vec2 sphereUV = vec2(1.f);

    // Map spherical coords to 2D texture space
    sphereUV.x = (phi / (2.0f * 3.14159265f)) + 0.5f;
    sphereUV.y = 1.f - theta / (1.f * 3.14159265f); // because we're using a hemisphere (theta ∈ [0, π/2])

    float landQuality = clamp(uLightPosition.y, 0.f, 1.f);
    float airQuality = clamp(uLightPosition.x, 0.f, 1.f);
    float seaLevel = (1.f - landQuality + .01f) * .1f;
    float cloudCover = (airQuality*.7+1.1);

    float light = (dot(norm, normalize(vec3(0.f, -1.f, -0.2f))));
    float fresnel = (dot(norm, vec3(0.f, 0.f, -1.f)) + 1.f);
    fresnel = clamp(fresnel, 0.f, 1.f);
    fresnel = pow(fresnel, 2.f);
    light += fresnel;
    light = clamp(light, 0.f, 1.f);
    float noise = fractalNoise(sphereUV * 1.f * vec2(2.f, 3.f) + vec2(-.5f, .5f) * uTime * .01f, 5, 2.f, .8f);
    float noise2 = fractalNoise(sphereUV * 1.f * vec2(2.f, 3.f) + vec2(-.2f, -.5f) * uTime * .02f, 6, 2.f, .9f);
    noise2 = mix(noise2,1.,.3);
    float noiseShadow = fractalNoise(sphereUV * 1.f * vec2(2.f, 3.f) + vec2(-.5f, .5f) * uTime * .01f - vec2(0.f, .02f), 5, 2.f, .8f);
    float cloud = step(.8f, noise * noise2 * cloudCover);
    float cloudShadow = step(.8f, noiseShadow * noise2 * cloudCover);
    vec2 sinUV = sin(sphereUV * 100.f);
    float heightMap = texture(uSampler, sphereUV).r;
    float atmo = posterise((light * .8f + .1f) + fresnel * .5f, 8);
    float land = step(seaLevel, heightMap);
    float shading = posterise((heightMap * land + .3f + cloud * .3f) * 2.f * (light + .5f), 8);
    vec3 landColorGood = vec3(0.41f, 0.62f, 0.22f);
    vec3 desertColor = vec3(1.0f, 0.8f, 0.53f);
    vec3 seaColorGood = vec3(0.25f, 0.43f, 0.49f);
    vec3 seaColorBad = vec3(0.89f, 0.46f, 0.38f);
    vec3 terminatorColor = vec3(0.99f, 0.31f, 0.02f);
    vec3 atmosphereColor = vec3(0.15f, 0.63f, .9f);
    vec3 selectedAtmosphereColor = mix(terminatorColor, atmosphereColor, clamp(airQuality, 0.f, 1.f));
    vec3 atmoColor = pow(selectedAtmosphereColor, vec3(1.f / pow(atmo + .2f, 2.f))) * atmo;
    vec3 shadeColor = vec3(0.03f, 0.07f, 0.1f);
    //atmoColor = mix(shadeColor, atmoColor, clamp(atmo*2.-.5,0.,1.));
    vec3 seaColor = mix(seaColorBad, seaColorGood, landQuality);
    float desertness = step(landQuality * .8f, (noise + .2f) * .5f + pow(1.f - abs(-centeredUV.y), 2.f) * .7f);
    vec3 landColor = mix(landColorGood, desertColor, desertness);
    vec3 col = mix(seaColor, landColor, land);
    col = mix(col, col * selectedAtmosphereColor, cloudShadow);
    col = mix(col, white, cloud);
    col *= mix(selectedAtmosphereColor, white, .5f);

    //vec3 col = mix(seaColor, mix(landColor,desertColor,clamp(uLightPosition.y,0.,1.)), land)*mix(selectedAtmosphereColor,white,(1.-atmo)*.8);
    //color.rgb = col * mix(shading, 1.f, .2f) + atmoColor;
    color.rgb = mix(shadeColor, col, shading);
    //color.rgb = mix(color.rgb, atmoColor, atmo);
    color.rgb = white - (white - color.rgb) * (white - atmoColor * atmo);
    //color.rgb = atmoColor;
    //color.rgb = white * step(.5f, sin(sphereUV.x * 100.f + uTime * 10.f))*sphereMask;
    //color.rgb = white*hemiNormal;
}