#version 300 es
precision mediump float;
uniform sampler2D uSampler;
uniform sampler2D uLightMap;
uniform vec3 uAmbient;
uniform vec2 uRemainder;
in vec2 vUV;
out vec4 color;

void main() {
    vec2 uv = vUV;
    color = texture(uSampler, uv);
    vec3 light = texture(uLightMap, uv+uRemainder*1.).rgb * 2.f;
    color.rgb *= (light + uAmbient);
    //color.rgb += light * .1f * (1.f - color.a);
    //color = vec4(1.);
}