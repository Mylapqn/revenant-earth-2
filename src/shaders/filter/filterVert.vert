#version 300 es

in vec2 aPosition;

out vec2 vUV;
out vec2 vWindowUV;

//niform mat3 uProjectionMatrix;
//niform mat3 uWorldTransformMatrix;
//niform mat3 uTransformMatrix;

uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

vec4 filterVertexPosition(void) {
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;

    position.x = position.x * (2.0f / uOutputTexture.x) - 1.0f;
    position.y = position.y * (2.0f * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;

    return vec4(position, 0.0f, 1.0f);
}

vec2 filterTextureCoord(void) {
    return aPosition * (uOutputFrame.zw * uInputSize.zw);
}
void main() {

    //mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
    //gl_Position = vec4((mvp * vec3(aPosition, 1.0f)).xy, 0.0f, 1.0f);
    gl_Position = filterVertexPosition();

    vWindowUV = ((gl_Position.xy) * 0.5f + 0.5f);
    //vWindowUV.y = 1.f - vWindowUV.y;
    vUV = filterTextureCoord();
}
