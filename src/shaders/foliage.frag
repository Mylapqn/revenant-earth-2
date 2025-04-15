#version 300 es
precision mediump float;
uniform sampler2D uSampler;
in vec2 vUV;
out vec4 color;

uniform float uTime;
uniform float uRandom;
uniform vec4 uColor;

float mapRange(
    float value,
    float fromMin,
    float fromMax,
    float toMin,
    float toMax,
    bool clampVal
) {
    float t = (value - fromMin) / (fromMax - fromMin);
    if (clampVal) {
        t = clamp(t, 0.0, 1.0);
    }
    return mix(toMin, toMax, t);
}

void main() {
    vec2 uv = vUV;
    float strength = (uv.y - 1.f) * .1f;
    strength = mapRange(uv.y, .9,0.,0.,1.,true);
    strength = pow(strength,1.5)*.1;
    float sin = sin(uv.y * 1.2f - uTime * 2.f + uRandom*10.);
    uv.x += sin * strength;
    color = texture(uSampler, uv)*uColor;
    //color+=.2;
    //color = vec4(1.);
}