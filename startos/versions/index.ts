import { VersionGraph } from '@start9labs/start-sdk'
import { current } from './current'
import { v_quantum_1_5_8_stable_1 } from './v1.5.8-stable_1-quantum'

export const versionGraph = VersionGraph.of({
  current,
  other: [v_quantum_1_5_8_stable_1],
})
