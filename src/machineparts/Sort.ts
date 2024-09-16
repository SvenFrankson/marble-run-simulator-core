namespace MarbleRunSimulatorCore {
    export class Sort extends MachinePart {
        private _animatePivot = Mummu.AnimationFactory.EmptyNumberCallback;

        public anchor: BABYLON.Mesh;
        public pivot: BABYLON.Mesh;

        public axisZMin: number = 0;
        public axisZMax: number = 1;

        public clicSound: BABYLON.Sound;
        
        public static pivotL: number = 0.013;

        public panel: BABYLON.Mesh;
        public panelSupport: BABYLON.Mesh;
        public panelPicture: BABYLON.Mesh;

        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);

            let partName = "sort";
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX, prop.mirrorZ));

            this.clicSound = new BABYLON.Sound("clic-sound", "./lib/marble-run-simulator-core/datas/sounds/clic.wav", this.getScene(), undefined, { loop: false, autoplay: false });
            this.clicSound.setVolume(0.25);

            for (let i = this.colors.length; i < 6; i++) {
                this.colors[i] = 0;
            }

            this.anchor = new BABYLON.Mesh("anchor");
            this.anchor.position.copyFromFloats(0, -tileHeight * 0.5, 0);
            this.anchor.parent = this;
            
            this.pivot = new BABYLON.Mesh("pivot");
            this.pivot.position.copyFromFloats(0, -tileHeight * 0.5, 0);
            this.pivot.parent = this;
            let dz = this.wireGauge * 0.5;

            this.panel = new BABYLON.Mesh("panel");
            this.panel.position = new BABYLON.Vector3(tileWidth * 0.5 - 0.014, -tileHeight, this.wireGauge * 0.5);
            this.panel.parent = this;
            
            this.panelSupport = new BABYLON.Mesh("panel-support");
            this.panelSupport.parent = this.panel;
            
            this.panelPicture = new BABYLON.Mesh("panel-picture");
            this.panelPicture.parent = this.panel;

            let wireHorizontal0 = new Wire(this);
            wireHorizontal0.colorIndex = 4;
            wireHorizontal0.parent = this.pivot;
            wireHorizontal0.path = [new BABYLON.Vector3(-Sort.pivotL, 0, -dz), new BABYLON.Vector3(Sort.pivotL, 0, -dz)];

            let wireHorizontal1 = new Wire(this);
            wireHorizontal1.colorIndex = 4;
            wireHorizontal1.parent = this.pivot;
            wireHorizontal1.path = [new BABYLON.Vector3(-Sort.pivotL, 0, dz), new BABYLON.Vector3(Sort.pivotL, 0, dz)];

            let wireVertical0 = new Wire(this);
            wireVertical0.colorIndex = 4;
            wireVertical0.parent = this.pivot;
            wireVertical0.path = [new BABYLON.Vector3(0, Sort.pivotL, -dz), new BABYLON.Vector3(0, - Sort.pivotL, -dz)];

            let wireVertical1 = new Wire(this);
            wireVertical1.colorIndex = 4;
            wireVertical1.parent = this.pivot;
            wireVertical1.path = [new BABYLON.Vector3(0, Sort.pivotL, dz), new BABYLON.Vector3(0, - Sort.pivotL, dz)];

            this.wires = [wireHorizontal0, wireHorizontal1, wireVertical0, wireVertical1];

            this.generateWires();

            this._animatePivot = Mummu.AnimationFactory.CreateNumber(
                this,
                this.pivot.rotation,
                "z",
                () => {
                    if (!this.machine.playing) {
                        this.pivot.rotation.z = (this.mirrorZ ? - 1 : 1) * Math.PI / 4;
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
            
            this.machine.onStopCallbacks.remove(this.reset);
            this.machine.onStopCallbacks.push(this.reset);
            this.reset();
        }

        protected async instantiateMachineSpecific(): Promise<void> {
            let anchorDatas: BABYLON.VertexData[] = [];

            this.axisZMin = - this.wireGauge * 0.8;
            this.axisZMax = this.wireGauge * 0.8;

            let tmpVertexData = BABYLON.CreateCylinderVertexData({ height: 0.001, diameter: 0.004 });
            let q = BABYLON.Quaternion.Identity();
            Mummu.QuaternionFromYZAxisToRef(new BABYLON.Vector3(0, 0, 1), new BABYLON.Vector3(0, 1, 0), q);
            Mummu.RotateVertexDataInPlace(tmpVertexData, q);
            Mummu.TranslateVertexDataInPlace(tmpVertexData, new BABYLON.Vector3(0, 0, this.axisZMax));
            anchorDatas.push(tmpVertexData);
            
            tmpVertexData = BABYLON.CreateCylinderVertexData({ height: 0.003, diameter: 0.003 });
            Mummu.QuaternionFromYZAxisToRef(new BABYLON.Vector3(0, 0, 1), new BABYLON.Vector3(0, 1, 0), q);
            Mummu.RotateVertexDataInPlace(tmpVertexData, q);
            Mummu.TranslateVertexDataInPlace(tmpVertexData, new BABYLON.Vector3(0, 0, this.wireGauge * 0.5));
            anchorDatas.push(tmpVertexData);
            
            tmpVertexData = BABYLON.CreateCylinderVertexData({ height: 0.003, diameter: 0.003 });
            Mummu.QuaternionFromYZAxisToRef(new BABYLON.Vector3(0, 0, 1), new BABYLON.Vector3(0, 1, 0), q);
            Mummu.RotateVertexDataInPlace(tmpVertexData, q);
            Mummu.TranslateVertexDataInPlace(tmpVertexData, new BABYLON.Vector3(0, 0, - this.wireGauge * 0.5));
            anchorDatas.push(tmpVertexData);

            tmpVertexData = BABYLON.CreateCylinderVertexData({ height: this.axisZMax - this.axisZMin, diameter: 0.001 });
            Mummu.QuaternionFromYZAxisToRef(new BABYLON.Vector3(0, 0, 1), new BABYLON.Vector3(0, 1, 0), q);
            Mummu.RotateVertexDataInPlace(tmpVertexData, q);
            Mummu.TranslateVertexDataInPlace(tmpVertexData, new BABYLON.Vector3(0, 0, (this.axisZMax + this.axisZMin) * 0.5));
            anchorDatas.push(tmpVertexData);

            let arrowData = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/splitter-arrow.babylon", 0);
            if (arrowData) {
                arrowData = Mummu.CloneVertexData(arrowData);
                Mummu.QuaternionFromYZAxisToRef(Tools.V3Dir(-45), BABYLON.Axis.Z, q);
                Mummu.RotateVertexDataInPlace(arrowData, q);
                Mummu.TranslateVertexDataInPlace(arrowData, new BABYLON.Vector3(0, 0, this.axisZMin));
                anchorDatas.push(arrowData);
            }

            this.anchor.material = this.game.materials.getMaterial(this.getColor(4));
            Mummu.MergeVertexDatas(...anchorDatas).applyToMesh(this.anchor);

            let panelData = await this.game.vertexDataLoader.get("./lib/marble-run-simulator-core/datas/meshes/panel.babylon");
            panelData[0].applyToMesh(this.panel);
            this.panel.material = this.game.materials.getMaterial(this.getColor(6));
            panelData[1].applyToMesh(this.panelSupport);
            this.panelSupport.material = this.game.materials.getMaterial(this.getColor(4));
            panelData[2].applyToMesh(this.panelPicture);
            this.panelPicture.material = this.game.materials.getBallMaterial(
                this.game.materials.baseMaterialIndexToBallMaterialIndex(this.getColor(4))
            );
        }

        public static GenerateTemplate(mirrorX: boolean, mirrorZ: boolean) {
            let template = new MachinePartTemplate();

            template.partName = "sort";

            template.w = 1;
            template.h = 1;
            template.mirrorX = mirrorX;
            template.mirrorZ = mirrorZ;

            template.xMirrorable = true;
            template.zMirrorable = true;

            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();

            let pEndLeft = new BABYLON.Vector3(0, - tileHeight * 0.5, 0);
            pEndLeft.x -= Sort.pivotL / Math.SQRT2;
            pEndLeft.y += Sort.pivotL / Math.SQRT2;
            let pEndRight = new BABYLON.Vector3(0, - tileHeight * 0.5, 0);
            pEndRight.x += Sort.pivotL / Math.SQRT2;
            pEndRight.y += Sort.pivotL / Math.SQRT2;
            let dirEnd = Tools.V3Dir(125);

            template.trackTemplates[0] = new TrackTemplate(template);
            template.trackTemplates[0].colorIndex = 0;
            template.trackTemplates[0].trackpoints = [
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.5, 0, 0), dir), 
                new TrackPoint(template.trackTemplates[0], pEndLeft.subtract(dirEnd.scale(0.001)), dirEnd)
            ];

            template.trackTemplates[1] = new TrackTemplate(template);
            template.trackTemplates[1].colorIndex = 1;
            template.trackTemplates[1].trackpoints = [
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(Sort.pivotL / Math.SQRT2, -tileHeight * 0.5 - Sort.pivotL / Math.SQRT2 - 0.001, 0), dirEnd), 
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(tileWidth * 0.5, -tileHeight * template.h, 0), dir)
            ];

            template.trackTemplates[2] = new TrackTemplate(template);
            template.trackTemplates[2].colorIndex = 2;
            template.trackTemplates[2].trackpoints = [
                new TrackPoint(template.trackTemplates[2], new BABYLON.Vector3(-tileWidth * 0.5, -tileHeight * template.h, 0), dir), 
                new TrackPoint(template.trackTemplates[2], new BABYLON.Vector3(-Sort.pivotL / Math.SQRT2, -tileHeight * 0.5 - Sort.pivotL / Math.SQRT2 - 0.001, 0), dirEnd.multiplyByFloats(1, -1, 1))
            ];

            template.trackTemplates[3] = new TrackTemplate(template);
            template.trackTemplates[3].colorIndex = 3;
            template.trackTemplates[3].trackpoints = [
                new TrackPoint(template.trackTemplates[3], new BABYLON.Vector3(-tileWidth * 0.25, 0.016, 0), Tools.V3Dir(100), new BABYLON.Vector3(0, -1, 0)),
                new TrackPoint(template.trackTemplates[3], pEndRight.add(Tools.V3Dir(45, 0.003)), Tools.V3Dir(135), Tools.V3Dir(225)),
            ];
            template.trackTemplates[3].drawStartTip = true;
            template.trackTemplates[3].drawEndTip = true;

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
                this.pivot.rotation.z = - (this.mirrorZ ? - 1 : 1) * Math.PI / 4;
            } else {
                this.pivot.rotation.z = (this.mirrorZ ? - 1 : 1) * Math.PI / 4;
            }
            this.pivot.freezeWorldMatrix();
            this.pivot.getChildMeshes().forEach((child) => {
                child.freezeWorldMatrix();
            });
            this.wires.forEach((wire) => {
                wire.recomputeAbsolutePath();
            });
        };
 
        private _moving: boolean = false;
        public update(dt: number): void {
            if (!this._moving) {
                for (let i = 0; i < this.machine.balls.length; i++) {
                    let ball = this.machine.balls[i];
                    if (BABYLON.Vector3.Distance(ball.position, this.pivot.absolutePosition) < 0.05) {
                        let local = ball.position.subtract(this.position);
                        if (local.y < 0.08) {
                            let sortBallMaterialIndex = this.game.materials.baseMaterialIndexToBallMaterialIndex(this.getColor(4));
                            let exitLeft = true;
                            if (ball.materialIndex === sortBallMaterialIndex) {
                                exitLeft = false;
                            }

                            if (exitLeft && Math.abs(local.x) < 0.001) {
                                this._moving = true;
                                setTimeout(() => {
                                    this._animatePivot(this.pivot.rotation.z + Math.PI / 2, 0.3 / this.game.currentTimeFactor).then(() => {
                                        this.clicSound.setPlaybackRate(this.game.currentTimeFactor);
                                        this.clicSound.play()
                                        this._moving = false;
                                    });
                                }, 150 / this.game.currentTimeFactor)
                                return;
                            }
                            else if (!exitLeft && Math.abs(local.x) < 0.001) {
                                this._moving = true;
                                setTimeout(() => {
                                    this._animatePivot(this.pivot.rotation.z - Math.PI / 2, 0.3 / this.game.currentTimeFactor).then(() => {
                                        this.clicSound.setPlaybackRate(this.game.currentTimeFactor);
                                        this.clicSound.play();
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
