namespace MarbleRunSimulatorCore {
    export class BitSplit extends MachinePart {
        private _animatePivot = Mummu.AnimationFactory.EmptyNumberCallback;

        public pivot: BABYLON.Mesh;

        public axisZMin: number = 0;
        public axisZMax: number = 1;

        public clicSound: BABYLON.Sound;
        
        public static pivotL: number = 0.013;

        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);
            this.setColorCount(5);

            this.setTemplate(this.machine.templateManager.getTemplate(BitSplit.PropToPartName(prop), prop.mirrorX, prop.mirrorX));

            this.clicSound = new BABYLON.Sound("clic-sound", "./lib/marble-run-simulator-core/datas/sounds/clic.wav", this.getScene(), undefined, { loop: false, autoplay: false });
            this.clicSound.setVolume(0.25);

            let rCurb = BitSplit.pivotL * 0.3;
            
            this.pivot = new BABYLON.Mesh("pivot");
            this.pivot.position.copyFromFloats(0, tileHeight * 0.5, 0);
            this.pivot.parent = this;
            let dz = this.wireGauge * 0.5;

            let wireHorizontal0 = new Wire(this);
            wireHorizontal0.colorIndex = 4;
            wireHorizontal0.parent = this.pivot;
            wireHorizontal0.path = [new BABYLON.Vector3(-BitSplit.pivotL, 0, -dz), new BABYLON.Vector3(BitSplit.pivotL, 0, -dz)];

            let wireHorizontal1 = new Wire(this);
            wireHorizontal1.colorIndex = 4;
            wireHorizontal1.parent = this.pivot;
            wireHorizontal1.path = [new BABYLON.Vector3(-BitSplit.pivotL, 0, dz), new BABYLON.Vector3(BitSplit.pivotL, 0, dz)];

            let wireVertical0 = new Wire(this);
            wireVertical0.colorIndex = 4;
            wireVertical0.parent = this.pivot;
            wireVertical0.path = [new BABYLON.Vector3(0, BitSplit.pivotL, -dz), new BABYLON.Vector3(0, rCurb * 0.3, -dz)];

            let wireVertical1 = new Wire(this);
            wireVertical1.colorIndex = 4;
            wireVertical1.parent = this.pivot;
            wireVertical1.path = [new BABYLON.Vector3(0, BitSplit.pivotL, dz), new BABYLON.Vector3(0, rCurb * 0.3, dz)];

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
                        this.pivot.rotation.z = (this.mirrorX ? - 1 : 1) * Math.PI / 4;
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
            return "bitsplit";
        }

        protected async instantiateMachineSpecific(): Promise<void> {
            let pivotDatas: BABYLON.VertexData[] = [];

            this.axisZMin = - 0.015 + 0.0005;
            this.axisZMax = 0.015 - 0.0005;

            let tmpVertexData = BABYLON.CreateCylinderVertexData({ height: this.axisZMax - this.axisZMin, diameter: 0.001 });
            let q = BABYLON.Quaternion.Identity();
            Mummu.QuaternionFromYZAxisToRef(new BABYLON.Vector3(0, 0, 1), new BABYLON.Vector3(0, 1, 0), q);
            Mummu.RotateVertexDataInPlace(tmpVertexData, q);
            Mummu.TranslateVertexDataInPlace(tmpVertexData, new BABYLON.Vector3(0, 0, (this.axisZMax + this.axisZMin) * 0.5));
            pivotDatas.push(tmpVertexData);

            let arrowData = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/splitter-arrow.babylon", 0);
            if (arrowData) {
                arrowData = Mummu.CloneVertexData(arrowData);
                Mummu.TranslateVertexDataInPlace(arrowData, new BABYLON.Vector3(0, 0, this.axisZMin));
                pivotDatas.push(arrowData);
                arrowData = Mummu.CloneVertexData(arrowData);
                Mummu.MirrorZVertexDataInPlace(arrowData);
                pivotDatas.push(arrowData);
            }

            Mummu.MergeVertexDatas(...pivotDatas).applyToMesh(this.pivot);

            this.pivot.material = this.game.materials.getMaterial(this.getColor(4), this.machine.materialQ);
        }

        public static GenerateTemplate(mirror: boolean) {
            let template = new MachinePartTemplate();

            template.partName = "bitsplit";

            template.mirror = mirror;

            template.mirrorable = true;

            template.maxAngle = 0;

            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();

            let pEndLeft = new BABYLON.Vector3(0, tileHeight * 0.5, 0);
            pEndLeft.x -= BitSplit.pivotL / Math.SQRT2;
            pEndLeft.y += BitSplit.pivotL / Math.SQRT2;
            let pEndRight = new BABYLON.Vector3(0, tileHeight * 0.5, 0);
            pEndRight.x += BitSplit.pivotL / Math.SQRT2;
            pEndRight.y += BitSplit.pivotL / Math.SQRT2;
            let dirEnd = Tools.V3Dir(115);
            let dirEndMirror = dirEnd.multiplyByFloats(1, -1, 1);

            template.trackTemplates[0] = new TrackTemplate(template);
            template.trackTemplates[0].colorIndex = 1;
            template.trackTemplates[0].trackpoints = [
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileSize * 0.5, 0, 0), dir), 
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(0, 0.002, 0), dir), 
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileSize * 0.5, 0, 0), dir)
            ];

            template.initialize();

            return template;
        }

        public dispose(): void {
            super.dispose();
            this.machine.onStopCallbacks.remove(this.reset);
        }

        public reset = () => {
            this._exitLeft = !this.mirrorX;
            this._moving = false;
            this.pivot.rotation.z = (this.mirrorX ? - 1 : 1) * Math.PI / 4;
            this.pivot.freezeWorldMatrix();
            this.pivot.getChildMeshes().forEach((child) => {
                child.freezeWorldMatrix();
            });
        };

        public onPositionChanged(): void {
            this.reset();
        }
 
        private _exitLeft: boolean = true;
        private _moving: boolean = false;
        public update(dt: number): void {
            super.update(dt);
            if (!this._moving) {
                for (let i = 0; i < this.machine.balls.length; i++) {
                    let ball = this.machine.balls[i];
                    if (BABYLON.Vector3.Distance(ball.position, this.pivot.absolutePosition) < 0.02) {
                        let local = BABYLON.Vector3.TransformCoordinates(ball.position, this.pivot.getWorldMatrix().clone().invert());
                        if (local.y < ball.radius * 0.9 && Math.abs(local.z) < 0.001) {
                            if (this._exitLeft && local.x > ball.radius * 0.5 && local.x < BitSplit.pivotL) {
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
                            } else if (!this._exitLeft && local.x > -BitSplit.pivotL && local.x < -ball.radius * 0.5) {
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
