#version 300 es
precision mediump float;
uniform sampler2D uSampler;
uniform float uTime;
uniform float uDepth;
uniform vec2 uPosition;


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

void main() {
    vec2 uv = vUV;
    vec2 worldUv = uv - uPosition * 1.f;
    vec4 tex = texture(uSampler, uv);
    float alpha = tex.a;
    float depth = 1.f - uDepth;
    color = tex;
    color.rgb *= 0.f;
    float groundFog = ((worldUv.y * 4.f * depth * depth) + .2f) * tex.a;
    groundFog = clamp(groundFog, 0.f, 1.f);
    float distanceFog = depth * depth +.3;
    color.rgb += distanceFog * alpha * vec3(.8f, .6f, .4f);
    color.rgb += groundFog * alpha * vec3(.7f, .4f, .2f);
    //if(uv.x < .5f)
        color.rgb = PBRNeutralToneMapping(color.rgb);
}