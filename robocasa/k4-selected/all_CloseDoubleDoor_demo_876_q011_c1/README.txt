Selected K=4 query export

All displayed scene frames are simulator renders of recorded states. No failure
frame is fabricated or taken from an early stop of a successful run.

query/ours_raw.npz contains:
 dense_pixel_features [3,128,128,8]: frozen learned pixel embeddings, recomputed
   by replaying the original saved actions with the evaluation renderer settings.
 point_embeddings [3,5,8]: four selected-point embeddings plus reject embedding.
 assignment_map [3,128,128]: learned class 0..3; -1 is rejection.
 raw_xy_saved and raw_xy_recomputed: original and recovered selector coordinates.
 query_flat_pixels/query_xy/query_labels: the actual four selected queries.
 query_tracks_world [3,4,33,3]: ORIGINAL saved forecasts, meters; time 0 included.
 actual_tracks_world [3,4,33,3]: original simulator material-point futures.
 query_tracks_native128: forecasts projected through the fixed query camera.
 policy_flat_pixels/policy_xy [3,256,...]: exact logged 256 policy target pixels.
 policy_parent_queries [3,256]: original parent IDs, verified by logged SHA256.
 policy_tracks_world/native128 [3,256,33,...]: each target's own initial position
   plus the saved parent displacement; reconstructed from saved tracks/geometry.
 scene_world, scene_valid, scene_geom: current per-pixel scene geometry.
 rgb_native128/history_rgb/proprio: observations reconstructed from saved states.

Feature PNGs use shared, motion-group-balanced PCA of L2-normalized 8D features.
PCA is fitted to recorded moving surfaces (>=5 mm) with equal weight to each
group in each example; background is desaturated and foreground colors enhanced.
The basis, rotation, bounds, masks, raw projections, and original embeddings are
included. Features remain native 128x128, enlarged to 256 and 1024 for display.
The 1024 query RGB, point/trajectory backgrounds, and ending frames are NATIVE
MuJoCo renders at 1024x1024 with 4x MSAA. Their masks/features still come from the
128x128 model inputs. Earlier 256 point images enlarge the original 128 image.
Image resolution is separate from K4-to-256 POLICY POINT upsampling.

query/uniform256_common_raw.npz is uniform K=256 inference on the SAME K4 query
state/history. This frozen comparison does not produce the baseline's outcome.
Its policy_tracks_world has 32 FUTURE states (without time zero); query tracks
include time zero. Masked slots are padding and must be ignored using *_valid.

query/ours_states_actions.npz and ours_model.xml.gz reproduce the exact recorded
K4 episode, including its actual successful terminal state. Model XML references
the source project's RoboCasa/robosuite assets. Every baseline *_rollout folder
contains its own independent full episode, model, exact states/actions, query
input/prediction arrays, ending frames, and summary. Captured and historical
evaluation outcomes are separate. summary.success describes the supplied ending.

Camera order: robot0_agentview_left, robot0_agentview_right, robot0_eye_in_hand.
Only the selected external view appears on the website; raw model inputs retain
the full three-camera evaluation interface. World coordinates are meters;
native image coordinates are x-right/y-down in a 128x128 image. Parent IDs are
zero-based. Numbered visual points are one-based. No NumPy pickle is required.
