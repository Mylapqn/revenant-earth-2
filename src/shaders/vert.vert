#version 300 es

in vec2 aPosition;
in vec2 aUV;

out vec2 vUV;
out vec2 vWindowUV;

uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;

uniform mat3 uTransformMatrix;

void main() {

    mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
    gl_Position = vec4((mvp * vec3(aPosition, 1.0f)).xy, 0.0f, 1.0f);

    vWindowUV = ((gl_Position.xy) * 0.5f + 0.5f);
    //vWindowUV.y = 1.f - vWindowUV.y;
    vUV = aUV;
}