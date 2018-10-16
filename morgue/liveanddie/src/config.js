let at_work = false

export default {

  scene_opacity:    at_work ? 0.05 : 1.0,
  underlay_opacity: at_work ? 0.04 : 0.2,

  cells:            1000, //1000,
  regions:          32,

  aperture:         30,

  overdraw_north:   3,
  overdraw_east:    3,
  overdraw_south:   8,
  overdraw_west:    3,

  /**
   * Regions
   */
  region_updates_ms: 15,
  region_attenuation_ms: 15,

  avg_adult_height: 6,

  /**
   * Terrain
   */
  ground_frequency: 0.04,
  water_altitude: -0.3,
  highland_altitude: 0.8,
  grass_altitude_min: -0.3,
  grass_altitude_max: 0.5,
  grass_density: 0.5,

}
