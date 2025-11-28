/// <reference path="Track.ts"/>

namespace MarbleRunSimulatorCore {
    export class DoubleTrack extends Track {
        public mesh: BABYLON.Mesh;

        constructor(part: MachinePart) {
            super(part);
            this.wires = [new Wire(this.part), new Wire(this.part)];
        }
    }
}
