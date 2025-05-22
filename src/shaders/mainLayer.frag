#version 300 es
precision mediump float;
uniform sampler2D uSampler;
uniform sampler2D uLightMap;
uniform vec3 uAmbient;
in vec2 vUV;
out vec4 color;

void main() {
    vec2 uv = vUV;
    color = texture(uSampler, uv);
    vec3 light = texture(uLightMap, uv).rgb * 2.f + uAmbient;
    color.rgb *= light;
    //color = vec4(1.);
}