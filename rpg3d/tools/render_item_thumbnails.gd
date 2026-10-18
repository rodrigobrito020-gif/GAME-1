extends SceneTree
## Run with a real 3D display: godot --path rpg3d --script res://tools/render_item_thumbnails.gd
## Render original textured equipment into transparent PNGs; no client icon artwork is synthesized.
const Catalog=preload("res://scripts/equipment_catalog.gd")
var viewport:SubViewport
var stage:Node3D
var camera:Camera3D
func _initialize()->void:
	_run.call_deferred()
func make_static(mesh:MeshInstance3D, side_only:bool)->void:
	var old:Mesh=mesh.mesh
	var result=ArrayMesh.new()
	for surface in old.get_surface_count():
		var arrays:Array=old.surface_get_arrays(surface)
		var vertices:PackedVector3Array=arrays[Mesh.ARRAY_VERTEX]
		var indices:PackedInt32Array=arrays[Mesh.ARRAY_INDEX]
		var selected=PackedInt32Array()
		for i in range(0,indices.size(),3):
			var x:float=(vertices[indices[i]].x+vertices[indices[i+1]].x+vertices[indices[i+2]].x)/3
			if not side_only or x>=0:selected.append_array([indices[i],indices[i+1],indices[i+2]])
		arrays[Mesh.ARRAY_INDEX]=selected
		arrays[Mesh.ARRAY_BONES]=null
		arrays[Mesh.ARRAY_WEIGHTS]=null
		result.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES,arrays)
		result.surface_set_material(result.get_surface_count()-1,old.surface_get_material(surface))
	mesh.mesh=result
func bounds_for(mesh:MeshInstance3D)->AABB:
	var arrays:Array=mesh.mesh.surface_get_arrays(0)
	var vertices:PackedVector3Array=arrays[Mesh.ARRAY_VERTEX]
	var indices:PackedInt32Array=arrays[Mesh.ARRAY_INDEX]
	var result=AABB(mesh.to_global(vertices[indices[0]]),Vector3.ZERO)
	for i in indices:result=result.expand(mesh.to_global(vertices[i]))
	return result
func render_item(key:String,model:Node3D,parts:Array,side_only:bool)->void:
	stage.add_child(model)
	var have=false
	var bounds=AABB()
	for mesh:MeshInstance3D in model.find_children("*","MeshInstance3D",true,false):
		mesh.visible=parts.is_empty() or parts.any(func(part:Dictionary)->bool:return str(mesh.name)==part.node or str(mesh.name).begins_with(str(part.node)+"_"))
		if not mesh.visible:continue
		mesh.skin=null
		mesh.skeleton=NodePath("")
		make_static(mesh,side_only)
		var box=bounds_for(mesh)
		bounds=box if not have else bounds.merge(box)
		have=true
	assert(have,key)
	var center=bounds.get_center()
	camera.position=center+Vector3(.16,.06,2.0)*maxf(1,bounds.size.length())
	camera.look_at(center)
	camera.size=maxf(bounds.size.y,maxf(bounds.size.x,bounds.size.z)) * 1.18
	viewport.render_target_update_mode=SubViewport.UPDATE_ALWAYS
	await process_frame
	await process_frame
	await RenderingServer.frame_post_draw
	assert(viewport.get_texture().get_image().save_png(ProjectSettings.globalize_path("res://assets/item_thumbnails/"+key+".png"))==OK)
	stage.remove_child(model)
	model.queue_free()
	print("ICON_RENDERED ",key)
func _run()->void:
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path("res://assets/item_thumbnails"))
	viewport=SubViewport.new()
	viewport.size=Vector2i(192,192)
	viewport.own_world_3d=true
	viewport.transparent_bg=true
	viewport.msaa_3d=Viewport.MSAA_4X
	root.add_child(viewport)
	stage=Node3D.new();viewport.add_child(stage)
	var environment=WorldEnvironment.new();environment.environment=Environment.new()
	environment.environment.background_mode=Environment.BG_CLEAR_COLOR
	environment.environment.ambient_light_source=Environment.AMBIENT_SOURCE_COLOR
	environment.environment.ambient_light_color=Color.WHITE
	environment.environment.ambient_light_energy=.8
	stage.add_child(environment)
	var light=DirectionalLight3D.new();light.rotation_degrees=Vector3(-25,-25,0);light.light_energy=1.3;stage.add_child(light)
	var fill=DirectionalLight3D.new();fill.rotation_degrees=Vector3(-15,150,0);fill.light_energy=.5;stage.add_child(fill)
	camera=Camera3D.new();camera.projection=Camera3D.PROJECTION_ORTHOGONAL;camera.near=.001;stage.add_child(camera)
	for key:String in Catalog.entries:
		var entry:Dictionary=Catalog.entries[key]
		var model:Node3D=load("res://assets/wardrobe_"+str(entry.profile)+".glb").instantiate()
		await render_item(key,model,entry.parts,entry.slot in ["gloves","boots"])
	for pair:Array in [["sword","long_sword"],["shield","small_shield"],["bow","short_bow"],["rod","apprentices_rod"]]:
		var model:Node3D=load("res://assets/"+pair[1]+".glb").instantiate()
		model.rotation=Vector3(0 if pair[0]=="shield" else PI/2,0,PI/4)
		await render_item(pair[0],model,[],false)
	quit()
