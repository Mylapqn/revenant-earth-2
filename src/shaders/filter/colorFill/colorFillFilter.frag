#version 300 es
precision mediump float;
uniform sampler2D uTexture;
in vec2 vUV;
out vec4 color;
uniform vec3 uColor;

void main(){
    vec2 uv = vUV;
    color =  texture(uTexture, uv);
    //color = vec4(0.);
    color.rgb = uColor * color.a;
    //color.xy = uv;
    //color.a = 1.;
}