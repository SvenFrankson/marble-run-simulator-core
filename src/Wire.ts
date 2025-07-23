namespace MarbleRunSimulatorCore {
    export class Wire extends BABYLON.Mesh {
        public static DEBUG_DISPLAY: boolean = false;
        public static DEBUG_SHOW_LENGTH: boolean = false;

        public debugLengthTagMesh: BABYLON.Mesh;
        public path: BABYLON.Vector3[] = [];
        public normals: BABYLON.Vector3[] = [];
        public absolutePath: BABYLON.Vector3[] = [];
        public wireSize: number;
        public get size(): number {
            if (isFinite(this.wireSize)) {
                return this.wireSize;
            }
            return this.part.wireSize;
        }
        public get radius(): number {
            return this.size * 0.5;
        }

        public colorIndex: number;
        public startTipCenter: BABYLON.Vector3;
        public startTipNormal: BABYLON.Vector3;
        public startTipDir: BABYLON.Vector3;
        public endTipCenter: BABYLON.Vector3;
        public endTipNormal: BABYLON.Vector3;
        public endTipDir: BABYLON.Vector3;

        constructor(public part: MachinePart) {
            super("wire");
            this.parent = this.part;
            this.rotationQuaternion = BABYLON.Quaternion.Identity();
        }

        public show(): void {
            this.isVisible = true;
            this.getChildMeshes().forEach((child) => {
                child.isVisible = true;
            });
        }

        public hide(): void {
            this.isVisible = false;
            this.getChildMeshes().forEach((child) => {
                child.isVisible = false;
            });
        }

        public recomputeAbsolutePath(): void {
            this.computeWorldMatrix(true);
            this.absolutePath.splice(this.path.length);
            for (let i = 0; i < this.path.length; i++) {
                if (!this.absolutePath[i]) {
                    this.absolutePath[i] = BABYLON.Vector3.Zero();
                }
                BABYLON.Vector3.TransformCoordinatesToRef(this.path[i], this.getWorldMatrix(), this.absolutePath[i]);
            }
        }

        public async instantiate(color: number = 0): Promise<void> {
            let q = this.part.machine.geometryQ;

            while (this.getChildren().length > 0) {
                this.getChildren()[0].dispose();
            }

            let n = 4;
            if (q === 2) {
                n = 6;
            }
            let shape: BABYLON.Vector3[] = [];
            for (let i = 0; i < n; i++) {
                let a = (i / n) * 2 * Math.PI;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                shape[i] = new BABYLON.Vector3(cosa * this.radius, sina * this.radius, 0);
            }

            if (!Wire.DEBUG_DISPLAY) {
                let path = [...this.path];
                if (q < 2) {
                    path = [];
                    for (let i = 0; i < this.path.length; i++) {
                        if (i % 3 === 0 || i === this.path.length - 1) {
                            path.push(this.path[i]);
                        }
                    }
                }

                if (this.startTipDir) {
                    let d = this.startTipDir
                        .clone()
                        .normalize()
                        .scaleInPlace(-1)
                        .scaleInPlace(this.part.wireGauge * 0.5);
                    Mummu.RotateInPlace(d, this.startTipNormal, -Math.PI / 2);
                    let tipPath: BABYLON.Vector3[] = [d.add(this.startTipCenter)];
                    for (let i = 0; i < 8 - 1; i++) {
                        Mummu.RotateInPlace(d, this.startTipNormal, Math.PI / 8);
                        tipPath.push(d.add(this.startTipCenter));
                    }
                    path = [...tipPath, ...path];
                }

                if (this.endTipDir) {
                    let d = this.endTipDir.clone().normalize().scaleInPlace(this.part.wireGauge * 0.5);
                    Mummu.RotateInPlace(d, this.endTipNormal, -Math.PI / 2);
                    let tipPath: BABYLON.Vector3[] = [];
                    for (let i = 0; i < 8; i++) {
                        Mummu.RotateInPlace(d, this.endTipNormal, Math.PI / 8);
                        tipPath.push(d.add(this.endTipCenter));
                    }
                    path.push(...tipPath);
                }

                let wire = BABYLON.ExtrudeShape("wire", { shape: shape, path: path, closeShape: true, cap: BABYLON.Mesh.CAP_ALL });
                wire.parent = this;
                wire.material = this.part.game.materials.getMaterial(color, this.part.machine.materialQ);
            }

            if (Wire.DEBUG_DISPLAY) {
                for (let i = 0; i < this.path.length - 1; i++) {
                    let dir = this.path[i].subtract(this.path[i + 1]).normalize();
                    let l = BABYLON.Vector3.Distance(this.path[i + 1], this.path[i]);
                    let wireSection = BABYLON.CreateCapsule("wire-section", { radius: this.size * 0.6, height: l });
                    wireSection.position
                        .copyFrom(this.path[i + 1])
                        .addInPlace(this.path[i])
                        .scaleInPlace(0.5);
                    wireSection.rotationQuaternion = BABYLON.Quaternion.Identity();
                    wireSection.parent = this;
                    Mummu.QuaternionFromYZAxisToRef(dir, BABYLON.Axis.Y, wireSection.rotationQuaternion);
                }
            }

            if (Wire.DEBUG_SHOW_LENGTH) {
                
                this.debugLengthTagMesh = new BABYLON.Mesh("wire-length-tag");
                this.debugLengthTagMesh.parent = this;
                this.debugLengthTagMesh.rotation.x = Math.PI * 0.5;

                Mummu.CreateQuadVertexData({
                    width: 0.02,
                    height: 0.02,
                    sideOrientation: 0
                }).applyToMesh(this.debugLengthTagMesh);

                let center = this.path[Math.floor(this.path.length / 2)];
                if (center) {
                    this.debugLengthTagMesh.position.copyFrom(center);
                }
                this.debugLengthTagMesh.position.y += 0.001 + 0.001 * Math.random();

                let text = this.path.length.toFixed(0);
                let texture = new BABYLON.DynamicTexture("wire-length-tag-texture", { width: 128, height: 128 });
                let context = texture.getContext();
                context.font = "64px monospace";
                context.fillStyle = "white";
                context.fillText(text, 64 - context.measureText(text).width * 0.5, 64 + 16);
                texture.update();
                let material = new BABYLON.StandardMaterial("wire-length-tag-material");
                material.diffuseTexture = texture;
                material.emissiveColor.copyFromFloats(1, 1, 1);

                this.debugLengthTagMesh.material = material;
            }
        }
    }
}
