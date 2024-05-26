namespace MarbleRunSimulatorCore {
    export class Controler extends MachinePart {
        private _animatePivot = Mummu.AnimationFactory.EmptyNumberCallback;

        public pivotPass: BABYLON.Mesh;
        public pivotControler: BABYLON.Mesh;
        public pivotControlerCollider: BABYLON.Mesh;
        public support: BABYLON.Mesh;
        public cog13: BABYLON.Mesh;
        public cog8: BABYLON.Mesh;

        public axisZMin: number = 0;
        public axisZMax: number = 1;
        
        public clicSound: BABYLON.Sound;

        public static pivotL: number = 0.014;

        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);

            let partName = "controler";
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX));

            this.clicSound = new BABYLON.Sound("clic-sound", "./lib/marble-run-simulator-core/datas/sounds/clic.wav", this.getScene(), undefined, { loop: false, autoplay: false });
            this.clicSound.setVolume(0.25);

            for (let i = this.colors.length; i < 6; i++) {
                this.colors[i] = 0;
            }

            let rCurb = Controler.pivotL * 0.3;

            this.axisZMin = - this.wireGauge * 0.6 - tileDepth;
            this.axisZMax = this.wireGauge * 0.6;

            this.pivotPass = new BABYLON.Mesh("pivotPass");
            this.pivotPass.position.copyFromFloats(0, -tileHeight * 0.5, 0);
            this.pivotPass.parent = this;
            let dz = this.wireGauge * 0.5;

            this.cog13 = new BABYLON.Mesh("cog13");
            this.cog13.parent = this.pivotPass;

            this.pivotControler = new BABYLON.Mesh("pivotControler");
            this.pivotControler.position.copyFromFloats(0, tileHeight * 0.5, 0);
            this.pivotControler.parent = this;

            this.pivotControlerCollider = new BABYLON.Mesh("collider-trigger");
            this.pivotControlerCollider.isVisible = false;
            this.pivotControlerCollider.parent = this.pivotControler;

            this.cog8 = new BABYLON.Mesh("cog8");
            this.cog8.parent = this.pivotControler;

            this.support = new BABYLON.Mesh("support");
            this.support.position.copyFromFloats(0, -tileHeight * 0.5, - tileDepth * 0.5);
            this.support.parent = this;

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
                    this.pivotControler.rotation.z = -this.pivotPass.rotation.z * 8 / 13;
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
            
            this.machine.onStopCallbacks.remove(this.reset);
            this.machine.onStopCallbacks.push(this.reset);
            this.reset();
        }

        protected async instantiateMachineSpecific(): Promise<void> {
            let q = Mummu.QuaternionFromYZAxis(new BABYLON.Vector3(0, 0, 1), new BABYLON.Vector3(0, 1, 0));
            let axisPassVertexData = BABYLON.CreateCylinderVertexData({ height: tileDepth * 0.5 + this.wireGauge * 1.2, diameter: 0.001 });
            Mummu.RotateVertexDataInPlace(axisPassVertexData, q);
            Mummu.TranslateVertexDataInPlace(axisPassVertexData, new BABYLON.Vector3(0, 0, - 0.25 * tileDepth));

            let axisControlerVertexData = BABYLON.CreateCylinderVertexData({ height: tileDepth * 0.5 + this.wireGauge * 1.2, diameter: 0.001 });
            Mummu.RotateVertexDataInPlace(axisControlerVertexData, q);
            Mummu.TranslateVertexDataInPlace(axisControlerVertexData, new BABYLON.Vector3(0, tileHeight, 0.25 * tileDepth));

            let supportData = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/cog.babylon", 2);
            supportData = Mummu.MergeVertexDatas(axisControlerVertexData, axisPassVertexData, supportData);
            supportData.applyToMesh(this.support);
            this.support.material = this.game.materials.getMaterial(this.getColor(4));

            let cog8Data = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/cog.babylon", 0);
            cog8Data = Mummu.CloneVertexData(cog8Data);
            Mummu.TranslateVertexDataInPlace(cog8Data, new BABYLON.Vector3(0, 0, - tileDepth * 0.5));
            cog8Data.applyToMesh(this.cog8);
            this.cog8.material = this.game.materials.getMaterial(this.getColor(5));

            let cog13Data = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/cog.babylon", 1);
            cog13Data = Mummu.CloneVertexData(cog13Data);
            Mummu.TranslateVertexDataInPlace(cog13Data, new BABYLON.Vector3(0, 0, - tileDepth * 0.5));
            cog13Data.applyToMesh(this.cog13);
            this.cog13.material = this.game.materials.getMaterial(this.getColor(5));

            let arrowData = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/splitter-arrow.babylon", 0);
            arrowData = Mummu.CloneVertexData(arrowData);
            Mummu.TranslateVertexDataInPlace(arrowData, new BABYLON.Vector3(0, 0, this.axisZMin));
            arrowData.applyToMesh(this.pivotPass);
            this.pivotPass.material = this.game.materials.getMaterial(this.getColor(4));

            let triggerData = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/control-trigger.babylon", 0);
            triggerData.applyToMesh(this.pivotControler);
            this.pivotControler.material = this.game.materials.getMaterial(this.getColor(5));
            
            let triggerColliderData = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/control-trigger.babylon", 1);
            triggerColliderData.applyToMesh(this.pivotControlerCollider);
        }

        public static GenerateTemplate(mirrorX: boolean) {
            let template = new MachinePartTemplate();

            template.partName = "controler";

            template.w = 1;
            template.h = 1;
            template.d = 2;
            template.mirrorX = mirrorX;

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

            // Control
            // Control In Left
            template.trackTemplates[0] = new TrackTemplate(template);
            template.trackTemplates[0].colorIndex = 0;
            template.trackTemplates[0].colorIndex = 0;
            template.trackTemplates[0].trackpoints = [
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.5, 0, 0), dir),
                new TrackPoint(template.trackTemplates[0], pEndLeft.subtract(dirEnd.scale(0.001)), dirEnd)
            ];

            // Control In Right
            template.trackTemplates[1] = new TrackTemplate(template);
            template.trackTemplates[1].colorIndex = 1;
            template.trackTemplates[1].trackpoints = [
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(tileWidth * 0.5, 0, 0), dir.multiplyByFloats(-1, 1, 1)),
                new TrackPoint(template.trackTemplates[1], pEndRight.subtract(dirEnd.scale(0.001).multiplyByFloats(-1, 1, 1)), dirEnd.multiplyByFloats(-1, 1, 1))
            ];

            // Control Out
            template.trackTemplates[2] = new TrackTemplate(template);
            template.trackTemplates[2].colorIndex = 0;
            template.trackTemplates[2].trackpoints = [
                new TrackPoint(template.trackTemplates[2], new BABYLON.Vector3(-tileWidth * 0.5, -tileHeight * template.h, 0), dir),
                new TrackPoint(template.trackTemplates[2], new BABYLON.Vector3(tileWidth * 0.5 - 0.015, -tileHeight * template.h + 0.001, 0), dir),
                new TrackPoint(template.trackTemplates[2], new BABYLON.Vector3(tileWidth * 0.5, -tileHeight * template.h + 0.001 + 0.015, 0), Tools.V3Dir(0), Tools.V3Dir(- 90))
            ];
            template.trackTemplates[2].drawEndTip = true;

            // Pass
            // Pass In
            template.trackTemplates[3] = new TrackTemplate(template);
            template.trackTemplates[3].colorIndex = 2;
            template.trackTemplates[3].trackpoints = [
                new TrackPoint(template.trackTemplates[3], new BABYLON.Vector3(-tileWidth * 0.5, 0, - tileDepth), dir), 
                new TrackPoint(template.trackTemplates[3], pEndLeft.subtract(dirEnd.scale(0.001)).subtractFromFloats(0, 0, tileDepth), dirEnd)
            ];

            // Pass out Left
            template.trackTemplates[4] = new TrackTemplate(template);
            template.trackTemplates[4].colorIndex = 2;
            template.trackTemplates[4].trackpoints = [
                new TrackPoint(template.trackTemplates[4], new BABYLON.Vector3(-tileWidth * 0.5, -tileHeight * template.h, - tileDepth), dir), 
                new TrackPoint(template.trackTemplates[4], new BABYLON.Vector3(-Split.pivotL / Math.SQRT2, -tileHeight * 0.5 - Split.pivotL / Math.SQRT2 - 0.001, - tileDepth), dirEnd.multiplyByFloats(1, -1, 1))
            ];

            // Pass out Right
            template.trackTemplates[5] = new TrackTemplate(template);
            template.trackTemplates[5].colorIndex = 3;
            template.trackTemplates[5].trackpoints = [
                new TrackPoint(template.trackTemplates[5], new BABYLON.Vector3(Split.pivotL / Math.SQRT2, -tileHeight * 0.5 - Split.pivotL / Math.SQRT2 - 0.001, - tileDepth), dirEnd), 
                new TrackPoint(template.trackTemplates[5], new BABYLON.Vector3(tileWidth * 0.5, -tileHeight * template.h, - tileDepth), dir)
            ];

            // Shield
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
            this.pivotControler.rotation.z = -this.pivotPass.rotation.z * 8 / 13;
            this.pivotPass.freezeWorldMatrix();
            this.pivotPass.getChildMeshes().forEach((child) => {
                child.freezeWorldMatrix();
            });
            this.pivotControler.freezeWorldMatrix();
            this.pivotControler.getChildMeshes().forEach((child) => {
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
                    if (BABYLON.Vector3.Distance(ball.position, this.pivotControler.absolutePosition) < 0.05) {
                        let local = BABYLON.Vector3.TransformCoordinates(ball.position, this.pivotControler.getWorldMatrix().clone().invert());
                        if (local.y < 0 && local.y > - 0.03) {
                            if (local.x > 0 && local.x < ball.radius + 0.004) {
                                this._moving = true;
                                ball.marbleChocSound.setVolume(1);
                                ball.marbleChocSound.play();
                                this._animatePivot(Math.PI / 4, 0.3 / this.game.currentTimeFactor).then(() => {
                                    this.clicSound.play();
                                    setTimeout(() => {
                                        this._moving = false;
                                    }, 500 / this.game.currentTimeFactor);
                                });
                                return;
                            } else if (local.x < 0 && local.x > - ball.radius - 0.004) {
                                this._moving = true;
                                ball.marbleChocSound.setVolume(1);
                                ball.marbleChocSound.play();
                                this._animatePivot(-Math.PI / 4, 0.3 / this.game.currentTimeFactor).then(() => {
                                    this.clicSound.play();
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
