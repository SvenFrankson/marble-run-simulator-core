namespace MarbleRunSimulatorCore {
    export class LargeBitSplit extends MachinePart {
        private _animatePivot = Mummu.AnimationFactory.EmptyNumberCallback;

        public pivot: BABYLON.Mesh;
        public stepLeft: BABYLON.Mesh;
        public stepRight: BABYLON.Mesh;

        public axisZMin: number = 0;
        public axisZMax: number = 1;

        public clicSound: BABYLON.Sound;
        
        public static boxRadius: number = 0.9 * tileSize;

        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);
            this.setColorCount(3);

            this.setTemplate(this.machine.templateManager.getTemplate(LargeBitSplit.PropToPartName(prop), prop.mirrorX, prop.mirrorX));

            this.clicSound = new BABYLON.Sound("clic-sound", "./lib/marble-run-simulator-core/datas/sounds/clic.wav", this.getScene(), undefined, { loop: false, autoplay: false });
            this.clicSound.setVolume(0.25);

            this.pivot = new BABYLON.Mesh("pivot");
            if (this.machine.toonOutlineRender) {
                MainMaterials.SetAsOutlinedMesh(this.pivot);
            }
            this.pivot.position.copyFromFloats(tileSize * 0.5, tileHeight * 0.5, 0);
            this.pivot.parent = this;

            this.stepLeft = new BABYLON.Mesh("step-left");
            //this.stepLeft = BABYLON.MeshBuilder.CreateBox("stepLeft", { width: 0.006, height: 0.006, depth: tileSize });
            this.stepLeft.position.x = - tileSize * 0.5 + 0.005;
            this.stepLeft.position.y = tileHeight * 1.5 - 0.008;
            this.stepLeft.rotation.z = Math.PI / 4;
            this.stepLeft.parent = this;
            
            this.stepRight = new BABYLON.Mesh("step-right");
            //this.stepRight = BABYLON.MeshBuilder.CreateBox("stepRight", { width: 0.006, height: 0.006, depth: tileSize });
            this.stepRight.position.x = tileSize * 1.5 - 0.005;
            this.stepRight.position.y = tileHeight * 1.5 - 0.008;
            this.stepRight.rotation.z = Math.PI / 4;
            this.stepRight.parent = this;

            let dx = LargeBitSplit.boxRadius - 0.003;
            let dz = this.wireGauge * 0.5;

            let wireHorizontal0 = new Wire(this);
            wireHorizontal0.wireSize = 0.003;
            wireHorizontal0.colorIndex = 1;
            wireHorizontal0.parent = this.pivot;
            wireHorizontal0.path = [new BABYLON.Vector3(- dx, 0, -dz), new BABYLON.Vector3(dx, 0, -dz)];

            let wireHorizontal1 = new Wire(this);
            wireHorizontal1.wireSize = 0.003;
            wireHorizontal1.colorIndex = 1;
            wireHorizontal1.parent = this.pivot;
            wireHorizontal1.path = [new BABYLON.Vector3(- dx, 0, dz), new BABYLON.Vector3(dx, 0, dz)];

            let wireVertical0 = new Wire(this);
            wireVertical0.wireSize = 0.003;
            wireVertical0.colorIndex = 1;
            wireVertical0.parent = this.pivot;
            wireVertical0.path = [new BABYLON.Vector3(0, dx, -dz), new BABYLON.Vector3(0, 0, -dz)];

            let wireVertical1 = new Wire(this);
            wireVertical1.wireSize = 0.003;
            wireVertical1.colorIndex = 1;
            wireVertical1.parent = this.pivot;
            wireVertical1.path = [new BABYLON.Vector3(0, dx, dz), new BABYLON.Vector3(0, 0, dz)];

            let wireLeftP = new Wire(this);
            wireLeftP.wireSize = 0.006;
            wireLeftP.path = [];
            wireLeftP.position.copyFrom(this.pivot.position);
            wireLeftP.parent = this;
            
            let wireLeftM = new Wire(this);
            wireLeftM.wireSize = 0.006;
            wireLeftM.path = [];
            wireLeftM.position.copyFrom(this.pivot.position);
            wireLeftM.parent = this;

            let a0 = Math.PI;
            let a1 = 0.75 * Math.PI;
            for (let n = 0; n <= 4; n++) {
                let f = n / 4;
                let a = a0 * (1 - f) + a1 * f;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                wireLeftP.path.push(new BABYLON.Vector3(cosa * LargeBitSplit.boxRadius, sina * LargeBitSplit.boxRadius, dz));
                wireLeftM.path.push(new BABYLON.Vector3(cosa * LargeBitSplit.boxRadius, sina * LargeBitSplit.boxRadius, - dz));
            }

            let wireRightP = new Wire(this);
            wireRightP.wireSize = 0.006;
            wireRightP.path = [];
            wireRightP.position.copyFrom(this.pivot.position);
            wireRightP.parent = this;
            
            let wireRightM = new Wire(this);
            wireRightM.wireSize = 0.006;
            wireRightM.path = [];
            wireRightM.position.copyFrom(this.pivot.position);
            wireRightM.parent = this;

            a0 = 0;
            a1 = 0.25 * Math.PI;
            for (let n = 0; n <= 4; n++) {
                let f = n / 4;
                let a = a0 * (1 - f) + a1 * f;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                wireRightP.path.push(new BABYLON.Vector3(cosa * LargeBitSplit.boxRadius, sina * LargeBitSplit.boxRadius, dz));
                wireRightM.path.push(new BABYLON.Vector3(cosa * LargeBitSplit.boxRadius, sina * LargeBitSplit.boxRadius, - dz));
            }

            let wireBottomP = new Wire(this);
            wireBottomP.wireSize = 0.006;
            wireBottomP.path = [];
            wireBottomP.position.copyFrom(this.pivot.position);
            wireBottomP.parent = this;
            
            let wireBottomM = new Wire(this);
            wireBottomM.wireSize = 0.006;
            wireBottomM.path = [];
            wireBottomM.position.copyFrom(this.pivot.position);
            wireBottomM.parent = this;

            a0 = - 0.75 * Math.PI;
            a1 = - 0.25 * Math.PI;
            for (let n = 0; n <= 8; n++) {
                let f = n / 8;
                let a = a0 * (1 - f) + a1 * f;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                wireBottomP.path.push(new BABYLON.Vector3(cosa * LargeBitSplit.boxRadius, sina * LargeBitSplit.boxRadius, dz));
                wireBottomM.path.push(new BABYLON.Vector3(cosa * LargeBitSplit.boxRadius, sina * LargeBitSplit.boxRadius, - dz));
            }

            this.wires = [wireLeftP, wireLeftM, wireRightP, wireRightM, wireBottomP, wireBottomM, wireHorizontal0, wireHorizontal1, wireVertical0, wireVertical1];

            let stepLeftCollider = new Mummu.BoxCollider(this.stepLeft._worldMatrix);
            stepLeftCollider.width = 0.006;
            stepLeftCollider.height = 0.006;
            stepLeftCollider.depth = tileSize;

            let stepRightCollider = new Mummu.BoxCollider(this.stepLeft._worldMatrix);
            stepRightCollider.width = 0.006;
            stepRightCollider.height = 0.006;
            stepRightCollider.depth = tileSize;

            this.colliders = [new MachineCollider(stepLeftCollider), new MachineCollider(stepRightCollider)];
            this.colliders[0].bouncyness = 0.2;
            this.colliders[1].bouncyness = 0.2;

            this.outlinableMeshes = [this.pivot];

            this.generateWires();

            this.localAABBBaseMin.x = - 0.5 * tileSize;
            this.localAABBBaseMin.y = - 0.5 * tileHeight;
            this.localAABBBaseMax.x = 1.5 * tileSize;
            this.localAABBBaseMax.y = 1.5 * tileHeight;

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
            return "largesplit";
        }

        protected async instantiateMachineSpecific(): Promise<void> {
            let pivotDatas: BABYLON.VertexData[] = [];

            this.axisZMin = - this.wireGauge * 0.5 - 0.005;
            this.axisZMax = this.wireGauge * 0.5;

            let tmpVertexData = BABYLON.CreateCylinderVertexData({ height: this.axisZMax - this.axisZMin, diameter: 0.001 });
            let q = BABYLON.Quaternion.Identity();
            Mummu.QuaternionFromYZAxisToRef(new BABYLON.Vector3(0, 0, 1), new BABYLON.Vector3(0, 1, 0), q);
            Mummu.RotateVertexDataInPlace(tmpVertexData, q);
            Mummu.TranslateVertexDataInPlace(tmpVertexData, new BABYLON.Vector3(0, 0, (this.axisZMax + this.axisZMin) * 0.5));
            pivotDatas.push(tmpVertexData);

            let arrowData = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/splitter-arrow.babylon", 1);
            if (arrowData) {
                arrowData = Mummu.CloneVertexData(arrowData);
                Mummu.TranslateVertexDataInPlace(arrowData, new BABYLON.Vector3(0, - 0.007, this.axisZMin));
                pivotDatas.push(arrowData);
            }

            Mummu.MergeVertexDatas(...pivotDatas).applyToMesh(this.pivot);

            this.pivot.material = this.game.materials.getMaterial(this.getColor(2), this.machine.materialQ);
        }

        public onBeforeApplyingSelectorMeshLogicVertexData(selectorMeshLogicVertexDatas: BABYLON.VertexData[]): void {
            let bodySelector = BABYLON.CreateBoxVertexData({ width: LargeBitSplit.boxRadius * 2, height: LargeBitSplit.boxRadius * 2, depth: tileSize });
            Mummu.TranslateVertexDataInPlace(bodySelector, this.pivot.position);
            selectorMeshLogicVertexDatas.push(bodySelector);
        }

        public recomputeAbsolutePath(): void {
            let leftCollider = this.colliders[0];
            if (leftCollider.baseCollider instanceof Mummu.BoxCollider) {
                leftCollider.baseCollider.worldMatrix = this.stepLeft._worldMatrix;
            }
            let rightCollider = this.colliders[1];
            if (rightCollider.baseCollider instanceof Mummu.BoxCollider) {
                rightCollider.baseCollider.worldMatrix = this.stepRight._worldMatrix;
            }
            super.recomputeAbsolutePath();
        }

        public static GenerateTemplate(mirror: boolean) {
            let template = new MachinePartTemplate();

            template.partName = "largesplit";

            template.mirror = mirror;
            template.mirrorable = true;
            template.maxAngle = 0;

            template.initialize();

            return template;
        }

        public dispose(): void {
            super.dispose();
            this.machine.onStopCallbacks.remove(this.reset);
        }

        public reset = () => {
            this._moving = false;
            this._exitLeft = !this.mirrorX;
            this._animatePivot((this.mirrorX ? - 1 : 1) * Math.PI / 4, 0);
            this.pivot.freezeWorldMatrix();
            this.pivot.getChildMeshes().forEach((child) => {
                child.freezeWorldMatrix();
            });
        };

        public onPositionChanged(): void {
            this.reset();
        }

        public onClic = () => {};
 
        private _exitLeft: boolean = true;
        private _moving: boolean = false;
        public update(dt: number): void {
            super.update(dt);
            if (!this._moving) {
                for (let i = 0; i < this.machine.balls.length; i++) {
                    let ball = this.machine.balls[i];
                    if (BABYLON.Vector3.Distance(ball.position, this.pivot.absolutePosition) < 0.02) {
                        let local = BABYLON.Vector3.TransformCoordinates(ball.position, this.pivot.getWorldMatrix().clone().invert());
                        if (local.y < ball.radius * 1.2 && Math.abs(local.z) < 0.002) {
                            if (this._exitLeft && local.x > ball.radius * 0.5 && local.x < 1.5 * ball.radius) {
                                this._moving = true;
                                setTimeout(() => {
                                    this._animatePivot(-Math.PI / 4, 0.6 / this.game.currentTimeFactor).then(() => {
                                        this.clicSound.setPlaybackRate(this.game.currentTimeFactor);
                                        this.clicSound.play();
                                        if (this.onClic) {
                                            this.onClic();
                                        }
                                        this._moving = false;
                                        this._exitLeft = false;
                                    });
                                }, 150 / this.game.currentTimeFactor)
                                return;
                            } else if (!this._exitLeft && local.x > - 1.5 * ball.radius && local.x < -ball.radius * 0.5) {
                                this._moving = true;
                                setTimeout(() => {
                                    this._animatePivot(Math.PI / 4, 0.6 / this.game.currentTimeFactor).then(() => {
                                        this.clicSound.setPlaybackRate(this.game.currentTimeFactor);
                                        this.clicSound.play();
                                        if (this.onClic) {
                                            this.onClic();
                                        }
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
