namespace MarbleRunSimulatorCore {
    export class Sculpt extends BABYLON.Mesh implements IRoomDecor {
        constructor(public room: Room, public mat: BABYLON.Material) {
            super("sculpt");
            this.layerMask = 0x10000000;
        }

        public async instantiate(): Promise<void> {
            let vertexDatas = await this.room.game.vertexDataLoader.get("./lib/marble-run-simulator-core/datas/meshes/museum-stand-decoy.babylon");
            if (vertexDatas && vertexDatas[0]) {
                vertexDatas[0].applyToMesh(this);
            }
            if (vertexDatas && vertexDatas[1]) {
                let steel = new BABYLON.Mesh("steel");
                vertexDatas[1].applyToMesh(steel);
                steel.parent = this;
                steel.material = this.mat;
                steel.layerMask = 0x10000000;
            }
        }

        public setLayerMask(mask: number): void {
            this.layerMask = mask;
            this.getChildMeshes().forEach(mesh => {
                mesh.layerMask = mask;
            });
        }
    }
}
