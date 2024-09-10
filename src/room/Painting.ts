namespace MarbleRunSimulatorCore {
    export class Painting extends BABYLON.Mesh implements IRoomDecor {

        private _steelFrame: BABYLON.Mesh;
        private _lightedPlane: BABYLON.Mesh;
        private _paintBody: BABYLON.Mesh;
        private _paintPlane: BABYLON.Mesh;

        public getAllMeshes(): BABYLON.Mesh[] {
            return [
                this,
                this._steelFrame,
                this._lightedPlane,
                this._paintBody,
                this._paintPlane,
            ]
        }

        constructor(public room: Room, public paintingName: string, public size: number = 0.5) {
            super("painting-" + paintingName);
            this._steelFrame = new BABYLON.Mesh("steel");
            this._steelFrame.layerMask = 0x10000000;
            this._steelFrame.parent = this;

            this._lightedPlane = new BABYLON.Mesh("lighted-plane");
            this._lightedPlane.layerMask = 0x10000000;
            this._lightedPlane.parent = this;

            this._paintBody = new BABYLON.Mesh("paint-body");
            this._paintBody.layerMask = 0x10000000;
            this._paintBody.position.y = 1.2;
            this._paintBody.parent = this;

            this._paintPlane = new BABYLON.Mesh("paint-plane");
            this._paintPlane.layerMask = 0x10000000;
            this._paintPlane.position.y = 1.2;
            this._paintPlane.position.z = 0.021;
            this._paintPlane.rotation.y = Math.PI;
            this._paintPlane.parent = this;

            this.layerMask = 0x10000000;
        }

        public async instantiate(): Promise<void> {
            let vertexDatas = await this.room.game.vertexDataLoader.get("./lib/marble-run-simulator-core/datas/meshes/paint-support.babylon");
            if (vertexDatas && vertexDatas[0]) {
                vertexDatas[0].applyToMesh(this);
            }
            if (vertexDatas && vertexDatas[1]) {
                vertexDatas[1].applyToMesh(this._steelFrame);
                this._steelFrame.material = this.room.game.materials.getMaterial(0);
            }
            if (vertexDatas && vertexDatas[2]) {
                vertexDatas[2].applyToMesh(this._lightedPlane);
                this._lightedPlane.material = this.room.game.materials.paintingLight;
            }

            let texture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/" + this.paintingName + ".jpg");

            return new Promise<void>((resolve) => {
                let checkTextureLoaded = () => {
                    if (texture.isReady()) {
                        let w = texture._texture.baseWidth;
                        let h = texture._texture.baseHeight;
                        let r = w / h;
                        let wMesh = this.size;
                        let hMesh = this.size;
                        if (r >= 1) {
                            hMesh /= r;
                        } else {
                            wMesh *= r;
                        }

                        BABYLON.CreateBoxVertexData({ width: wMesh + 0.04, height: hMesh + 0.04, depth: 0.04 }).applyToMesh(this._paintBody);

                        BABYLON.CreatePlaneVertexData({ width: wMesh, height: hMesh }).applyToMesh(this._paintPlane);

                        let mat = new BABYLON.StandardMaterial(this.name + "-material");
                        mat.diffuseTexture = texture;
                        mat.emissiveColor = new BABYLON.Color3(0.25, 0.25, 0.25);

                        this._paintPlane.material = mat;

                        resolve();
                    } else {
                        requestAnimationFrame(checkTextureLoaded);
                    }
                };
                checkTextureLoaded();
            });
        }

        public setLayerMask(mask: number): void {
            this.layerMask = mask;
            this.getChildMeshes().forEach(mesh => {
                mesh.layerMask = mask;
            });
        }
    }
}
