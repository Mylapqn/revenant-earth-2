#version 300 es

in vec2 aPosition;
in vec2 aUV;
in vec3 aTerrainStats;
in float aAtmoStats;

out vec2 vUV;
out vec3 vTerrainStats;
out float vPollution;
out vec2 vWorldUV;

uniform vec2 uPosition;
uniform float uPixelRatio;

uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;

uniform mat3 uTransformMatrix;

void main() {

    mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
    gl_Position = vec4((mvp * vec3(aPosition, 1.0f)).xy, 0.0f, 1.0f);

    vUV = aUV;
    vTerrainStats = aTerrainStats;
    vPollution = aAtmoStats;
    vWorldUV = (gl_Position.xy * .5f + uPosition);
    vWorldUV.y /= uPixelRatio;
    vWorldUV*=2.;
}