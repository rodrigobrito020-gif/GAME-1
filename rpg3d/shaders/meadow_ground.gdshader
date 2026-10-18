shader_type spatial;
render_mode specular_disabled;

uniform sampler2D grass_albedo : source_color, repeat_enable, filter_linear_mipmap_anisotropic;
uniform sampler2D meadow_noise : repeat_enable, filter_linear_mipmap;
uniform vec3 biome_tint : source_color = vec3(1.0);
varying vec3 world_position;

void vertex() {
	world_position = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
}

void fragment() {
	// Real blades and earth detail repeat at a physical scale of 1.8 metres.
	vec2 grass_uv = world_position.xz / 1.8;
	vec3 turf = texture(grass_albedo, grass_uv).rgb;
	vec3 second_scale = texture(grass_albedo, grass_uv * 0.37 + vec2(0.27, 0.61)).rgb;
	float meadow = texture(meadow_noise, world_position.xz * 0.006).r;
	float patches = texture(meadow_noise, world_position.xz * 0.027 + vec2(0.4)).r;
	vec3 tint = mix(vec3(0.62, 0.83, 0.77), vec3(0.88, 1.02, 0.89), meadow);
	vec3 natural_turf = mix(mix(turf, second_scale, 0.22), vec3(0.065, 0.11, 0.035), 0.28);
	ALBEDO = natural_turf * tint * (0.88 + patches * 0.20) * biome_tint;
	ROUGHNESS = 0.97;
	// Fine surface relief belongs only to the close texture, avoiding distant shimmer.
	float distance_to_view = distance(CAMERA_POSITION_WORLD, world_position);
	float relief = 0.13 * (1.0 - smoothstep(5.0, 18.0, distance_to_view));
	if (relief > 0.001) {
		vec2 texel = vec2(0.0014, 0.0);
		vec3 weights = vec3(0.2126, 0.7152, 0.0722);
		float left = dot(texture(grass_albedo, grass_uv - texel.xy).rgb, weights);
		float right = dot(texture(grass_albedo, grass_uv + texel.xy).rgb, weights);
		float below = dot(texture(grass_albedo, grass_uv - texel.yx).rgb, weights);
		float above = dot(texture(grass_albedo, grass_uv + texel.yx).rgb, weights);
		NORMAL_MAP = normalize(vec3((left - right) * relief, (below - above) * relief, 1.0)) * 0.5 + 0.5;
	}
}
