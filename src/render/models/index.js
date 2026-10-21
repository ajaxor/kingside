// All the meshes the scene draws, uploaded once: every building model and unit kind for both teams, and the shared props.
//   meshes.building[team][modelId], meshes.unit[team][kind], meshes.prop[id]

import { UNIT_KINDS } from '../../data/units.js';
import { TEAM_COUNT } from '../../core/config.js';
import { makeMesh } from '../gl/context.js';
import { BUILDING_MODELS, buildBuildingModel } from './buildings.js';
import { buildUnitModel } from './units.js';
import { PROPS, buildProp } from './props.js';

export const meshes = { building: [], unit: [], prop: {} };

export function initMeshes() {
  for (let team = 0; team < TEAM_COUNT; team++) {
    meshes.building[team] = {};
    meshes.unit[team] = {};
    for (const id of Object.keys(BUILDING_MODELS)) meshes.building[team][id] = makeMesh(buildBuildingModel(id, team));
    for (const kind of UNIT_KINDS) meshes.unit[team][kind] = makeMesh(buildUnitModel(kind, team));
  }
  for (const id of Object.keys(PROPS)) meshes.prop[id] = makeMesh(buildProp(id));
}
