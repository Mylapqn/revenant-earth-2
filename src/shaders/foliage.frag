#version 300 es
precision mediump float;
uniform sampler2D uSampler;
in vec2 vUV;
out vec4 color;
uniform float uTime;

void main(){
    vec2 uv = vUV;
    float strength = (uv.y-1.)*.1;
    float sin = sin(uv.y*1.2-uTime*5.);
    uv.x += sin*strength;
    color =  texture(uSampler, uv);
    //color = vec4(1.);
}