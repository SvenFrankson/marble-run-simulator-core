namespace MarbleRunSimulatorCore {
    export class Sculpt extends BABYLON.Mesh implements IRoomDecor {

        public h: number = 0;
        
        private _steel: BABYLON.Mesh;

        public getAllMeshes(): BABYLON.Mesh[] {
            return [
                this,
                this._steel
            ]
        }

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
                this._steel = new BABYLON.Mesh("steel");
                vertexDatas[1].applyToMesh(this._steel);
                this._steel.parent = this;
                this._steel.material = this.mat;
                this._steel.layerMask = 0x10000000;
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
