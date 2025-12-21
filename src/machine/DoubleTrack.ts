/// <reference path="Track.ts"/>

namespace MarbleRunSimulatorCore {
    export class DoubleTrack extends Track {
        public mesh: BABYLON.Mesh;
        public doublePath: BABYLON.Vector3[] = [];

        constructor(part: MachinePart) {
            super(part);
            this.wires = [];
        }
        
        public dispose(): void {
            if (this.mesh) {
                this.mesh.dispose();
            }
        }

        public recomputeWiresPath(forceDisconnexion?: boolean): void {
            
        }

        public recomputeAbsolutePath(): void {
            this.doublePath = [...this.templateInterpolatedPoints].map((p) => {
                return p.clone();
            });

            for (let i = 0; i < this.doublePath.length; i++) {
                BABYLON.Vector3.TransformCoordinatesToRef(this.doublePath[i], this.part.getWorldMatrix(), this.doublePath[i]);
            }
        }
    }
}
