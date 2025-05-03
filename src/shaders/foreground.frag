#version 300 es
precision mediump float;
uniform sampler2D uSampler;
uniform float uTime;
uniform float uDepth;
uniform vec2 uPosition;
uniform vec2 uResolution;
uniform vec2 uPlayerPosition;

in vec2 vUV;
out vec4 color;

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

vec4 blur(float size) {
    const float PI2 = 6.28318530718f; // Pi*2

    // GAUSSIAN BLUR SETTINGS {{{
    float directions = 6.0f; // BLUR DIRECTIONS (Default 16.0 - More is better but slower)
    float quality = 4.0f; // BLUR QUALITY (Default 4.0 - More is better but slower)
    //const float Size = 5.0; // BLUR SIZE (Radius)
    // GAUSSIAN BLUR SETTINGS }}}

    vec2 radius = size / uResolution;

    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = vUV;
    // Pixel colour
    vec4 color = texture(uSampler, uv);
    float count = 1.f;

    // Blur calculations
    for(float d = 0.0f; d < PI2; d += PI2 / directions) {
        for(float i = 1.0f / quality; i <= 1.0f; i += 1.0f / quality) {
            color += texture(uSampler, uv + vec2(cos(d), sin(d)) * radius * i);
            count += 1.f;
        }
    }

    // Output to screen
    color /= count;
    return color;
}

float map(float fromMin, float fromMax, float value) {
    return clamp((value - fromMin) / (fromMax - fromMin), 0.f, 1.f);
}

void main() {
    vec2 uv = vUV;
    vec2 worldUv = uv - uPosition * 1.f;
    vec4 tex = blur(50.f);
    color = tex;
    color.rgb *= 0.f;
    vec2 ratio = uResolution / uResolution.y;
    float reveal = smoothstep(.2f, .7f, length((uv - uPlayerPosition) * ratio * 2.f));
    color.a *= reveal;
    //color = vec4(1.f);
}