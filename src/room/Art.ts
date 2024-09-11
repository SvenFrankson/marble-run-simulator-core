namespace MarbleRunSimulatorCore {
    export class Art extends BABYLON.Mesh implements IRoomDecor {

        public h: number = 0;
        
        public getAllMeshes(): BABYLON.Mesh[] {
            return [
                this
            ]
        }

        constructor(public room: Room, public url: string, public meshIndex: number = 0) {
            super("art");
            this.layerMask = 0x10000000;
        }

        public async instantiate(): Promise<void> {
            let vertexDatas = await this.room.game.vertexDataLoader.get(this.url);
            if (vertexDatas && vertexDatas[0]) {
                vertexDatas[this.meshIndex].applyToMesh(this);
            }
        }

        public setLayerMask(mask: number): void {
            this.layerMask = mask;
        }
    }
}
