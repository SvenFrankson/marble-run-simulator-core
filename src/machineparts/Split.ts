namespace MarbleRunSimulatorCore {
    export class Split extends MachinePart {
        private _animatePivot = Mummu.AnimationFactory.EmptyNumberCallback;

        public pivot: BABYLON.Mesh;
        public static pivotL: number = 0.013;

        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);

            let partName = "split";
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX));

            for (let i = this.colors.length; i < 6; i++) {
                this.colors[i] = 0;
            }

            let rCurb = Split.pivotL * 0.3;

            let anchorDatas: BABYLON.VertexData[] = [];
            let tmpVertexData = BABYLON.CreateCylinderVertexData({ height: 0.001, diameter: 0.01 });
            let q = BABYLON.Quaternion.Identity();
            Mummu.QuaternionFromYZAxisToRef(new BABYLON.Vector3(0, 0, 1), new BABYLON.Vector3(0, 1, 0), q);
            Mummu.RotateVertexDataInPlace(tmpVertexData, q);
            Mummu.TranslateVertexDataInPlace(tmpVertexData, new BABYLON.Vector3(0, 0, 0.015));
            anchorDatas.push(tmpVertexData);

            let axisZMin = -this.wireGauge * 0.6;
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

            this.pivot = new BABYLON.Mesh("pivot");
            this.pivot.position.copyFromFloats(0, -tileHeight * 0.5, 0);
            this.pivot.material = this.game.materials.getMetalMaterial(this.getColor(4));
            this.pivot.parent = this;
            let dz = this.wireGauge * 0.5;
            this.game.vertexDataLoader.get("./lib/marble-run-simulator-core/datas/meshes/splitter-arrow.babylon").then((datas) => {
                if (datas[0]) {
                    let data = Mummu.CloneVertexData(datas[0]);
                    Mummu.TranslateVertexDataInPlace(data, new BABYLON.Vector3(0, 0, axisZMin));
                    data.applyToMesh(this.pivot);
                }
            });

            let wireHorizontal0 = new Wire(this);
            wireHorizontal0.colorIndex = 5;
            wireHorizontal0.parent = this.pivot;
            wireHorizontal0.path = [new BABYLON.Vector3(-Split.pivotL, 0, -dz), new BABYLON.Vector3(Split.pivotL, 0, -dz)];

            let wireHorizontal1 = new Wire(this);
            wireHorizontal1.colorIndex = 5;
            wireHorizontal1.parent = this.pivot;
            wireHorizontal1.path = [new BABYLON.Vector3(-Split.pivotL, 0, dz), new BABYLON.Vector3(Split.pivotL, 0, dz)];

            let wireVertical0 = new Wire(this);
            wireVertical0.colorIndex = 5;
            wireVertical0.parent = this.pivot;
            wireVertical0.path = [new BABYLON.Vector3(0, Split.pivotL, -dz), new BABYLON.Vector3(0, rCurb * 0.3, -dz)];

            let wireVertical1 = new Wire(this);
            wireVertical1.colorIndex = 5;
            wireVertical1.parent = this.pivot;
            wireVertical1.path = [new BABYLON.Vector3(0, Split.pivotL, dz), new BABYLON.Vector3(0, rCurb * 0.3, dz)];

            let curbLeft0 = new Wire(this);
            curbLeft0.colorIndex = 5;
            curbLeft0.wireSize = this.wireSize * 0.8;
            curbLeft0.parent = this.pivot;
            curbLeft0.path = [];
            for (let i = 0; i <= 8; i++) {
                let a = ((Math.PI / 2) * i) / 8;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                curbLeft0.path.push(new BABYLON.Vector3(-rCurb + cosa * rCurb, rCurb - sina * rCurb, -dz));
            }

            let curbLeft1 = new Wire(this);
            curbLeft1.colorIndex = 5;
            curbLeft1.wireSize = this.wireSize * 0.8;
            curbLeft1.parent = this.pivot;
            curbLeft1.path = [];
            for (let i = 0; i <= 8; i++) {
                let a = ((Math.PI / 2) * i) / 8;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                curbLeft1.path.push(new BABYLON.Vector3(-rCurb + cosa * rCurb, rCurb - sina * rCurb, dz));
            }

            let curbRight0 = new Wire(this);
            curbRight0.colorIndex = 5;
            curbRight0.wireSize = this.wireSize * 0.8;
            curbRight0.parent = this.pivot;
            curbRight0.path = [];
            for (let i = 0; i <= 8; i++) {
                let a = ((Math.PI / 2) * i) / 8;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                curbRight0.path.push(new BABYLON.Vector3(rCurb - cosa * rCurb, rCurb - sina * rCurb, -dz));
            }

            let curbRight1 = new Wire(this);
            curbRight1.colorIndex = 5;
            curbRight1.wireSize = this.wireSize * 0.8;
            curbRight1.parent = this.pivot;
            curbRight1.path = [];
            for (let i = 0; i <= 8; i++) {
                let a = ((Math.PI / 2) * i) / 8;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                curbRight1.path.push(new BABYLON.Vector3(rCurb - cosa * rCurb, rCurb - sina * rCurb, dz));
            }

            this.wires = [wireHorizontal0, wireHorizontal1, curbLeft0, curbLeft1, wireVertical0, wireVertical1, curbRight0, curbRight1];

            this.generateWires();

            this._animatePivot = Mummu.AnimationFactory.CreateNumber(
                this,
                this.pivot.rotation,
                "z",
                () => {
                    if (!this.machine.playing) {
                        this.pivot.rotation.z = Math.PI / 4;
                    }
                    this.pivot.freezeWorldMatrix();
                    this.pivot.getChildMeshes().forEach((child) => {
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

            template.partName = "split";

            template.w = 1;
            template.h = 1;

            template.xMirrorable = true;

            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();

            let pEndLeft = new BABYLON.Vector3(0, - tileHeight * 0.5, 0);
            pEndLeft.x -= Split.pivotL / Math.SQRT2;
            pEndLeft.y += Split.pivotL / Math.SQRT2;
            let pEndRight = new BABYLON.Vector3(0, - tileHeight * 0.5, 0);
            pEndRight.x += Split.pivotL / Math.SQRT2;
            pEndRight.y += Split.pivotL / Math.SQRT2;
            let dirEnd = Tools.V3Dir(135);
            let nEnd = Tools.V3Dir(45);

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
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(-Split.pivotL / Math.SQRT2, -tileHeight * 0.5 - Split.pivotL / Math.SQRT2 - 0.001, 0), dirEnd.multiplyByFloats(1, -1, 1))
            ];

            template.trackTemplates[2] = new TrackTemplate(template);
            template.trackTemplates[2].colorIndex = 3;
            template.trackTemplates[2].trackpoints = [
                new TrackPoint(template.trackTemplates[2], new BABYLON.Vector3(Split.pivotL / Math.SQRT2, -tileHeight * 0.5 - Split.pivotL / Math.SQRT2 - 0.001, 0), dirEnd), 
                new TrackPoint(template.trackTemplates[2], new BABYLON.Vector3(tileWidth * 0.5, -tileHeight * template.h, 0), dir)
            ];

            template.trackTemplates[3] = new TrackTemplate(template);
            template.trackTemplates[3].colorIndex = 1;
            template.trackTemplates[3].trackpoints = [
                new TrackPoint(template.trackTemplates[3], new BABYLON.Vector3(tileWidth * 0.5, 0, 0), dir.multiplyByFloats(-1, 1, 1)), 
                new TrackPoint(template.trackTemplates[3], pEndRight.subtract(dirEnd.scale(0.001).multiplyByFloats(-1, 1, 1)), dirEnd.multiplyByFloats(-1, 1, 1))
            ];

            template.trackTemplates[4] = new TrackTemplate(template);
            template.trackTemplates[4].colorIndex = 4;
            template.trackTemplates[4].trackpoints = [
                new TrackPoint(template.trackTemplates[4], new BABYLON.Vector3(-tileWidth * 0.25, 0.016, 0), Tools.V3Dir(100), new BABYLON.Vector3(0, -1, 0)),
                new TrackPoint(template.trackTemplates[4], new BABYLON.Vector3(0, 0.005, 0)),
                new TrackPoint(template.trackTemplates[4], new BABYLON.Vector3(tileWidth * 0.25, 0.016, 0), Tools.V3Dir(80), new BABYLON.Vector3(0, -1, 0)),
            ];
            template.trackTemplates[4].drawStartTip = true;
            template.trackTemplates[4].drawEndTip = true;

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
                this.pivot.rotation.z = -Math.PI / 4;
            } else {
                this.pivot.rotation.z = Math.PI / 4;
            }
            this.pivot.freezeWorldMatrix();
            this.pivot.getChildMeshes().forEach((child) => {
                child.freezeWorldMatrix();
            });
        };

        private _moving: boolean = false;
        public update(dt: number): void {
            if (!this._moving) {
                for (let i = 0; i < this.machine.balls.length; i++) {
                    let ball = this.machine.balls[i];
                    if (BABYLON.Vector3.Distance(ball.position, this.pivot.absolutePosition) < 0.05) {
                        let local = BABYLON.Vector3.TransformCoordinates(ball.position, this.pivot.getWorldMatrix().clone().invert());
                        if (local.y < ball.radius * 0.9) {
                            if (local.x > ball.radius * 0.5 && local.x < Split.pivotL) {
                                this._moving = true;
                                setTimeout(() => {
                                    this._animatePivot(-Math.PI / 4, 0.3 / this.game.currentTimeFactor).then(() => {
                                        this._moving = false;
                                    });
                                }, 150 / this.game.currentTimeFactor)
                                return;
                            } else if (local.x > -Split.pivotL && local.x < -ball.radius * 0.5) {
                                this._moving = true;
                                setTimeout(() => {
                                    this._animatePivot(Math.PI / 4, 0.3 / this.game.currentTimeFactor).then(() => {
                                        this._moving = false;
                                    });
                                }, 150 / this.game.currentTimeFactor)
                                return;
                            }
                        }
                    }
                }
            }
        }
    }
}
