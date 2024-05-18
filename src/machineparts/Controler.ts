namespace MarbleRunSimulatorCore {
    export class Controler extends MachinePart {
        private _animatePivot = Mummu.AnimationFactory.EmptyNumberCallback;

        public pivotPass: BABYLON.Mesh;
        public pivotControler: BABYLON.Mesh;
        public static pivotL: number = 0.013;

        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);

            let partName = "controler";
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX));

            for (let i = this.colors.length; i < 6; i++) {
                this.colors[i] = 0;
            }

            let rCurb = Controler.pivotL * 0.3;

            let anchorDatas: BABYLON.VertexData[] = [];
            let tmpVertexData = BABYLON.CreateCylinderVertexData({ height: 0.001, diameter: 0.01 });
            let q = BABYLON.Quaternion.Identity();
            Mummu.QuaternionFromYZAxisToRef(new BABYLON.Vector3(0, 0, 1), new BABYLON.Vector3(0, 1, 0), q);
            Mummu.RotateVertexDataInPlace(tmpVertexData, q);
            Mummu.TranslateVertexDataInPlace(tmpVertexData, new BABYLON.Vector3(0, 0, 0.015));
            anchorDatas.push(tmpVertexData);

            let axisZMin = -this.wireGauge * 0.6 - tileDepth;
            let axisZMax = 0.015 - 0.001 * 0.5;
            tmpVertexData = BABYLON.CreateCylinderVertexData({ height: axisZMax - axisZMin, diameter: 0.001 });
            Mummu.QuaternionFromYZAxisToRef(new BABYLON.Vector3(0, 0, 1), new BABYLON.Vector3(0, 1, 0), q);
            Mummu.RotateVertexDataInPlace(tmpVertexData, q);
            Mummu.TranslateVertexDataInPlace(tmpVertexData, new BABYLON.Vector3(0, 0, (axisZMax + axisZMin) * 0.5));
            anchorDatas.push(tmpVertexData);

            let anchor = new BABYLON.Mesh("anchor");
            anchor.position.copyFromFloats(0, -tileHeight * 0.5, 0);
            anchor.parent = this;
            anchor.material = this.game.materials.getMetalMaterial(this.getColor(4));
            Mummu.MergeVertexDatas(...anchorDatas).applyToMesh(anchor);

            let anchorControler = new BABYLON.Mesh("anchor");
            anchorControler.position.copyFromFloats(0, tileHeight * 0.5, 0);
            anchorControler.parent = this;
            anchorControler.material = this.game.materials.getMetalMaterial(this.getColor(4));
            Mummu.MergeVertexDatas(...anchorDatas).applyToMesh(anchorControler);

            this.pivotPass = new BABYLON.Mesh("pivot");
            this.pivotPass.position.copyFromFloats(0, -tileHeight * 0.5, 0);
            this.pivotPass.material = this.game.materials.getMetalMaterial(this.getColor(4));
            this.pivotPass.parent = this;
            let dz = this.wireGauge * 0.5;
            this.game.vertexDataLoader.get("./lib/marble-run-simulator-core/datas/meshes/splitter-arrow.babylon").then((datas) => {
                if (datas[0]) {
                    let data = Mummu.CloneVertexData(datas[0]);
                    Mummu.TranslateVertexDataInPlace(data, new BABYLON.Vector3(0, 0, axisZMin));
                    data.applyToMesh(this.pivotPass);
                }
            });

            this.pivotControler = new BABYLON.Mesh("pivot");
            this.pivotControler.position.copyFromFloats(0, tileHeight * 0.5, 0);
            this.pivotControler.material = this.game.materials.getMetalMaterial(this.getColor(4));
            this.pivotControler.parent = this;
            this.game.vertexDataLoader.get("./lib/marble-run-simulator-core/datas/meshes/splitter-arrow.babylon").then((datas) => {
                if (datas[0]) {
                    let data = BABYLON.CreateBoxVertexData({ width: 0.001, height: 0.024, depth: 0.01 });
                    Mummu.TranslateVertexDataInPlace(data, new BABYLON.Vector3(0, -0.012, 0));
                    data.applyToMesh(this.pivotControler);
                }
            });

            let wireVertical0 = new Wire(this);
            wireVertical0.colorIndex = 5;
            wireVertical0.parent = this.pivotPass;
            wireVertical0.path = [new BABYLON.Vector3(0, Controler.pivotL, -dz - tileDepth), new BABYLON.Vector3(0, -Controler.pivotL, -dz - tileDepth)];

            let wireVertical1 = new Wire(this);
            wireVertical1.colorIndex = 5;
            wireVertical1.parent = this.pivotPass;
            wireVertical1.path = [new BABYLON.Vector3(0, Controler.pivotL, dz - tileDepth), new BABYLON.Vector3(0, -Controler.pivotL, dz - tileDepth)];

            this.wires = [wireVertical0, wireVertical1];

            this.generateWires();

            this._animatePivot = Mummu.AnimationFactory.CreateNumber(
                this,
                this.pivotPass.rotation,
                "z",
                () => {
                    if (!this.machine.playing) {
                        this.pivotPass.rotation.z = Math.PI / 4;
                    }
                    this.pivotPass.freezeWorldMatrix();
                    this.pivotPass.getChildMeshes().forEach((child) => {
                        child.freezeWorldMatrix();
                    });
                    this.pivotControler.rotation.z = -this.pivotPass.rotation.z * 0.6;
                    this.pivotControler.freezeWorldMatrix();
                    this.pivotControler.getChildMeshes().forEach((child) => {
                        child.freezeWorldMatrix();
                    });
                    this.wires.forEach((wire) => {
                        wire.recomputeAbsolutePath();
                    });
                },
                false,
                Nabu.Easing.easeInSquare
            );
            this.machine.onStopCallbacks.push(this.reset);
            this.reset();
        }

        public static GenerateTemplate(mirrorX: boolean) {
            let template = new MachinePartTemplate();

            template.partName = "controler";

            template.w = 1;
            template.h = 1;
            template.d = 2;

            template.xMirrorable = true;

            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();

            let pEndLeft = new BABYLON.Vector3(0, -tileHeight * 0.5, 0);
            pEndLeft.x -= Controler.pivotL / Math.SQRT2;
            pEndLeft.y += Controler.pivotL / Math.SQRT2;
            let pEndRight = new BABYLON.Vector3(0, -tileHeight * 0.5, 0);
            pEndRight.x += Controler.pivotL / Math.SQRT2;
            pEndRight.y += Controler.pivotL / Math.SQRT2;
            let dirEnd = Tools.V3Dir(135);

            template.trackTemplates[0] = new TrackTemplate(template);
            template.trackTemplates[0].colorIndex = 0;
            template.trackTemplates[0].trackpoints = [
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.5, 0, 0), dir),
                new TrackPoint(template.trackTemplates[0], pEndLeft.subtract(dirEnd.scale(0.001)), dirEnd)
            ];

            template.trackTemplates[1] = new TrackTemplate(template);
            template.trackTemplates[1].colorIndex = 2;
            template.trackTemplates[1].trackpoints = [
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(-tileWidth * 0.5, -tileHeight * template.h, 0), dir),
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(tileWidth * 0.5 - 0.015, -tileHeight * template.h + 0.001, 0), dir),
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(tileWidth * 0.5, -tileHeight * template.h + 0.001 + 0.015, 0), Tools.V3Dir(0), Tools.V3Dir(- 90))
            ];
            template.trackTemplates[1].drawEndTip = true;

            template.trackTemplates[2] = new TrackTemplate(template);
            template.trackTemplates[2].colorIndex = 1;
            template.trackTemplates[2].trackpoints = [
                new TrackPoint(template.trackTemplates[2], new BABYLON.Vector3(tileWidth * 0.5, 0, 0), dir.multiplyByFloats(-1, 1, 1)),
                new TrackPoint(template.trackTemplates[2], pEndRight.subtract(dirEnd.scale(0.001).multiplyByFloats(-1, 1, 1)), dirEnd.multiplyByFloats(-1, 1, 1))
            ];

            // Pass
            template.trackTemplates[3] = new TrackTemplate(template);
            template.trackTemplates[3].colorIndex = 0;
            template.trackTemplates[3].trackpoints = [
                new TrackPoint(template.trackTemplates[3], new BABYLON.Vector3(-tileWidth * 0.5, 0, - tileDepth), dir), 
                new TrackPoint(template.trackTemplates[3], pEndLeft.subtract(dirEnd.scale(0.001)).subtractFromFloats(0, 0, tileDepth), dirEnd)
            ];

            template.trackTemplates[4] = new TrackTemplate(template);
            template.trackTemplates[4].colorIndex = 2;
            template.trackTemplates[4].trackpoints = [
                new TrackPoint(template.trackTemplates[4], new BABYLON.Vector3(-tileWidth * 0.5, -tileHeight * template.h, - tileDepth), dir), 
                new TrackPoint(template.trackTemplates[4], new BABYLON.Vector3(-Split.pivotL / Math.SQRT2, -tileHeight * 0.5 - Split.pivotL / Math.SQRT2 - 0.001, - tileDepth), dirEnd.multiplyByFloats(1, -1, 1))
            ];

            template.trackTemplates[5] = new TrackTemplate(template);
            template.trackTemplates[5].colorIndex = 3;
            template.trackTemplates[5].trackpoints = [
                new TrackPoint(template.trackTemplates[5], new BABYLON.Vector3(Split.pivotL / Math.SQRT2, -tileHeight * 0.5 - Split.pivotL / Math.SQRT2 - 0.001, - tileDepth), dirEnd), 
                new TrackPoint(template.trackTemplates[5], new BABYLON.Vector3(tileWidth * 0.5, -tileHeight * template.h, - tileDepth), dir)
            ];

            template.trackTemplates[6] = new TrackTemplate(template);
            template.trackTemplates[6].colorIndex = 4;
            template.trackTemplates[6].trackpoints = [
                new TrackPoint(template.trackTemplates[6], new BABYLON.Vector3(-tileWidth * 0.25, 0.016, - tileDepth), Tools.V3Dir(100), new BABYLON.Vector3(0, -1, 0)),
                new TrackPoint(template.trackTemplates[6], new BABYLON.Vector3(0, 0.005, -tileDepth)),
                new TrackPoint(template.trackTemplates[6], new BABYLON.Vector3(tileWidth * 0.25, 0.016, - tileDepth), Tools.V3Dir(80), new BABYLON.Vector3(0, -1, 0)),
            ];
            template.trackTemplates[6].drawStartTip = true;
            template.trackTemplates[6].drawEndTip = true;

            if (mirrorX) {
                template.mirrorXTrackPointsInPlace();
            }

            template.initialize();

            return template;
        }

        public dispose(): void {
            super.dispose();
            this.machine.onStopCallbacks.remove(this.reset);
        }

        public reset = () => {
            this._moving = false;
            if (this.mirrorX) {
                this.pivotPass.rotation.z = -Math.PI / 4;
            } else {
                this.pivotPass.rotation.z = Math.PI / 4;
            }
            this.pivotControler.rotation.z = -this.pivotPass.rotation.z * 0.6;
            this.pivotPass.freezeWorldMatrix();
            this.pivotPass.getChildMeshes().forEach((child) => {
                child.freezeWorldMatrix();
            });
            this.pivotControler.freezeWorldMatrix();
            this.pivotControler.getChildMeshes().forEach((child) => {
                child.freezeWorldMatrix();
            });
        };

        private _moving: boolean = false;
        public update(dt: number): void {
            if (!this._moving) {
                for (let i = 0; i < this.machine.balls.length; i++) {
                    let ball = this.machine.balls[i];
                    if (BABYLON.Vector3.Distance(ball.position, this.pivotControler.absolutePosition) < 0.05) {
                        let local = BABYLON.Vector3.TransformCoordinates(ball.position, this.pivotControler.getWorldMatrix().clone().invert());
                        if (local.y < 0 && local.y > - 0.03) {
                            if (local.x > 0 && local.x < ball.radius * 1.1) {
                                this._moving = true;
                                ball.marbleChocSound.setVolume(1);
                                ball.marbleChocSound.play();
                                this._animatePivot(Math.PI / 4, 0.3 / this.game.currentTimeFactor).then(() => {
                                    setTimeout(() => {
                                        this._moving = false;
                                    }, 500 / this.game.currentTimeFactor);
                                });
                                return;
                            } else if (local.x < 0 && local.x > - ball.radius * 1.1) {
                                this._moving = true;
                                ball.marbleChocSound.setVolume(1);
                                ball.marbleChocSound.play();
                                this._animatePivot(-Math.PI / 4, 0.3 / this.game.currentTimeFactor).then(() => {
                                    setTimeout(() => {
                                        this._moving = false;
                                    }, 500 / this.game.currentTimeFactor);
                                });
                                return;
                            }
                        }
                    }
                }
            }
        }
    }
}