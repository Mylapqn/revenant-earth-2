#version 300 es
precision mediump float;
uniform sampler2D uSampler;
uniform sampler2D uBackground;
in vec2 vUV;
in vec2 vWindowUV;
out vec4 color;

float isBetweenExclusive(float x, float minVal, float maxVal) {
    return step(0.0f, x - minVal) * step(0.0f, maxVal - x);
}

void main() {
    vec2 uv = vUV;
    vec4 tex = texture(uSampler, uv);
    float diff = isBetweenExclusive(tex.a, 1.f / 255.f, 254.f / 255.f);
    color = vec4(vec3(diff * .5f), diff);
    //color = vec4(1.);
}