#version 300 es
precision mediump float;
uniform sampler2D uSampler;
uniform sampler2D uBackground;
uniform vec2 uBackgroundResolution;
uniform vec2 uWindowResolution;
in vec2 vUV;
in vec2 vWindowUV;
out vec4 color;

void main() {
    vec2 uv = vUV;
    color = texture(uSampler, uv);
    vec2 windowUV = vWindowUV - .5f;
    windowUV /= uBackgroundResolution / uWindowResolution;
    vec4 bgColor = texture(uBackground, windowUV-.5);
    color.rgb /= color.a;
    color.rgb = mix(bgColor.rgb, color.rgb, color.a);
    color.a = step(1.f / 255.f, color.a);
    color.rgb *= color.a;
    //color = vec4(1.);
}