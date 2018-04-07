import * as THREE_IMM from 'three'

import addMorphAnimMesh from './addMorphAnimMesh'

const THREE = { ...THREE_IMM }

addMorphAnimMesh(THREE)

export default THREE
