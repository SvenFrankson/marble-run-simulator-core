namespace MarbleRunSimulatorCore {
    export class ForwardSplit extends MachinePart {
        private _animatePivot = Mummu.AnimationFactory.EmptyNumberCallback;

        public anchor: BABYLON.Mesh;
        public pivot: BABYLON.Mesh;

        public axisZMin: number = 0;
        public axisZMax: number = 1;

        public clicSound: BABYLON.Sound;
        
        public static pivotL: number = 0.013;

        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);

            this.setTemplate(this.machine.templateManager.getTemplate(ForwardSplit.PropToPartName(prop)));

            this.clicSound = new BABYLON.Sound("clic-sound", "./lib/marble-run-simulator-core/datas/sounds/clic.wav", this.getScene(), undefined, { loop: false, autoplay: false });
            this.clicSound.setVolume(0.25);

            for (let i = this.colors.length; i < 5; i++) {
                this.colors[i] = 0;
            }

            let rCurb = Split.pivotL * 0.3;

            this.anchor = new BABYLON.Mesh("anchor");
            this.anchor.position.copyFromFloats(0, -tileHeight * 0.5, -tileDepth);
            this.anchor.rotation.y = - Math.PI * 0.5;
            this.anchor.parent = this;
            
            this.pivot = new BABYLON.Mesh("pivot");
            this.pivot.position.copyFromFloats(0, -tileHeight * 0.5, -tileDepth);
            this.pivot.rotation.y = - Math.PI * 0.5;
            this.pivot.parent = this;
            let dz = this.wireGauge * 0.5;

            let wireHorizontal0 = new Wire(this);
            wireHorizontal0.colorIndex = 4;
            wireHorizontal0.parent = this.pivot;
            wireHorizontal0.path = [new BABYLON.Vector3(-Split.pivotL, 0, -dz), new BABYLON.Vector3(Split.pivotL, 0, -dz)];

            let wireHorizontal1 = new Wire(this);
            wireHorizontal1.colorIndex = 4;
            wireHorizontal1.parent = this.pivot;
            wireHorizontal1.path = [new BABYLON.Vector3(-Split.pivotL, 0, dz), new BABYLON.Vector3(Split.pivotL, 0, dz)];

            let wireVertical0 = new Wire(this);
            wireVertical0.colorIndex = 4;
            wireVertical0.parent = this.pivot;
            wireVertical0.path = [new BABYLON.Vector3(0, Split.pivotL, -dz), new BABYLON.Vector3(0, rCurb * 0.3, -dz)];

            let wireVertical1 = new Wire(this);
            wireVertical1.colorIndex = 4;
            wireVertical1.parent = this.pivot;
            wireVertical1.path = [new BABYLON.Vector3(0, Split.pivotL, dz), new BABYLON.Vector3(0, rCurb * 0.3, dz)];

            let curbLeft0 = new Wire(this);
            curbLeft0.colorIndex = 4;
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
            curbLeft1.colorIndex = 4;
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
            curbRight0.colorIndex = 4;
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
            curbRight1.colorIndex = 4;
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

        public static PropToPartName(prop: IMachinePartProp): string {
            let partName = "forwardSplit";
            return partName;
        }

        protected async instantiateMachineSpecific(): Promise<void> {
            let anchorDatas: BABYLON.VertexData[] = [];
            let tmpVertexData = BABYLON.CreateCylinderVertexData({ height: 0.001, diameter: 0.01 });
            let q = BABYLON.Quaternion.Identity();
            Mummu.QuaternionFromYZAxisToRef(new BABYLON.Vector3(0, 0, 1), new BABYLON.Vector3(0, 1, 0), q);
            Mummu.RotateVertexDataInPlace(tmpVertexData, q);
            Mummu.TranslateVertexDataInPlace(tmpVertexData, new BABYLON.Vector3(0, 0, 0.015));
            anchorDatas.push(tmpVertexData);

            this.axisZMin = -this.wireGauge * 0.6 - 0.004;
            this.axisZMax = 0.015 - 0.001 * 0.5;
            tmpVertexData = BABYLON.CreateCylinderVertexData({ height: this.axisZMax - this.axisZMin, diameter: 0.001 });
            Mummu.QuaternionFromYZAxisToRef(new BABYLON.Vector3(0, 0, 1), new BABYLON.Vector3(0, 1, 0), q);
            Mummu.RotateVertexDataInPlace(tmpVertexData, q);
            Mummu.TranslateVertexDataInPlace(tmpVertexData, new BABYLON.Vector3(0, 0, (this.axisZMax + this.axisZMin) * 0.5));
            anchorDatas.push(tmpVertexData);

            this.anchor.material = this.game.materials.getMaterial(this.getColor(4), this.machine.materialQ);
            Mummu.MergeVertexDatas(...anchorDatas).applyToMesh(this.anchor);

            let arrowData = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/splitter-arrow.babylon", 0);
            if (arrowData) {
                arrowData = Mummu.CloneVertexData(arrowData);
                Mummu.TranslateVertexDataInPlace(arrowData, new BABYLON.Vector3(0, 0, this.axisZMin));
                arrowData.applyToMesh(this.pivot);
            }
            this.pivot.material = this.game.materials.getMaterial(this.getColor(4), this.machine.materialQ);
        }

        public static GenerateTemplate(mirrorZ: boolean) {
            let template = new MachinePartTemplate();

            template.partName = "forwardSplit";

            template.l = 1;
            template.h = 1;
            template.d = 3;
            template.mirrorZ = mirrorZ;

            template.zMirrorable = true;

            template.maxAngle = Math.PI / 16;

            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();

            let pEndLeft = new BABYLON.Vector3(0, - tileHeight * 0.5, - tileDepth);
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
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.5, 0, - tileDepth), dir), 
                new TrackPoint(template.trackTemplates[0], pEndLeft.subtract(dirEnd.scale(0.001)), dirEnd)
            ];

            template.trackTemplates[1] = new TrackTemplate(template);
            template.trackTemplates[1].preferedStartBank = 0;
            template.trackTemplates[1].preferedEndBank = 0;
            template.trackTemplates[1].colorIndex = 1;
            template.trackTemplates[1].trackpoints = [
                new TrackPoint(template.trackTemplates[1],
                    new BABYLON.Vector3(0, -tileHeight * 0.5 - Split.pivotL / Math.SQRT2 - 0.001, - tileDepth + Split.pivotL / Math.SQRT2),
                    Mummu.RotateInPlace(Tools.V3Dir(135), BABYLON.Axis.Y, - Math.PI * 0.5),
                    BABYLON.Vector3.Up()
                ), 
                new TrackPoint(template.trackTemplates[1],
                    new BABYLON.Vector3(0, -tileHeight * template.h + 0.001, - 0.5 * tileWidth),
                    new BABYLON.Vector3(0, 0, 1),
                    BABYLON.Vector3.Up()
                ), 
                new TrackPoint(template.trackTemplates[1],
                    new BABYLON.Vector3(tileWidth * 0.5, -tileHeight * template.h, 0),
                    dir
                )
            ];

            template.trackTemplates[2] = new TrackTemplate(template);
            template.trackTemplates[2].preferedStartBank = 0;
            template.trackTemplates[2].colorIndex = 2;
            template.trackTemplates[2].trackpoints = [
                new TrackPoint(template.trackTemplates[2],
                    new BABYLON.Vector3(0, -tileHeight * 0.5 - Split.pivotL / Math.SQRT2 - 0.001, - tileDepth - Split.pivotL / Math.SQRT2),
                    Mummu.RotateInPlace(Tools.V3Dir(135), BABYLON.Axis.Y, Math.PI * 0.5),
                    BABYLON.Vector3.Up()
                ), 
                new TrackPoint(template.trackTemplates[2],
                    new BABYLON.Vector3(0, -tileHeight * template.h + 0.001, - 2 * tileDepth + 0.5 * tileWidth),
                    new BABYLON.Vector3(0, 0, -1),
                    BABYLON.Vector3.Up()
                ), 
                new TrackPoint(template.trackTemplates[2],
                    new BABYLON.Vector3(tileWidth * 0.5, -tileHeight * template.h, - 2 * tileDepth),
                    dir
                )
            ];

            template.trackTemplates[3] = new TrackTemplate(template);
            template.trackTemplates[3].preferedStartBank = 0;
            template.trackTemplates[3].colorIndex = 3;
            template.trackTemplates[3].trackpoints = [
                new TrackPoint(template.trackTemplates[3],
                    new BABYLON.Vector3(-tileWidth * 0.5 + 0.01, 0.016, - tileDepth),
                    dir,
                    BABYLON.Vector3.Down()
                ), 
                new TrackPoint(template.trackTemplates[3],
                    pEndLeft.add(new BABYLON.Vector3(0.019, 0, 0)),
                    BABYLON.Vector3.Down(),
                    BABYLON.Vector3.Left()
                ),
                new TrackPoint(template.trackTemplates[3],
                    pEndLeft.add(new BABYLON.Vector3(0.019, -0.008, 0)),
                    BABYLON.Vector3.Down(),
                    BABYLON.Vector3.Left()
                )
            ];
            template.trackTemplates[3].drawStartTip = true;
            template.trackTemplates[3].drawEndTip = true;
            template.trackTemplates[3].cutOutSleeper = (n) => {
                return n > 12;
            }

            template.initialize();

            return template;
        }

        public dispose(): void {
            super.dispose();
            this.machine.onStopCallbacks.remove(this.reset);
        }

        public reset = () => {
            this._exitLeft = !this.mirrorX && !this.mirrorZ;
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
        };
 
        private _exitLeft: boolean = true;
        private _moving: boolean = false;
        public update(dt: number): void {
            super.update(dt);
            if (!this._moving) {
                for (let i = 0; i < this.machine.balls.length; i++) {
                    let ball = this.machine.balls[i];
                    if (BABYLON.Vector3.Distance(ball.position, this.pivot.absolutePosition) < 0.05) {
                        let local = BABYLON.Vector3.TransformCoordinates(ball.position, this.pivot.getWorldMatrix().clone().invert());
                        if (local.y < ball.radius * 0.9) {
                            if (this._exitLeft && local.x > ball.radius * 0.5 && local.x < Split.pivotL) {
                                this._moving = true;
                                setTimeout(() => {
                                    this._animatePivot(-Math.PI / 4, 0.3 / this.game.currentTimeFactor).then(() => {
                                        this.clicSound.setPlaybackRate(this.game.currentTimeFactor);
                                        this.clicSound.play()
                                        this._moving = false;
                                        this._exitLeft = false;
                                    });
                                }, 150 / this.game.currentTimeFactor)
                                return;
                            } else if (!this._exitLeft && local.x > -Split.pivotL && local.x < -ball.radius * 0.5) {
                                this._moving = true;
                                setTimeout(() => {
                                    this._animatePivot(Math.PI / 4, 0.3 / this.game.currentTimeFactor).then(() => {
                                        this.clicSound.setPlaybackRate(this.game.currentTimeFactor);
                                        this.clicSound.play();
                                        this._moving = false;
                                        this._exitLeft = true;
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
