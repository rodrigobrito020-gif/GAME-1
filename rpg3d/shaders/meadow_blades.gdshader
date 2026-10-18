shader_type spatial;
render_mode cull_disabled, specular_disabled;

uniform sampler2D grass_albedo : source_color, repeat_enable, filter_linear_mipmap;
uniform vec3 biome_tint : source_color = vec3(1.0);
varying vec3 world_position;

void vertex() {
	vec3 original_world = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
	float distance_to_view = distance(CAMERA_POSITION_WORLD.xz, original_world.xz);
	float fade = 1.0 - smoothstep(30.0, 43.0, distance_to_view);
	VERTEX *= fade;
	float bend = UV.y * UV.y * fade;
	float breeze = sin(TIME * 1.7 + original_world.x * 0.42 + original_world.z * 0.26);
	VERTEX.x += breeze * 0.045 * bend;
	VERTEX.z += cos(TIME * 1.2 + original_world.z * 0.4) * 0.025 * bend;
	world_position = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
}

void fragment() {
	vec3 turf = texture(grass_albedo, world_position.xz / 1.8).rgb;
	vec3 grass = mix(vec3(0.20, 0.31, 0.12), vec3(0.31, 0.43, 0.20), UV.y);
	ALBEDO = mix(grass, turf, 0.18) * COLOR.rgb * biome_tint;
	// Both faces share a soft upward foliage normal; the back of a leaf must not
	// become a black silhouette when Compatibility flips its geometric normal.
	NORMAL = normalize((VIEW_MATRIX * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
	EMISSION = ALBEDO * 0.08;
	ROUGHNESS = 1.0;
}
