import {createLaneige} from './laneige.js';
import {createSkinVeil} from './skin-veil.js';
import {laneigeDossier,skinVeilDossier} from './research-dossier.js';
import {createWaterBankFoam} from './water-bank-foam.js';
import {waterBankFoamDossier} from './research-dossier.js';
import {sizeProfiles} from './product-specs.js';
export const products=[
 {key:'laneige',references:['assets/reference.png','assets/reference-angle.png'],dossier:laneigeDossier,create:createLaneige,yOffset:1.275,size:sizeProfiles.laneige},
 {key:'skin-veil-40',references:['assets/skin-veil-reference.png','assets/skin-veil-angle-reference.png'],dossier:skinVeilDossier,create:createSkinVeil,yOffset:0,size:sizeProfiles['skin-veil-40']},
 {key:'water-bank-foam-30g',references:['assets/water-bank-foam-30g-reference.png'],dossier:waterBankFoamDossier,create:createWaterBankFoam,yOffset:0,size:sizeProfiles['water-bank-foam-30g']}
];
