#version 300 es

in vec2 aPosition;
in vec2 aUV;
in vec4 aTerrainStats;
in float aTerrainStats2;
in float aTerrainInspect;

out vec2 vUV;
out vec4 vTerrainStats;
out float vTerrainInspect;
out float vTerrainStats2;

uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;

uniform mat3 uTransformMatrix;


void main() {

    mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
    gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);

    vUV = aUV;
    vTerrainStats = aTerrainStats;
    vTerrainStats2 = aTerrainStats2;
    vTerrainInspect = aTerrainInspect;
}