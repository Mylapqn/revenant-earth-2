#version 300 es
precision mediump float;
uniform sampler2D uSampler;
uniform sampler2D uLightMap;
in vec2 vUV;
out vec4 color;

void main(){
    vec2 uv = vUV;
    color =  texture(uSampler, uv);
    color.rgb *= texture(uLightMap,uv).rgb*2. + vec3(.2);
    //color = vec4(1.);
}